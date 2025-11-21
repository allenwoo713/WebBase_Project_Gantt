import { Task, Dependency, DependencyType, COLUMN_WIDTH } from './types';

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

export const diffDays = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date1.getTime() - date2.getTime()) / oneDay);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
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

// Critical Path Algorithm (Simplified)
export const calculateCriticalPath = (tasks: Task[], dependencies: Dependency[]): Set<string> => {
  const criticalTasks = new Set<string>();
  
  if (tasks.length === 0) return criticalTasks;

  // Map for easy access
  const taskMap = new Map<string, { task: Task, es: number, ef: number, ls: number, lf: number, duration: number }>();
  
  tasks.forEach(t => {
    taskMap.set(t.id, {
      task: t,
      es: 0,
      ef: 0,
      ls: Infinity,
      lf: Infinity,
      duration: diffDays(t.end, t.start)
    });
  });

  // Simple Critical Path for Manual Schedule:
  // Find the task(s) that end last. Trace back dependencies that are "touching" (gap = 0).
  
  const projectEndDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
  
  // Helper to check if dates touch
  const isTight = (d1: Date, d2: Date) => Math.abs(diffDays(d1, d2)) <= 0;

  const toVisit: string[] = tasks.filter(t => diffDays(t.end, projectEndDate) === 0).map(t => t.id);
  const visited = new Set<string>();

  while(toVisit.length > 0) {
      const currentId = toVisit.pop()!;
      if(visited.has(currentId)) continue;
      visited.add(currentId);
      criticalTasks.add(currentId);

      const currentTask = tasks.find(t => t.id === currentId)!;

      // Find tasks that feed into this one
      const incoming = dependencies.filter(d => d.targetId === currentId);
      
      incoming.forEach(dep => {
          const sourceTask = tasks.find(t => t.id === dep.sourceId);
          if(sourceTask) {
              // Check if this dependency is driving the date
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