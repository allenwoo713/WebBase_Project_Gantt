import { Task, Dependency, DependencyType, COLUMN_WIDTH } from './types';

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const diffDays = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date1.getTime() - date2.getTime()) / oneDay);
};

export const formatdate = (date: Date): string => {
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
// 1. Calculate Early Start (ES) and Early Finish (EF) - Forward Pass
// 2. Calculate Late Start (LS) and Late Finish (LF) - Backward Pass
// 3. Slack = LS - ES. If Slack is 0, it's critical.
export const calculateCriticalPath = (tasks: Task[], dependencies: Dependency[]): Set<string> => {
  const criticalTasks = new Set<string>();
  
  if (tasks.length === 0) return criticalTasks;

  // Map for easy access
  const taskMap = new Map<string, { task: Task, es: number, ef: number, ls: number, lf: number, duration: number }>();
  
  // Normalize start date to 0 for calculation
  const projectStartDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
  
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

  // 1. Forward Pass
  // Needs topological sort or iterative approach. We'll do iterative for simplicity (simulating "ripples")
  let changed = true;
  while (changed) {
    changed = false;
    tasks.forEach(task => {
        const node = taskMap.get(task.id)!;
        let maxPrevEf = 0;

        // Find dependencies where this task is the target
        const incoming = dependencies.filter(d => d.targetId === task.id);
        
        incoming.forEach(dep => {
            const sourceNode = taskMap.get(dep.sourceId);
            if (!sourceNode) return;

            // Logic for FS (Finish to Start) - simplified for MVP to just FS logic mostly
            // ES of current = max(EF of previous)
            if (dep.type === DependencyType.FS) {
                 if (sourceNode.ef > maxPrevEf) maxPrevEf = sourceNode.ef;
            }
            // Add other types logic if needed
        });

        // If this task has no dependencies but is not the start, its ES is effectively its relative start day
        // However, in a strict dependency graph, ES depends on connections. 
        // For this visualizer, we align "Critical" to mean "Driving the project end date".
        // We will simply use the current dates as the 'Scheduled' dates.
    });
    // Since we are visualizing existing dates rather than auto-scheduling everything from scratch (unless in auto-mode),
    // A critical path in a manual schedule is often defined as a path where 0 slack exists relative to the final task.
    changed = false; // Break loop, using simpler method below.
  }

  // Alternative Simple Critical Path for Manual Schedule:
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

export const generatePath = (
    d: Dependency, 
    startTask: Task, 
    endTask: Task, 
    columnWidth: number,
    rowHeight: number,
    tasks: Task[]
): string => {
    const startIdx = tasks.findIndex(t => t.id === startTask.id);
    const endIdx = tasks.findIndex(t => t.id === endTask.id);
    
    // Basic layout coordinates
    const y1 = (startIdx * rowHeight) + (rowHeight / 2);
    const y2 = (endIdx * rowHeight) + (rowHeight / 2);

    // Calculate X based on global project start (needed context, passed as 0 for relative calc if not provided)
    // We assume the drawing context is shifted so 0 is project start
    // Actually, easier to pass dates directly if we knew the view start. 
    // Instead, we return a function that accepts the viewStartDate.
    return ""; // Logic moved to component for easier access to view state
};