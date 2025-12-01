# ProGantt Design Documentation

This document explains the detailed design decisions, algorithms, and implementation details of ProGantt.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Working Day Calculation](#working-day-calculation)
- [Critical Path Analysis](#critical-path-analysis)
- [Task Duration Management](#task-duration-management)
- [Dependency System](#dependency-system)
- [Gantt Chart Rendering](#gantt-chart-rendering)
- [Multi-select & Batch Operations](#multi-select--batch-operations)
- [Hours Calculation](#hours-calculation)
- [Filter System](#filter-system)
- [Design Decisions](#design-decisions)

---

## Core Concepts

### Task Model

Tasks are the fundamental unit of work in ProGantt. Each task has:

- **Temporal properties**: Start date, end date, duration
- **Assignment**: Owner and additional team members
- **Metadata**: Name, description, deliverable, status, priority
- **Metrics**: Progress, baseline score, score

**Key Design Decision**: Tasks store both `start`/`end` dates AND `duration`. The duration is always the source of truth for calculations and is measured in **working days** (not calendar days).

### Dependency Model

Dependencies define relationships between tasks:

- **FS (Finish-to-Start)**: Task B starts when Task A finishes
- **SS (Start-to-Start)**: Task B starts when Task A starts
- **FF (Finish-to-Finish)**: Task B finishes when Task A finishes
- **SF (Start-to-Finish)**: Task B finishes when Task A starts

**Current Implementation**: Dependencies are stored but only FS is fully utilized in critical path calculations. Other types are defined for future enhancement.

---

## Working Day Calculation

### Algorithm: `isWorkingDay(date, settings)`

```typescript
function isWorkingDay(date: Date, settings: ProjectSettings): boolean {
    const dateStr = formatDate(date);
    
    // 1. Check make-up days (override everything)
    if (settings.makeUpDays.includes(dateStr)) {
        return true;
    }
    
    // 2. Check holidays
    if (settings.holidays.some(h => h.date === dateStr)) {
        return false;
    }
    
    // 3. Check weekends (if enabled)
    if (!settings.includeWeekends) {
        const day = date.getDay();
        if (day === 0 || day === 6) { // Sunday or Saturday
            return false;
        }
    }
    
    return true;
}
```

**Priority Order**:
1. Make-up days (highest priority)
2. Holidays
3. Weekend mode
4. Default: working day

### Algorithm: `diffProjectDays(start, end, settings)`

Calculates the number of working days between two dates.

```typescript
function diffProjectDays(start: Date, end: Date, settings: ProjectSettings): number {
    if (settings.includeWeekends && 
        settings.holidays.length === 0 && 
        settings.makeUpDays.length === 0) {
        // Fast path: simple calendar day calculation
        return diffDays(end, start);
    }
    
    // Slow path: iterate day by day
    let count = 0;
    let current = new Date(start);
    
    while (current < end) {
        if (isWorkingDay(current, settings)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}
```

**Performance Optimization**: If there are no special rules (weekends included, no holidays, no make-up days), we use fast calendar day calculation.

### Algorithm: `addProjectDays(start, duration, settings)`

Adds a specified number of working days to a date.

```typescript
function addProjectDays(start: Date, duration: number, settings: ProjectSettings): Date {
    let current = new Date(start);
    let remaining = duration;
    
    while (remaining > 0) {
        current.setDate(current.getDate() + 1);
        if (isWorkingDay(current, settings)) {
            remaining--;
        }
    }
    
    return current;
}
```

**Key Point**: This function always returns the END of a working period. For example, adding 1 working day to Monday returns Tuesday (not Monday EOD).

---

## Critical Path Analysis

The critical path is the longest sequence of dependent tasks that determines the minimum project duration.

### Algorithm: `calculateCriticalPath(tasks, dependencies)`

Uses a **Recursive Total Float (Slack)** calculation approach, which is equivalent to the Critical Path Method (CPM) but optimized for the current data structure.

#### Step 1: Build Dependency Graph

```typescript
const successors = new Map<string, string[]>();
tasks.forEach(t => successors.set(t.id, []));
dependencies.forEach(d => {
    const list = successors.get(d.sourceId) || [];
    list.push(d.targetId);
    successors.set(d.sourceId, list);
});
```

#### Step 2: Determine Project Finish Date

The project finish date is the latest end date among all tasks.

```typescript
let projectFinishDate: Date | null = null;
let projectFinishTime = 0;

tasks.forEach(t => {
    if (t.end.getTime() > projectFinishTime) {
        projectFinishTime = t.end.getTime();
        projectFinishDate = t.end;
    }
});
```

#### Step 3: Recursive Slack Calculation (Memoized)

We calculate the "Slack" (Total Float) for each task. Slack is the amount of time a task can be delayed without delaying the project finish date.

**Formula**:
- **Terminal Tasks** (no successors): `Slack = ProjectFinish - TaskEnd`
- **Intermediate Tasks**: `Slack = min(SuccessorSlack + Gap)`
  - Where `Gap` is the working days between `TaskEnd` and `SuccessorStart`.

```typescript
const slackMap = new Map<string, number>();

const getSlack = (taskId: string): number => {
    if (slackMap.has(taskId)) return slackMap.get(taskId)!;

    const task = taskMap.get(taskId);
    const succIds = successors.get(taskId) || [];
    let minSlack = Number.MAX_VALUE;

    if (succIds.length === 0) {
        // Terminal Task
        const days = diffProjectDays(task.end, projectFinishDate!, settings);
        minSlack = Math.max(0, days - 1);
    } else {
        // Intermediate Task
        succIds.forEach(succId => {
            const succTask = taskMap.get(succId);
            const succSlack = getSlack(succId);
            
            // Calculate Gap (Free Float component)
            // Gap = diffProjectDays(End, Start) - isWorking(End) - isWorking(Start)
            const days = diffProjectDays(task.end, succTask.start, settings);
            const startWorking = isWorkingDay(task.end, settings) ? 1 : 0;
            const endWorking = isWorkingDay(succTask.start, settings) ? 1 : 0;
            const gap = Math.max(0, days - startWorking - endWorking);

            const pathSlack = succSlack + gap;
            if (pathSlack < minSlack) minSlack = pathSlack;
        });
    }

    slackMap.set(taskId, minSlack);
    return minSlack;
};
```

#### Step 4: Identify Critical Tasks

Tasks with **zero slack** are on the critical path.

```typescript
const critical = new Set<string>();
tasks.forEach(t => {
    if (getSlack(t.id) <= 0) {
        critical.add(t.id);
    }
});
return critical;
```

**Key Insight**: Tasks with **zero slack** (ES = LS) are on the critical path. Any delay in these tasks delays the entire project.

---

## Task Duration Management

### The Duration Synchronization Problem

When a user edits a task, they can modify:
- Start date
- End date
- Duration

We must maintain consistency between these three values.

### Solution: Duration as Source of Truth

**Design Decision**: `duration` is the authoritative value. When dates change, we recalculate either the start or end date to maintain the duration.

### Algorithm: `handleTaskUpdate(updatedTask)`

```typescript
function handleTaskUpdate(updatedTask: Task) {
    setTasks(prev => prev.map(t => {
        if (t.id !== updatedTask.id) return t;
        
        const startChanged = t.start.getTime() !== updatedTask.start.getTime();
        const endChanged = t.end.getTime() !== updatedTask.end.getTime();
        
        if (startChanged && !endChanged) {
            // User changed start → keep duration, recalc nothing (duration already set)
            const newDuration = diffProjectDays(updatedTask.start, updatedTask.end, settings);
            return { ...updatedTask, duration: newDuration };
        }
        
        if (!startChanged && endChanged) {
            // User changed end → recalc duration
            const newDuration = diffProjectDays(updatedTask.start, updatedTask.end, settings);
            return { ...updatedTask, duration: newDuration };
        }
        
        if (startChanged && endChanged) {
            // Both changed (drag on Gantt) → keep original duration, recalc end
            const newEnd = addProjectDays(updatedTask.start, t.duration, settings);
            return { ...updatedTask, end: newEnd };
        }
        
        return updatedTask;
    }));
}
```

**Edge Cases**:
1. User types new start date in TaskList → Duration recalculated
2. User drags task bar on Gantt → Duration preserved, end date adjusted
3. Settings change (e.g., weekend mode) → All durations recalculated

---

## Dependency System

### Rendering Dependencies

Dependencies are rendered as SVG lines connecting task bars.

#### Coordinate Calculation

```typescript
// Source task: bottom-right corner
const x1 = sourceLeft + sourceWidth;
const y1 = sourceTop + sourceHeight / 2;

// Target task: left-middle
const x2 = targetLeft;
const y2 = targetTop + targetHeight / 2;

// Path: Orthogonal routing (L-shaped)
const midX = (x1 + x2) / 2;
const path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
```

#### Dependency Creation (Drag-and-Drop)

1. User hovers over task → Connector dots appear
2. User clicks and drags from source dot
3. Line follows mouse cursor
4. User releases over target task → `handleDependencyCreate(sourceId, targetId)`
5. Validation: No duplicates, no self-dependencies
6. Dependency added to state

### Future Enhancement: Cycle Detection

Currently not implemented. A cycle would cause:
- Infinite loop in critical path calculation
- Dependency graph breaks

**Proposed Solution**: Use DFS to detect cycles before adding dependency.

```typescript
function hasCycle(sourceId: string, targetId: string, graph: Map): boolean {
    // Add proposed edge
    const visited = new Set<string>();
    
    function dfs(node: string): boolean {
        if (visited.has(node)) return true; // Cycle detected
        visited.add(node);
        
        const successors = graph.get(node) || [];
        for (const succ of successors) {
            if (dfs(succ)) return true;
        }
        
        visited.delete(node);
        return false;
    }
    
    return dfs(targetId);
}
```

---

## Gantt Chart Rendering

### Time Scale Granularity System

ProGantt supports multiple time scale views with a **"1 cell = 1 Unit"** granularity system:

| Time Scale | Grid Unit | Column Width Calculation |
|------------|-----------|-------------------------|
| **Day View** | 1 Day | Dynamic based on container width |
| **Week View** | 1 Week (7 days) | Dynamic based on container width |
| **Month View** | 1 Month | Dynamic based on container width |
| **Quarter View** | 1 Month | Dynamic based on container width |
| **Half Year View** | 1 Month | Dynamic based on container width |
| **Year View** | 1 Year | Dynamic based on container width |

### Time Grid Generation

The Gantt chart displays a grid of columns based on the selected time scale.

#### Algorithm: Date Range Generators

```typescript
// Day View: Generate daily dates
function getDatesRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(start);
    
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}

// Week View: Generate weekly dates (Mondays)
function getWeeksRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(start);
    
    // Adjust to previous Monday
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);
    
    while (current <= end) {
        dates.push(new Date(current));
        current = addDays(current, 7);
    }
    
    return dates;
}

// Month View: Generate monthly dates (1st of month)
function getMonthsRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
        dates.push(new Date(current));
        current = addMonths(current, 1);
    }
    
    return dates;
}

// Year View: Generate yearly dates (Jan 1st)
function getYearsRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(start.getFullYear(), 0, 1);
    
    while (current <= end) {
        dates.push(new Date(current));
        current = addYears(current, 1);
    }
    
    return dates;
}
```

### Dynamic Column Width Calculation

Column width is calculated dynamically to fit the container:

```typescript
const derivedColumnWidth = useMemo(() => {
    const availableWidth = containerWidth > 0 ? containerWidth - 40 : 1000;
    
    switch (timeScale) {
        case TimeScale.Year:
            // Width per year
            if (viewDays > 0) return Math.max(50, (availableWidth * 365) / viewDays);
            return 100;
            
        case TimeScale.HalfYear:
        case TimeScale.Quarter:
        case TimeScale.Month:
            // Width per month
            if (viewDays > 0) return Math.max(30, (availableWidth * 30) / viewDays);
            return 60;
            
        case TimeScale.Week:
            // Width per week
            if (viewDays > 0) return Math.max(30, (availableWidth * 7) / viewDays);
            return 50;
            
        case TimeScale.Day:
            // Width per day
            if (viewDays > 0) return Math.max(20, availableWidth / viewDays);
            return 40;
            
        default: return 40;
    }
}, [timeScale, viewDays, containerWidth]);
```

### Task Bar Positioning

Task positioning varies by time scale:

```typescript
const getTaskX = (date: Date) => {
    switch (timeScale) {
        case TimeScale.Day: 
            return diffDays(date, viewStartDate) * columnWidth;
        case TimeScale.Week: 
            return diffWeeks(date, viewStartDate) * columnWidth;
        case TimeScale.Month:
        case TimeScale.Quarter:
        case TimeScale.HalfYear: 
            return diffMonths(date, viewStartDate) * columnWidth;
        case TimeScale.Year: 
            return diffYears(date, viewStartDate) * columnWidth;
        default: 
            return diffDays(date, viewStartDate) * columnWidth;
    }
};

const getTaskWidth = (start: Date, end: Date) => {
    let width = 0;
    switch (timeScale) {
        case TimeScale.Day: 
            width = (diffDays(end, start) + 1) * columnWidth; 
            break;
        case TimeScale.Week: 
            width = (diffWeeks(end, start) + (1/7)) * columnWidth; 
            break;
        case TimeScale.Month:
        case TimeScale.Quarter:
        case TimeScale.HalfYear: 
            width = Math.max(diffMonths(end, start), 1/30) * columnWidth; 
            break;
        case TimeScale.Year: 
            width = Math.max(diffYears(end, start), 1/365) * columnWidth;
            break;
        default: 
            width = (diffDays(end, start) + 1) * columnWidth;
    }
    return Math.max(width, 2); // Minimum 2px visibility
};
```

### Zoom to Fit

The "Zoom to Fit" feature automatically adjusts the view to show all tasks:

```typescript
const handleZoomToFit = () => {
    if (tasks.length === 0) return;
    
    const minDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
    const maxDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
    
    // Add buffer
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 5);
    
    const diff = diffDays(maxDate, minDate);
    setViewStartDate(minDate);
    
    // Auto-adjust timescale based on duration
    const availableWidth = containerWidth - 40;
    
    if (diff > 730) {
        setTimeScale(TimeScale.Year);
        setViewDays(diff);
    } else if (diff > 365) {
        setTimeScale(TimeScale.HalfYear);
        setViewDays(diff);
    } else if (diff > 180) {
        setTimeScale(TimeScale.Quarter);
        setViewDays(diff);
    } else if (diff > 60) {
        setTimeScale(TimeScale.Month);
        const fittableDays = Math.floor(availableWidth / 5);
        setViewDays(Math.max(diff, fittableDays));
    } else if (diff > 20) {
        setTimeScale(TimeScale.Week);
        const fittableDays = Math.floor(availableWidth / 15);
        setViewDays(Math.max(diff, fittableDays));
    } else {
        setTimeScale(TimeScale.Day);
        const fittableDays = Math.floor(availableWidth / 40);
        setViewDays(Math.max(diff, fittableDays));
    }
};
```

### Drag Interaction

Users can resize and move task bars.

#### Resize (Dragging edges)

```typescript
const onMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - dragStart.x;
    let deltaDays = 0;
    
    // Calculate day difference based on time scale
    switch (timeScale) {
        case TimeScale.Day: 
            deltaDays = Math.round(deltaX / columnWidth); 
            break;
        case TimeScale.Week: 
            deltaDays = Math.round((deltaX / columnWidth) * 7); 
            break;
        case TimeScale.Month: 
        case TimeScale.Quarter:
        case TimeScale.HalfYear: 
            deltaDays = Math.round((deltaX / columnWidth) * 30); 
            break;
        case TimeScale.Year: 
            deltaDays = Math.round((deltaX / columnWidth) * 365); 
            break;
        default: 
            deltaDays = Math.round(deltaX / columnWidth);
    }
    
    if (resizingLeft) {
        const newStart = addDays(originalStart, deltaDays);
        onTaskUpdate({ ...task, start: newStart });
    } else {
        const newEnd = addDays(originalEnd, deltaDays);
        onTaskUpdate({ ...task, end: newEnd });
    }
};
```

#### Move (Dragging bar)

```typescript
const onMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - dragStart.x;
    let deltaDays = 0;
    
    // Calculate based on time scale
    switch (timeScale) {
        case TimeScale.Day: deltaDays = Math.round(deltaX / columnWidth); break;
        case TimeScale.Week: deltaDays = Math.round((deltaX / columnWidth) * 7); break;
        case TimeScale.Month: 
        case TimeScale.Quarter:
        case TimeScale.HalfYear: deltaDays = Math.round((deltaX / columnWidth) * 30); break;
        case TimeScale.Year: deltaDays = Math.round((deltaX / columnWidth) * 365); break;
        default: deltaDays = Math.round(deltaX / columnWidth);
    }
    
    const newStart = addDays(originalStart, deltaDays);
    const newEnd = addDays(originalEnd, deltaDays);
    
    onTaskUpdate({ ...task, start: newStart, end: newEnd });
};
```

### Scroll Synchronization

The header and chart must scroll together horizontally.

```typescript
// GanttChart reports scroll
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll(e.currentTarget.scrollLeft);
};

// App.tsx syncs header
const handleGanttScroll = (scrollLeft: number) => {
    if (headerRef.current) {
        headerRef.current.scrollLeft = scrollLeft;
    }
};
```



---

## Multi-select & Batch Operations

### Selection State (TaskList)

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

### Select All Logic

```typescript
const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedIds(new Set(tasks.map(t => t.id)));
    } else {
        setSelectedIds(new Set());
    }
};
```

### Individual Selection

```typescript
const handleSelectTask = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
        newSet.add(id);
    } else {
        newSet.delete(id);
    }
    setSelectedIds(newSet);
};
```

### Batch Delete

```typescript
const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    
    const idsArray = Array.from(selectedIds);
    onBatchDelete(idsArray);
    setSelectedIds(new Set());
};

// In App.tsx
const handleBatchDelete = (ids: string[]) => {
    setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    setDependencies(prev => prev.filter(d => 
        !ids.includes(d.sourceId) && !ids.includes(d.targetId)
    ));
    showNotification(`Deleted ${ids.length} tasks`, 'success');
};
```

**Important**: When deleting tasks, we also remove all dependencies involving those tasks to maintain data integrity.

---

## Hours Calculation

### Formula

```
totalEffort = ownerEffort + Σ(assignment.effort)
hours = (totalEffort / 100) × duration × workingDayHours
```

### Example

Given:
- Task duration: 5 days
- Owner effort: 100%
- Additional assignee: 50%
- Working day hours: 8

Calculation:
```
totalEffort = 100 + 50 = 150%
hours = (150 / 100) × 5 × 8 = 60 hours
```

### Implementation (TaskList)

```typescript
const calculateHours = (task: Task) => {
    const workingHours = settings?.workingDayHours || 8;
    const ownerEffort = task.ownerEffort || 100;
    let totalEffort = ownerEffort;
    
    if (task.assignments) {
        totalEffort += task.assignments.reduce((acc, curr) => acc + curr.effort, 0);
    }
    
    const hours = (totalEffort / 100) * task.duration * workingHours;
    return Math.round(hours * 10) / 10; // Round to 1 decimal
};
```

### CSV Export Integration

The same calculation is used in `exportTasksToCSV()`:

```typescript
const workingHours = settings?.workingDayHours || 8;
const ownerEffort = task.ownerEffort || 100;
let totalEffort = ownerEffort;

if (task.assignments) {
    totalEffort += task.assignments.reduce((acc, curr) => acc + curr.effort, 0);
}

const hours = ((totalEffort / 100) * task.duration * workingHours).toFixed(1);
```

---

## Filter System

### Filter State Structure

```typescript
interface FilterState {
    statuses: TaskStatus[];      // Multi-select
    priorities: Priority[];       // Multi-select
    ownerIds: string[];          // Multi-select
    roles: string[];             // Multi-select
    progressMin: string;         // Range min
    progressMax: string;         // Range max
    dateRangeStart: {            // Date range
        from: string;
        to: string;
    };
    dateRangeEnd: {
        from: string;
        to: string;
    };
}
```

### Filter Application

```typescript
const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
        // Multi-select filters (OR within category)
        if (filterState.statuses.length > 0 && 
            !filterState.statuses.includes(task.status || TaskStatus.NotStarted)) {
            return false;
        }
        
        if (filterState.priorities.length > 0 && 
            !filterState.priorities.includes(task.priority || Priority.Medium)) {
            return false;
        }
        
        if (filterState.ownerIds.length > 0 && 
            !filterState.ownerIds.includes(task.ownerId || '')) {
            return false;
        }
        
        if (filterState.roles.length > 0 && 
            !filterState.roles.includes(task.role || '')) {
            return false;
        }
        
        // Range filters
        if (filterState.progressMin !== '' && 
            task.progress < Number(filterState.progressMin)) {
            return false;
        }
        
        if (filterState.progressMax !== '' && 
            task.progress > Number(filterState.progressMax)) {
            return false;
        }
        
        // Date range filters
        if (filterState.dateRangeStart.from && 
            formatDate(task.start) < filterState.dateRangeStart.from) {
            return false;
        }
        
        if (filterState.dateRangeStart.to && 
            formatDate(task.start) > filterState.dateRangeStart.to) {
            return false;
        }
        
        if (filterState.dateRangeEnd.from && 
            formatDate(task.end) < filterState.dateRangeEnd.from) {
            return false;
        }
        
        if (filterState.dateRangeEnd.to && 
            formatDate(task.end) > filterState.dateRangeEnd.to) {
            return false;
        }
        
        return true;
    });
}, [tasks, filterState]);
```

**Filter Logic**: All conditions are AND-ed together. Multi-select filters use OR within the same category.

### Filter Indicator

```typescript
const isFilterActive = 
    filterState.statuses.length > 0 ||
    filterState.priorities.length > 0 ||
    filterState.ownerIds.length > 0 ||
    filterState.roles.length > 0 ||
    filterState.progressMin !== '' ||
    filterState.progressMax !== '' ||
    filterState.dateRangeStart.from !== '' ||
    filterState.dateRangeEnd.from !== '';
```

This boolean changes the filter button appearance to indicate active filters.

---

## Design Decisions

### 1. Why No State Management Library?

**Decision**: Use React's built-in state (useState, useMemo)

**Rationale**:
- Application state is relatively simple
- All state lives in one component (App.tsx)
- No complex async state synchronization
- Reduces bundle size and complexity

**Trade-off**: May need to refactor if state grows significantly

---

### 2. Why localStorage + File System?

**Decision**: Dual persistence strategy

**Rationale**:
- **localStorage**: Provides auto-save without user action (good UX)
- **File System**: Allows users to manage multiple projects
- No backend required
- Works offline by default

**Trade-off**: No cloud sync, limited storage capacity

---

### 3. Why Duration in Working Days?

**Decision**: Store duration in working days, not hours

**Rationale**:
- Gantt charts traditionally use days as the unit
- Easier to visualize and understand
- Working hours per day is configurable

**Trade-off**: Hours are derived values (calculated on-demand)

---

### 4. Why No Real-time Validation?

**Decision**: Minimal validation, rely on TypeScript types

**Rationale**:
- TypeScript provides compile-time safety
- Users can input invalid data (e.g., end < start) temporarily
- Validation happens when saving/calculating

**Trade-off**: Possible runtime errors if user enters extreme values

---

### 5. Why Orthogonal Dependency Lines?

**Decision**: Use L-shaped lines instead of curves

**Rationale**:
- Simpler SVG path generation
- Easier to understand visually
- Better performance (no curve calculations)

**Trade-off**: Less aesthetically pleasing than Bezier curves

---

### 6. Why No Backend?

**Decision**: Fully client-side application

**Rationale**:
- Zero infrastructure cost
- Works completely offline
- Privacy: all data stays local
- Simpler deployment (static hosting)

**Trade-off**: No collaboration, no cloud backup

---

### 7. Why Electron for Desktop?

**Decision**: Use Electron instead of native frameworks

**Rationale**:
- Single codebase for web and desktop
- Developers already know React
- Rich ecosystem of tools
- Easy to package and distribute

**Trade-off**: Larger bundle size (~150MB installed vs ~10MB native)

---

## Performance Considerations

### Computational Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Render task list | O(n) | n = number of tasks |
| Render Gantt chart | O(n + m) | n = tasks, m = dependencies |
| Critical path | O(n + m) | Topological sort + 2 passes |
| Filter tasks | O(n) | Linear scan |
| Working day calc | O(d) | d = calendar days in range |

### Bottlenecks

1. **Working day calculation** for large date ranges
   - Mitigated by fast-path optimization
   
2. **Gantt chart rendering** with many dependencies
   - Could use canvas instead of SVG for better performance

3. **Filter re-calculation** on every keystroke
   - Mitigated by useMemo

### Recommended Limits

- **Tasks**: Up to 500 for smooth performance
- **Dependencies**: Up to 1000
- **Date range**: Up to 2 years visible

---

## Error Handling

### Strategy

ProGantt uses a **graceful degradation** approach:

1. **Type Safety**: TypeScript prevents many errors at compile time
2. **Try-Catch**: JSON parsing and file operations wrapped in try-catch
3. **Notifications**: User-friendly error messages
4. **Default Values**: Use defaults when data is missing

### Example: Safe JSON Loading

```typescript
try {
    const data: ProjectData = JSON.parse(jsonString);
    
    const loadedTasks = (data.tasks || []).map(t => ({
        ...t,
        start: new Date(t.start),
        end: new Date(t.end),
        assignments: t.assignments || [],
        ownerEffort: t.ownerEffort ?? 100,
        // ... other defaults
    }));
    
    setTasks(loadedTasks);
} catch (err) {
    console.error(err);
    showNotification('Failed to load project data', 'error');
}
```

---

## Testing Considerations

### Unit Testing (Not Implemented)

Recommended tests:
- `isWorkingDay()` with various configurations
- `diffProjectDays()` with holidays/weekends
- `calculateCriticalPath()` with known graphs
- Date manipulation utilities

### Integration Testing (Not Implemented)

Recommended tests:
- Task CRUD operations
- Dependency creation/deletion
- Filter application
- CSV export

### E2E Testing (Partially Implemented)

A Playwright script exists for testing Gantt chart rendering.

---

## Future Design Improvements

1. **Undo/Redo System**: Command pattern with history stack
2. **Optimistic UI Updates**: Immediate feedback with rollback on error
3. **Virtual Scrolling**: Render only visible tasks
4. **Incremental Critical Path**: Only recalculate affected subgraph
5. **Dependency Cycle Detection**: Prevent invalid dependencies
6. **Backend Integration**: REST API for cloud storage
7. **Real-time Collaboration**: Operational Transform or CRDT
