export enum ViewMode {
  Table = 'TABLE',
  Gantt = 'GANTT',
  Split = 'SPLIT'
}

export enum TimeScale {
  Day = 'DAY',
  Month = 'MONTH',
  Quarter = 'QUARTER',
  HalfYear = 'HALF_YEAR',
  Year = 'YEAR'
}

export enum DependencyType {
  FS = 'FS', // Finish to Start
  FF = 'FF', // Finish to Finish
  SF = 'SF', // Start to Finish
  SS = 'SS'  // Start to Start
}

export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

export enum TaskStatus {
  NotStarted = 'Not Started',
  Ongoing = 'Ongoing',
  Done = 'Done'
}

export interface Dependency {
  id: string;
  sourceId: string;
  targetId: string;
  type: DependencyType;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  color?: string; // Avatar bg color
}

export interface TaskAssignment {
  memberId: string;
  effort: number; // 0-100 percentage
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  start: Date;
  end: Date;
  duration: number; // in days
  progress: number; // 0-100
  priority: Priority;
  status: TaskStatus; // Added status

  // Assignment
  ownerId?: string;
  ownerEffort?: number;
  assignments?: TaskAssignment[]; // Additional team members

  // Metadata
  role?: string;
  deliverable?: string;
  baselineScore?: string;
  score?: string;

  type: 'task' | 'milestone' | 'phase';
  parentId?: string;
  isExpanded?: boolean;
  color?: string;
}

export interface Holiday {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface ProjectSettings {
  showDependencies: boolean;
  includeWeekends: boolean; // If false, duration only counts Mon-Fri
  holidays: Holiday[];
  makeUpDays: string[]; // YYYY-MM-DD - Days that are working days even if they are weekends
  projectFilename?: string;
  projectSavePath?: string;
}

export interface ProjectData {
  tasks: Task[];
  dependencies: Dependency[];
  members: Member[];
  settings?: ProjectSettings;
}

export interface FilterState {
  statuses: TaskStatus[];
  priorities: Priority[];
  ownerIds: string[];
  roles: string[]; // Added roles filter
  progressMin: number | '';
  progressMax: number | '';
  dateRangeStart: { from: string; to: string }; // Task Start must be within this range
  dateRangeEnd: { from: string; to: string; };
}

declare global {
  interface Window {
    electronAPI?: {
      saveProject: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
      saveProjectAs: (data: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      loadProject: () => Promise<{ success: boolean; filePath?: string; data?: string; canceled?: boolean; error?: string }>;
      isElectron: boolean;
    };
  }
}

export const COLUMN_WIDTH = 60;
export const ROW_HEIGHT = 44;
export const HEADER_HEIGHT = 50;