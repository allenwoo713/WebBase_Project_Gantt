import { Task, Dependency, DependencyType, ProjectSettings, Holiday, Member, TaskStatus } from './types';

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

// --- Critical Path (Simplified) ---
export const calculateCriticalPath = (tasks: Task[], dependencies: Dependency[]): Set<string> => {
    // 1. Build Graph
    const adj = new Map<string, string[]>();
    const taskMap = new Map<string, Task>();

    tasks.forEach(t => {
        adj.set(t.id, []);
        taskMap.set(t.id, t);
    });

    dependencies.forEach(d => {
        if (adj.has(d.sourceId) && taskMap.has(d.targetId)) {
            adj.get(d.sourceId)?.push(d.targetId);
        }
    });

    // 2. Calculate ES (Earliest Start) and EF (Earliest Finish)
    // Topological Sort or just relaxation since it's a DAG (usually)
    // For simplicity, we just use the current dates as they should be scheduled correctly already
    // Critical path is the sequence where delay affects project end.

    // Find project end
    let maxEnd = 0;
    tasks.forEach(t => {
        if (t.end.getTime() > maxEnd) maxEnd = t.end.getTime();
    });

    // Backwards pass (LF/LS)
    // This requires a proper implementation. For now, we can identify tasks with 0 slack.
    // Slack = LS - ES.

    // A simple heuristic for visualization:
    // Tasks that end at Project End and their driving predecessors.

    const critical = new Set<string>();

    const findCritical = (taskId: string) => {
        if (critical.has(taskId)) return;
        critical.add(taskId);

        // Find dependencies that drive this task (End of pred == Start of this)
        // Assuming FS dependencies
        const task = taskMap.get(taskId);
        if (!task) return;

        const preds = dependencies.filter(d => d.targetId === taskId);
        preds.forEach(p => {
            const predTask = taskMap.get(p.sourceId);
            if (predTask) {
                // If pred ends exactly when this starts (or close enough), it's driving
                if (Math.abs(diffDays(task.start, predTask.end)) <= 1) { // 1 day buffer
                    findCritical(p.sourceId);
                }
            }
        });
    };

    // Start with tasks ending at maxEnd
    tasks.filter(t => Math.abs(diffDays(t.end, new Date(maxEnd))) <= 1).forEach(t => {
        findCritical(t.id);
    });

    return critical;
};

export const exportTasksToCSV = (tasks: Task[], members: Member[], dependencies: Dependency[], settings: ProjectSettings) => {
    // Headers
    const headers = ['ID', 'Name', 'Start Date', 'End Date', 'Duration', 'Hours', 'Progress', 'Status', 'Priority', 'Owner', 'Role', 'Assignments', 'Predecessors'];

    // Rows
    const rows = tasks.map(task => {
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
        // Formula: ((OwnerEffort + Sum(AssignEffort)) / 100) * Duration * WorkingHours
        const totalEffort = (task.ownerEffort || 0) + (task.assignments || []).reduce((sum, a) => sum + (a.effort || 0), 0);
        const workingHours = settings.workingDayHours || 8;
        const hours = ((totalEffort / 100) * task.duration * workingHours).toFixed(1);

        return [
            task.id,
            `"${task.name.replace(/"/g, '""')}"`, // Escape quotes
            formatDate(task.start),
            formatDate(task.end),
            task.duration,
            hours,
            `${task.progress}%`,
            task.status,
            task.priority,
            owner ? owner.name : '',
            task.role || '',
            `"${assignNames}"`,
            `"${preds}"`
        ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // Add BOM for Excel
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
};