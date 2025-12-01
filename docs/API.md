# ProGantt API Documentation

This document provides a comprehensive reference for all interfaces, types, and component props used in ProGantt.

## Table of Contents

- [Core Types](#core-types)
- [Component Interfaces](#component-interfaces)
- [Utility Functions](#utility-functions)
- [Electron API](#electron-api)

---

## Core Types

### Enums

#### `ViewMode`
Defines the application view modes.

```typescript
enum ViewMode {
    Table = 'table',
    Gantt = 'gantt',
    Split = 'split'
}
```

#### `TimeScale`
Defines the time scale for the Gantt chart.

```typescript
enum TimeScale {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Quarter = 'quarter',
    HalfYear = 'halfyear',
    Year = 'year'
}
```

#### `DependencyType`
Defines task dependency relationships.

```typescript
enum DependencyType {
    FS = 'FS',  // Finish-to-Start
    SS = 'SS',  // Start-to-Start
    FF = 'FF',  // Finish-to-Finish
    SF = 'SF'   // Start-to-Finish
}
```

#### `Priority`
Task priority levels.

```typescript
enum Priority {
    Low = 'low',
    Medium = 'medium',
    High = 'high'
}
```

#### `TaskStatus`
Task status values.

```typescript
enum TaskStatus {
    NotStarted = 'not-started',
    InProgress = 'in-progress',
    Completed = 'completed',
    OnHold = 'on-hold'
}
```

---

### Main Interfaces

#### `Task`
Represents a project task.

```typescript
interface Task {
    id: string;                         // Unique identifier
    name: string;                       // Task name
    start: Date;                        // Start date
    end: Date;                          // End date
    duration: number;                   // Duration in working days
    progress: number;                   // Completion percentage (0-100)
    actualStart?: Date;                 // Actual start date
    actualEnd?: Date;                   // Actual end date
    type: 'task' | 'milestone';         // Task type
    ownerId?: string;                   // Assigned owner (member ID)
    ownerEffort?: number;               // Owner's effort percentage (default: 100)
    assignments?: TaskAssignment[];     // Additional assignees
    priority?: Priority;                // Task priority
    status?: TaskStatus;                // Task status
    role?: string;                      // Role/category
    description?: string;               // Task description
    deliverable?: string;               // Expected deliverable
    baselineScore?: number;             // Baseline score for metrics
    score?: number;                     // Current score
}
```

#### `Dependency`
Represents a dependency between tasks.

```typescript
interface Dependency {
    id: string;                         // Unique identifier
    sourceId: string;                   // Source task ID
    targetId: string;                   // Target task ID
    type: DependencyType;               // Dependency type
}
```

#### `Member`
Represents a project team member.

```typescript
interface Member {
    id: string;                         // Unique identifier
    name: string;                       // Member name
    role: string;                       // Member role
    email?: string;                     // Email address
    phone?: string;                     // Phone number
    color: string;                      // Avatar color (hex)
}
```

#### `TaskAssignment`
Represents task assignment to additional members.

```typescript
interface TaskAssignment {
    memberId: string;                   // Member ID
    effort: number;                     // Effort percentage (0-100)
}
```

#### `Holiday`
Represents a non-working day.

```typescript
interface Holiday {
    date: string;                       // Date in YYYY-MM-DD format
    name: string;                       // Holiday name
}
```

#### `ProjectSettings`
Project configuration settings.

```typescript
interface ProjectSettings {
    showDependencies: boolean;          // Show dependency lines on Gantt
    includeWeekends: boolean;           // Count weekends in duration
    holidays: Holiday[];                // List of holidays
    makeUpDays: string[];              // Working days (YYYY-MM-DD) that override weekends
    projectFilename?: string;           // Project file name
    projectSavePath?: string;           // Saved file path
    workingDayHours?: number;           // Hours per working day (default: 8)
}
```

#### `ProjectData`
Complete project data structure for save/load.

```typescript
interface ProjectData {
    tasks: Task[];
    dependencies: Dependency[];
    members: Member[];
    settings: ProjectSettings;
}
```

#### `FilterState`
Filter configuration state.

```typescript
interface FilterState {
    statuses: TaskStatus[];             // Filter by status
    priorities: Priority[];             // Filter by priority
    ownerIds: string[];                 // Filter by owner
    roles: string[];                    // Filter by role
    progressMin: string;                // Minimum progress (0-100)
    progressMax: string;                // Maximum progress (0-100)
    dateRangeStart: {                   // Start date range
        from: string;
        to: string;
    };
    dateRangeEnd: {                     // End date range
        from: string;
        to: string;
    };
}
```

---

## Component Interfaces

### `GanttChart`

```typescript
interface GanttChartProps {
    tasks: Task[];
    dependencies: Dependency[];
    onScroll: (scrollLeft: number) => void;
    viewStartDate: Date;
    viewEndDate: Date;
    columnWidth: number;
    showCriticalPath: boolean;
    settings: ProjectSettings;
    timeScale: TimeScale;
    onTaskUpdate: (task: Task) => void;
    onDependencyDelete: (id: string) => void;
    onDependencyCreate: (sourceId: string, targetId: string) => void;
    onTaskClick: (task: Task) => void;
    criticalTaskIds: Set<string>;
}
```

### `TaskList`

```typescript
interface TaskListProps {
    tasks: Task[];
    members: Member[];
    settings: ProjectSettings;
    onTaskUpdate: (task: Task) => void;
    onTaskClick: (task: Task) => void;
    onTaskMove: (taskId: string, direction: 'up' | 'down') => void;
    onBatchDelete: (ids: string[]) => void;
    onError: (message: string) => void;
}
```

### `TaskModal`

```typescript
interface TaskModalProps {
    task: Task;
    allTasks: Task[];
    members: Member[];
    dependencies: Dependency[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task, dependencies: Dependency[]) => void;
    onDelete: (id: string) => void;
    settings: ProjectSettings;
    onError: (message: string) => void;
}
```

### `MemberManager`

```typescript
interface MemberManagerProps {
    members: Member[];
    isOpen: boolean;
    onClose: () => void;
    onUpdateMembers: (members: Member[]) => void;
}
```

### `SettingsModal`

```typescript
interface SettingsModalProps {
    settings: ProjectSettings;
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: ProjectSettings) => void;
}
```

### `FilterPanel`

```typescript
interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
    filter: FilterState;
    onFilterChange: (filter: FilterState) => void;
    onClearFilters: () => void;
}
```

---

## Utility Functions

### Date Manipulation

#### `formatDate(date: Date): string`
Formats a date to YYYY-MM-DD string.

**Parameters:**
- `date`: Date object to format

**Returns:** String in YYYY-MM-DD format

---

#### `parseDate(str: string): Date`
Parses a YYYY-MM-DD string to Date object.

**Parameters:**
- `str`: Date string in YYYY-MM-DD format

**Returns:** Date object

---

#### `addDays(date: Date, days: number): Date`
Adds days to a date.

**Parameters:**
- `date`: Starting date
- `days`: Number of days to add (can be negative)

**Returns:** New Date object

---

#### `addMonths(date: Date, months: number): Date`
Adds months to a date.

**Parameters:**
- `date`: Starting date
- `months`: Number of months to add

**Returns:** New Date object

---

#### `addYears(date: Date, years: number): Date`
Adds years to a date.

**Parameters:**
- `date`: Starting date
- `years`: Number of years to add

**Returns:** New Date object

---

#### `diffDays(d1: Date, d2: Date): number`
Calculates calendar days between two dates.

**Parameters:**
- `d1`: First date
- `d2`: Second date

**Returns:** Number of days (d1 - d2)

---

### Working Day Calculations

#### `isWorkingDay(date: Date, settings: ProjectSettings): boolean`
Checks if a date is a working day.

**Parameters:**
- `date`: Date to check
- `settings`: Project settings

**Returns:** `true` if it's a working day

**Logic:**
1. If date is in `makeUpDays`, return `true`
2. If date is a holiday, return `false`
3. If `includeWeekends` is `false` and date is weekend, return `false`
4. Otherwise return `true`

---

#### `diffProjectDays(start: Date, end: Date, settings: ProjectSettings): number`
Calculates working days between two dates.

**Parameters:**
- `start`: Start date
- `end`: End date
- `settings`: Project settings

**Returns:** Number of working days

---

#### `addProjectDays(start: Date, duration: number, settings: ProjectSettings): Date`
Adds working days to a date.

**Parameters:**
- `start`: Starting date
- `duration`: Number of working days to add
- `settings`: Project settings

**Returns:** Resulting date

---

### Analysis Functions

#### `calculateCriticalPath(tasks: Task[], dependencies: Dependency[]): Set<string>`
Identifies tasks on the critical path.

**Parameters:**
- `tasks`: All tasks
- `dependencies`: All dependencies

**Returns:** Set of task IDs on the critical path

**Algorithm:**
1. Build dependency graph
2. Determine project finish date
3. Calculate Total Float (Slack) recursively for each task
4. Identify tasks with zero slack

---

#### `getDatesRange(start: Date, end: Date): Date[]`
Generates an array of dates between start and end (daily).

**Parameters:**
- `start`: Start date
- `end`: End date

**Returns:** Array of Date objects (one per day)

---

#### `getWeeksRange(start: Date, end: Date): Date[]`
Generates an array of week start dates (Mondays) between start and end.

**Parameters:**
- `start`: Start date
- `end`: End date

**Returns:** Array of Date objects (Mondays)

---

#### `getMonthsRange(start: Date, end: Date): Date[]`
Generates an array of month start dates (1st of each month) between start and end.

**Parameters:**
- `start`: Start date
- `end`: End date

**Returns:** Array of Date objects (1st of months)

---

#### `getYearsRange(start: Date, end: Date): Date[]`
Generates an array of year start dates (Jan 1st) between start and end.

**Parameters:**
- `start`: Start date
- `end`: End date

**Returns:** Array of Date objects (Jan 1st of years)

---

#### `diffWeeks(d1: Date, d2: Date): number`
Calculates the number of weeks between two dates.

**Parameters:**
- `d1`: First date
- `d2`: Second date

**Returns:** Number of weeks (d1 - d2) / 7

---

#### `diffMonths(d1: Date, d2: Date): number`
Calculates the number of months between two dates.

**Parameters:**
- `d1`: First date
- `d2`: Second date

**Returns:** Number of months (approximate)

---

#### `diffYears(d1: Date, d2: Date): number`
Calculates the number of years between two dates.

**Parameters:**
- `d1`: First date
- `d2`: Second date

**Returns:** Number of years (approximate)

---

### Export Functions

#### `exportTasksToCSV(tasks: Task[], members: Member[], dependencies: Dependency[], settings: ProjectSettings): void`
Exports tasks to CSV file.

**Parameters:**
- `tasks`: Tasks to export
- `members`: Project members
- `dependencies`: Task dependencies
- `settings`: Project settings (for hours calculation)

**CSV Columns:**
- Index, Name, Status, Priority, Role, Owner, Owner Effort %, Additional Assignees, Hours, Start, End, Duration (days), Progress %, Type, Predecessors, Description, Deliverable, Baseline Score, Score

**Hours Calculation:**
```
totalEffort = ownerEffort + sum(assignment.effort)
hours = (totalEffort / 100) * duration * workingDayHours
```

---

## Electron API

ProGantt uses Electron's main process APIs for file operations.

### `window.electronAPI`

Available when running in Electron context.

#### `isElectron: boolean`
Indicates if app is running in Electron.

---

#### `saveProject(filePath: string, data: string): Promise<SaveResult>`
Saves project to specified path.

**Parameters:**
- `filePath`: Full path to save file
- `data`: JSON string of project data

**Returns:**
```typescript
{
    success: boolean;
    error?: string;
}
```

---

#### `saveProjectAs(data: string): Promise<SaveAsResult>`
Opens save dialog and saves project.

**Parameters:**
- `data`: JSON string of project data

**Returns:**
```typescript
{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
}
```

---

#### `loadProject(): Promise<LoadResult>`
Opens file dialog and loads project.

**Returns:**
```typescript
{
    success: boolean;
    data?: string;      // JSON string
    filePath?: string;
    error?: string;
}
```

---

#### `exportCSV(defaultPath: string, data: string): Promise<SaveAsResult>`
Opens save dialog and saves CSV file.

**Parameters:**
- `defaultPath`: Default filename
- `data`: CSV string content

**Returns:**
```typescript
{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
}
```

---

## Constants

### `INITIAL_SETTINGS`
Default project settings.

```typescript
{
    showDependencies: true,
    includeWeekends: false,
    holidays: [],
    makeUpDays: [],
    projectFilename: 'MyProject',
    projectSavePath: '',
    workingDayHours: 8
}
```

### `INITIAL_FILTER`
Default filter state (no filters applied).

```typescript
{
    statuses: [],
    priorities: [],
    ownerIds: [],
    roles: [],
    progressMin: '',
    progressMax: '',
    dateRangeStart: { from: '', to: '' },
    dateRangeEnd: { from: '', to: '' }
}
```

---

## Notes

### Date Handling
- All dates are stored as JavaScript `Date` objects internally
- Dates are formatted to `YYYY-MM-DD` for display and storage
- Date calculations use local time methods to avoid timezone issues

### Task Duration
- Duration is always in **working days** (not calendar days)
- Working days respect weekend mode, holidays, and make-up days
- Duration is automatically recalculated when dates change

### Task Hours
- Hours = `(Total Effort / 100) × Duration × Working Day Hours`
- Total Effort = Owner Effort + Sum of Assignment Efforts
- Default working day hours: 8
