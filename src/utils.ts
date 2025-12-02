import { Task, Dependency, ProjectSettings, Holiday, Member, TimeScale } from './types';

// --- Standard Date Math ---

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};

export const addYears = (date: Date, years: number): Date => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
};

export const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '';
    // CRITICAL: Use Local Time methods to prevent timezone offsets (e.g. previous day bugs)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

// Generate a sequence of dates from start to end
export const getDatesRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
    }
    return dates;
};

// Generate a sequence of weeks (Mondays)
export const getWeeksRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    // Adjust start to previous Monday
    let currentDate = new Date(startDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    currentDate.setDate(diff);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 7);
    }
    return dates;
};

// Generate a sequence of months (1st of month)
export const getMonthsRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate = addMonths(currentDate, 1);
    }
    return dates;
};

// Generate a sequence of years (1st of Jan)
export const getYearsRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate.getFullYear(), 0, 1);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate = addYears(currentDate, 1);
    }
    return dates;
};

export const diffDays = (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date1.getTime() - date2.getTime()) / oneDay);
};

export const diffWeeks = (date1: Date, date2: Date): number => {
    return diffDays(date1, date2) / 7;
};

export const diffMonths = (date1: Date, date2: Date): number => {
    let months = (date1.getFullYear() - date2.getFullYear()) * 12;
    months -= date2.getMonth();
    months += date1.getMonth();
    // Add partial month
    const daysInMonth = getDaysInMonth(date1.getFullYear(), date1.getMonth());
    months += (date1.getDate() - date2.getDate()) / daysInMonth; // Approximation for partial
    return months;
};

export const diffYears = (date1: Date, date2: Date): number => {
    return (date1.getFullYear() - date2.getFullYear()) + (diffDays(date1, new Date(date1.getFullYear(), 0, 1)) - diffDays(date2, new Date(date2.getFullYear(), 0, 1))) / 365;
};


// --- Working Days Logic (Business Days) ---

export const isDateInRange = (date: Date, startStr: string, endStr: string) => {
    const d = formatDate(date);
    return d >= startStr && d <= endStr;
};

export const getHolidayForDate = (date: Date, holidays: Holiday[]): Holiday | undefined => {
    const d = formatDate(date);
    return (holidays || []).find(h => h.date === d);
};

export const isMakeUpDay = (date: Date, makeUpDays: string[] = []) => {
    return (makeUpDays || []).includes(formatDate(date));
};

export const isWorkingDay = (date: Date, settings: ProjectSettings) => {
    // Priority 1: Make-up Days (Always working)
    if (isMakeUpDay(date, settings.makeUpDays)) {
        return true;
    }

    // Priority 2: Holidays (Always off)
    if (getHolidayForDate(date, settings.holidays)) {
        return false;
    }

    // Priority 3: Weekend (Off if includeWeekends is false)
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;

    if (!settings.includeWeekends && isWeekend) {
        return false;
    }

    return true;
};

/**
 * Calculates the number of days between two dates based on project settings (INCLUSIVE).
 * If Start = End, and it's a working day, duration is 1.
 */
export const diffProjectDays = (start: Date, end: Date, settings: ProjectSettings): number => {
    const holidays = settings.holidays || [];
    const makeUpDays = settings.makeUpDays || [];

    // Simple mode if weekends included and no holidays defined
    if (settings.includeWeekends && holidays.length === 0 && makeUpDays.length === 0) {
        // Inclusive difference: diffDays gives 0 for same day, so we add 1
        return Math.abs(diffDays(end, start)) + 1;
    }

    let count = 0;
    let current = new Date(Math.min(start.getTime(), end.getTime()));
    const target = new Date(Math.max(start.getTime(), end.getTime()));

    while (current <= target) {
        if (isWorkingDay(current, settings)) {
            count++;
        }
        current = addDays(current, 1);
    }

    return count;
};

/**
 * Adds N working days to a date.
 */
export const addProjectDays = (start: Date, days: number, settings: ProjectSettings): Date => {
    if (days <= 0) return start; // Or handle negative days if needed

    let current = new Date(start);
    let added = 0;

    // If start day itself is working, it counts as day 1? 
    // Usually "Add 2 days" means 2 *additional* days or duration of 2?
    // In Gantt context: Start + Duration 1 = Start (End is same day).
    // So we want to find End date such that diffProjectDays(Start, End) == Duration.

    // If duration is 1, we return start (if it's working) or next working day?
    // Standard logic: End Date = Start Date + (Duration - 1) working days.

    let remaining = days - 1; // We count the start day if it's working?

    // Check if start is working day. If not, find next working day as actual start?
    // But usually task start is fixed. If task starts on Sunday (non-working), duration starts counting from Monday.

    while (!isWorkingDay(current, settings)) {
        current = addDays(current, 1);
    }

    // Now current is the first working day.
    while (remaining > 0) {
        current = addDays(current, 1);
        if (isWorkingDay(current, settings)) {
            remaining--;
        }
    }

    return current;
};

// --- Critical Path (Standard CPM Implementation) ---
/**
 * Identifies the Critical Path based on Total Float calculation.
 * * Logic:
 * 1. Find Project Finish Date (max end date of all tasks).
 * 2. Calculate Slack (Total Float) for each task recursively.
 * - For tasks with no successors: Slack = Project Finish - Task End.
 * - For tasks with successors: Slack = min(Successor Slack + Gap).
 * - Gap = Successor Start - Task End (in working days).
 * 3. Tasks with 0 Slack are on the Critical Path.
 * * Note: Requires 'settings' to correctly calculate gaps across weekends/holidays.
 */
export const calculateCriticalPath = (tasks: Task[], dependencies: Dependency[], settings?: ProjectSettings): Set<string> => {
    // 1. Build Graph
    const successors = new Map<string, string[]>();
    const taskMap = new Map<string, Task>();

    tasks.forEach(t => {
        taskMap.set(t.id, t);
    });

    dependencies.forEach(d => {
        if (taskMap.has(d.sourceId) && taskMap.has(d.targetId)) {
            if (!successors.has(d.sourceId)) {
                successors.set(d.sourceId, []);
            }
            successors.get(d.sourceId)?.push(d.targetId);
        }
    });

    // 2. Find Project Finish (Max EF)
    let projectFinishTime = 0;
    let projectFinishDate: Date | null = null;

    tasks.forEach(t => {
        if (t.end.getTime() > projectFinishTime) {
            projectFinishTime = t.end.getTime();
            projectFinishDate = t.end;
        }
    });

    if (!projectFinishDate) return new Set();

    // 3. Memoized Slack Calculation (Backward Pass Logic)
    const slackMap = new Map<string, number>();

    const getSlack = (taskId: string): number => {
        if (slackMap.has(taskId)) return slackMap.get(taskId)!;

        const task = taskMap.get(taskId);
        if (!task) return 0;

        const succIds = successors.get(taskId) || [];

        let minSlack = Number.MAX_VALUE;

        if (succIds.length === 0) {
            // Terminal Task: Slack is distance to Project Finish
            // In a valid CPM schedule, the critical terminal task ends exactly at Project Finish.
            if (settings) {
                // diffProjectDays is inclusive (Start=End -> 1 day). 
                // Gap = Count - 1. 
                // E.g. End=Fri, Finish=Fri. Count=1. Gap=0.
                const days = diffProjectDays(task.end, projectFinishDate!, settings);
                minSlack = Math.max(0, days - 1);
            } else {
                // Fallback without settings (simple calendar days)
                const days = Math.abs(diffDays(task.end, projectFinishDate!));
                minSlack = days;
            }
        } else {
            // Intermediate Task: Slack = min(Successor Slack + Gap)
            succIds.forEach(succId => {
                const succTask = taskMap.get(succId);
                if (succTask) {
                    const succSlack = getSlack(succId);

                    // Calculate Gap (Free Float component between these two tasks)
                    let gap = 0;
                    if (settings) {
                        // Calculate working days between Task End and Successor Start
                        // Gap = Working Days strictly between End and Start.
                        // diffProjectDays is inclusive of both endpoints.
                        // We subtract 1 for the Start Date (if working) and 1 for the End Date (if working)
                        // to get the days *between*.
                        const days = diffProjectDays(task.end, succTask.start, settings);
                        const startWorking = isWorkingDay(task.end, settings) ? 1 : 0;
                        const endWorking = isWorkingDay(succTask.start, settings) ? 1 : 0;
                        gap = Math.max(0, days - startWorking - endWorking);
                    } else {
                        // Fallback: simple calendar days
                        // Mon->Tue is 1 day diff. Gap 0.
                        const days = diffDays(succTask.start, task.end); // task.end is earlier
                        gap = Math.max(0, days - 1);
                    }

                    const pathSlack = succSlack + gap;
                    if (pathSlack < minSlack) {
                        minSlack = pathSlack;
                    }
                }
            });
        }

        // Safety cap
        if (minSlack === Number.MAX_VALUE) minSlack = 0;

        slackMap.set(taskId, minSlack);
        return minSlack;
    };

    // 4. Identify Critical Path (Slack == 0)
    const critical = new Set<string>();

    tasks.forEach(t => {
        const slack = getSlack(t.id);
        // We use a very small threshold for float math, but with integer days, 0 is exact.
        if (slack <= 0) {
            critical.add(t.id);
        }
    });

    return critical;
};

export const exportTasksToCSV = async (tasks: Task[], members: Member[], dependencies: Dependency[], settings: ProjectSettings): Promise<{ success: boolean; canceled?: boolean }> => {
    // Headers - Reordered as requested
    // ID, Name, Start, End, Actual Start, Actual End, Duration, Hours, Progress, Status, Priority, Owner, Role, Assignments, Predecessors, Deliverable, Base Score, Score
    const headers = [
        'ID', 'Name', 'Start Date', 'End Date', 'Actual Start', 'Actual End',
        'Duration', 'Hours', 'Progress', 'Status', 'Priority',
        'Owner', 'Role', 'Assignments', 'Predecessors',
        'Deliverable', 'Base Score', 'Score'
    ];

    // Rows
    const rows = tasks.map((task, index) => {
        const owner = members.find(m => m.id === task.ownerId);
        const assignNames = (task.assignments || []).map(a => {
            const m = members.find(mem => mem.id === a.memberId);
            return m ? `${m.name} (${a.effort}%)` : '';
        }).filter(Boolean).join('; ');

        const preds = dependencies
            .filter(d => d.targetId === task.id)
            .map(d => {
                const src = tasks.find(t => t.id === d.sourceId);
                return src ? src.name : '';
            })
            .join('; ');

        // Calculate Hours
        const totalEffort = (task.ownerEffort || 0) + (task.assignments || []).reduce((sum, a) => sum + (a.effort || 0), 0);
        const workingHours = settings.workingDayHours || 8;
        const hours = ((totalEffort / 100) * task.duration * workingHours).toFixed(1);

        return [
            index + 1, // ID as row number (1-based)
            `"${task.name.replace(/"/g, '""')}"`,
            formatDate(task.start),
            formatDate(task.end),
            formatDate(task.actualStart || new Date(NaN)), // Handle undefined
            formatDate(task.actualEnd || new Date(NaN)),   // Handle undefined
            task.duration,
            hours,
            `${task.progress}%`,
            task.status,
            task.priority,
            owner ? owner.name : '',
            task.role || '',
            `"${assignNames}"`,
            `"${preds}"`,
            task.deliverable || '',
            task.baselineScore || '',
            task.score || ''
        ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // Add BOM for Excel

    if (window.electronAPI?.isElectron) {
        const defaultPath = `${settings.projectFilename || 'project'}_export.csv`;
        return await window.electronAPI.exportCSV(defaultPath, csvContent);
    } else {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${settings.projectFilename || 'project'}_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true };
    }
};

// --- Gantt Rendering Helpers ---

export const getTaskX = (date: Date, referenceDate: Date, timeScale: TimeScale, columnWidth: number): number => {
    switch (timeScale) {
        case TimeScale.Day: return diffDays(date, referenceDate) * columnWidth;
        case TimeScale.Week: return diffWeeks(date, referenceDate) * columnWidth;
        case TimeScale.Month:
        case TimeScale.Quarter:
        case TimeScale.HalfYear: return diffMonths(date, referenceDate) * columnWidth;
        case TimeScale.Year: return diffYears(date, referenceDate) * columnWidth;
        default: return diffDays(date, referenceDate) * columnWidth;
    }
};

export const getTaskWidth = (start: Date, end: Date, timeScale: TimeScale, columnWidth: number): number => {
    let width = 0;
    switch (timeScale) {
        case TimeScale.Day:
            width = (diffDays(end, start) + 1) * columnWidth;
            break;
        case TimeScale.Week:
            width = (diffWeeks(end, start) + (1 / 7)) * columnWidth;
            break;
        case TimeScale.Month:
        case TimeScale.Quarter:
        case TimeScale.HalfYear:
            // Add small buffer for visibility if start==end
            width = Math.max(diffMonths(end, start), 1 / 30) * columnWidth;
            break;
        case TimeScale.Year:
            width = Math.max(diffYears(end, start), 1 / 365) * columnWidth;
            break;
        default: width = (diffDays(end, start) + 1) * columnWidth;
    }
    return Math.max(width, 2);
};

export const calculateColumnWidth = (timeScale: TimeScale, viewDays: number, containerWidth: number): number => {
    const availableWidth = containerWidth > 0 ? containerWidth - 40 : 1000;

    switch (timeScale) {
        case TimeScale.Year:
            // Unit: Year.
            if (viewDays > 0) return Math.max(50, (availableWidth * 365) / viewDays);
            return 100;
        case TimeScale.HalfYear:
        case TimeScale.Quarter:
        case TimeScale.Month:
            // Unit: Month.
            if (viewDays > 0) return Math.max(30, (availableWidth * 30) / viewDays);
            return 60;
        case TimeScale.Week:
            // Unit: Week.
            if (viewDays > 0) return Math.max(30, (availableWidth * 7) / viewDays);
            return 50;
        case TimeScale.Day:
            if (viewDays > 0) return Math.max(20, availableWidth / viewDays);
            return 40;
        default: return 40;
    }
};

/**
 * Determines which data source to use when loading project on app startup.
 * Priority: File system > localStorage > none
 */
export const determineProjectLoadSource = (localStorageData: string | null): 'file' | 'localStorage' | 'none' => {
    if (!localStorageData) return 'none';

    try {
        const parsed = JSON.parse(localStorageData);
        const projectSavePath = parsed?.settings?.projectSavePath;

        // If we have a saved file path, prioritize loading from file
        if (projectSavePath && typeof projectSavePath === 'string' && projectSavePath.trim().length > 0) {
            return 'file';
        }

        // Otherwise, use localStorage data
        return 'localStorage';
    } catch (error) {
        // Invalid JSON, cannot use
        return 'none';
    }
};