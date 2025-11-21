import { Task, Dependency, DependencyType, ProjectSettings, Holiday } from './types';

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
    return holidays.find(h => isDateInRange(date, h.start, h.end));
};

export const isMakeUpDay = (date: Date, makeUpDays: string[] = []) => {
    return makeUpDays.includes(formatDate(date));
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
 * Calculates the number of days between two dates based on project settings.
 */
export const diffProjectDays = (start: Date, end: Date, settings: ProjectSettings): number => {
    // Simple mode if weekends included and no holidays defined
    if (settings.includeWeekends && settings.holidays.length === 0 && (!settings.makeUpDays || settings.makeUpDays.length === 0)) {
        return diffDays(end, start);
    }

    let count = 0;
    let current = new Date(start);
    current.setHours(0,0,0,0);
    const target = new Date(end);
    target.setHours(0,0,0,0);

    const direction = target >= current ? 1 : -1;

    while (current.getTime() !== target.getTime()) {
        if (direction === 1) {
             if (isWorkingDay(current, settings)) count++;
             current = addDays(current, 1);
        } else {
             current = addDays(current, -1);
             if (isWorkingDay(current, settings)) count--;
        }
    }
    return count;
};

/**
 * Adds N "Project Days" to a date.
 */
export const addProjectDays = (start: Date, duration: number, settings: ProjectSettings): Date => {
    if (settings.includeWeekends && settings.holidays.length === 0 && (!settings.makeUpDays || settings.makeUpDays.length === 0)) {
        return addDays(start, duration);
    }

    let current = new Date(start);
    let daysAdded = 0;
    
    const direction = duration >= 0 ? 1 : -1;
    const absDuration = Math.abs(duration);

    while (daysAdded < absDuration) {
        current = addDays(current, direction);
        if (isWorkingDay(current, settings)) {
            daysAdded++;
        }
    }
    return current;
};

// --- Critical Path ---

export const calculateCriticalPath = (tasks: Task[], dependencies: Dependency[]): Set<string> => {
  const criticalTasks = new Set<string>();
  
  if (tasks.length === 0) return criticalTasks;

  const projectEndDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
  
  const isTight = (d1: Date, d2: Date) => Math.abs(diffDays(d1, d2)) <= 0; // Simplified for standard days

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