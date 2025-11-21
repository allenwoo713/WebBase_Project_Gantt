import { Task, Dependency, DependencyType, ProjectSettings, Holiday, Member } from './types';

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

export const diffDays = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date1.getTime() - date2.getTime()) / oneDay);
};

// --- Working Days Logic (Business Days) ---

export const isDateInRange = (date: Date, startStr: string, endStr: string) => {
    const d = formatDate(date);
    return d >= startStr && d <= endStr;
};

export const getHolidayForDate = (date: Date, holidays: Holiday[]): Holiday | undefined => {
    return (holidays || []).find(h => isDateInRange(date, h.start, h.end));
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
        return diffDays(end, start) + 1;
    }

    let count = 0;
    let current = new Date(start);
    current.setHours(0,0,0,0);
    const target = new Date(end);
    target.setHours(0,0,0,0);

    // If end is before start, return 0 (or handle as error)
    if (target < current) return 0;

    // Inclusive Loop: iterate <= target
    while (current <= target) {
        if (isWorkingDay(current, settings)) {
            count++;
        }
        current = addDays(current, 1);
    }
    return count;
};

/**
 * Adds N "Project Days" to a date to find the End Date (INCLUSIVE).
 * If duration is 1, and start is a working day, returns start.
 */
export const addProjectDays = (start: Date, duration: number, settings: ProjectSettings): Date => {
    const holidays = settings.holidays || [];
    const makeUpDays = settings.makeUpDays || [];

    if (duration <= 0) return start;

    // Optimized path for simple calendar days
    if (settings.includeWeekends && holidays.length === 0 && makeUpDays.length === 0) {
        // Subtract 1 because the start day counts as the first day
        return addDays(start, duration - 1);
    }

    let current = new Date(start);
    let daysFound = 0;
    let safety = 0;

    // Find 'duration' number of working days. 
    // The date where we find the last working day is the End Date.
    while (daysFound < duration && safety < 5000) {
        if (isWorkingDay(current, settings)) {
            daysFound++;
        }
        
        if (daysFound === duration) {
            break;
        }
        
        current = addDays(current, 1);
        safety++;
    }
    return current;
};

// --- Critical Path ---

export const calculateCriticalPath = (tasks: Task[], dependencies: Dependency[]): Set<string> => {
  const criticalTasks = new Set<string>();
  
  if (tasks.length === 0) return criticalTasks;

  const projectEndDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
  
  const isTight = (d1: Date, d2: Date) => Math.abs(diffDays(d1, d2)) <= 1; // Adjusted for inclusive logic

  const toVisit: string[] = tasks.filter(t => diffDays(t.end, projectEndDate) === 0).map(t => t.id);
  const visited = new Set<string>();

  while(toVisit.length > 0) {
      const currentId = toVisit.pop()!;
      if(visited.has(currentId)) continue;
      visited.add(currentId);
      criticalTasks.add(currentId);

      const currentTask = tasks.find(t => t.id === currentId)!;
      const incoming = dependencies.filter(d => d.targetId === currentId);
      
      incoming.forEach(dep => {
          const sourceTask = tasks.find(t => t.id === dep.sourceId);
          if(sourceTask) {
              let driving = false;
              if (dep.type === DependencyType.FS && isTight(sourceTask.end, currentTask.start)) driving = true;
              if (dep.type === DependencyType.FF && isTight(sourceTask.end, currentTask.end)) driving = true;
              
              if(driving) {
                  toVisit.push(sourceTask.id);
              }
          }
      });
  }

  return criticalTasks;
};

// --- Export CSV ---

export const exportTasksToCSV = (tasks: Task[], members: Member[], dependencies: Dependency[]) => {
    const headers = [
        'Task Name', 
        'Priority', 
        'Role', 
        'Owner', 
        'Owner Effort', 
        'Team Members (Effort)', 
        'Start Date', 
        'End Date', 
        'Duration (Days)', 
        'Progress (%)', 
        'Predecessors', 
        'Deliverable', 
        'Baseline Score', 
        'Actual Score', 
        'Description'
    ];
    
    const rows = tasks.map(task => {
        // Owner
        const owner = members.find(m => m.id === task.ownerId)?.name || '';
        
        // Team Members
        const teamStr = (task.assignments || []).map(a => {
            const m = members.find(mem => mem.id === a.memberId);
            return m ? `${m.name} (${a.effort}%)` : '';
        }).filter(s => s).join('; ');

        // Predecessors (Task Names)
        const preds = dependencies
            .filter(d => d.targetId === task.id)
            .map(d => {
                const src = tasks.find(t => t.id === d.sourceId);
                return src ? src.name : '';
            })
            .filter(s => s)
            .join('; ');

        // Escape function for CSV fields (handles quotes, commas, newlines)
        const escape = (str: string) => {
            if (!str) return '';
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        return [
            escape(task.name),
            task.priority || 'Medium',
            escape(task.role || ''),
            escape(owner),
            task.ownerEffort || 100,
            escape(teamStr),
            formatDate(task.start),
            formatDate(task.end),
            task.duration,
            task.progress,
            escape(preds),
            escape(task.deliverable || ''),
            escape(task.baselineScore || ''),
            escape(task.score || ''),
            escape(task.description || '')
        ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n'); // Add BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tasks_export_${formatDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};