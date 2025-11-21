export enum ViewMode {
    Table = 'TABLE',
    Gantt = 'GANTT',
    Split = 'SPLIT'
  }
  
  export enum TimeScale {
    Day = 'DAY',
    Week = 'WEEK',
    Month = 'MONTH'
  }
  
  export enum DependencyType {
    FS = 'FS', // Finish to Start
    FF = 'FF', // Finish to Finish
    SF = 'SF', // Start to Finish
    SS = 'SS'  // Start to Start
  }
  
  export interface Dependency {
    id: string;
    sourceId: string;
    targetId: string;
    type: DependencyType;
  }
  
  export interface Task {
    id: string;
    name: string;
    start: Date;
    end: Date;
    duration: number; // in days
    progress: number; // 0-100
    owner: string;
    type: 'task' | 'milestone' | 'phase';
    parentId?: string;
    isExpanded?: boolean;
    color?: string;
  }
  
  export interface ProjectData {
    tasks: Task[];
    dependencies: Dependency[];
  }
  
  export const COLUMN_WIDTH = 60; // Width of a day column in pixels
  export const ROW_HEIGHT = 40;   // Height of a task row in pixels
  export const HEADER_HEIGHT = 50;