# ProGantt Architecture Documentation

## Overview

ProGantt is a desktop and web-based project management application built with React, TypeScript, and Electron. It provides Gantt chart visualization, task management, and team collaboration features.

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **TypeScript** | 5.2.2 | Type safety |
| **Vite** | 5.1.4 | Build tool and dev server |
| **Electron** | 29.1.0 | Desktop app wrapper |
| **Tailwind CSS** | 3.4.1 | Styling |
| **Lucide React** | 0.344.0 | Icon library |

### Build Tools

- **electron-builder**: Windows portable app packaging
- **electron-packager**: Alternative packaging tool
- **TypeScript Compiler**: Type checking and transpilation
- **Vite**: Development server and production bundler

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Electron (Desktop Only)         │
│  ┌───────────────────────────────────┐  │
│  │         React Application         │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │      App Component          │  │  │
│  │  │  (State Management)         │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   UI Components Layer       │  │  │
│  │  │  - GanttChart               │  │  │
│  │  │  - TaskList                 │  │  │
│  │  │  - Modals                   │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Utility Layer             │  │  │
│  │  │  - Date calculations        │  │  │
│  │  │  - Critical path analysis   │  │  │
│  │  │  - CSV export               │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      Types & Interfaces           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Directory Structure

```
ProGantt/
├── src/                          # Source files (for reference, not in build)
├── components/                   # React components
│   ├── GanttChart.tsx           # Gantt chart visualization
│   ├── TaskList.tsx             # Task table view
│   ├── TaskModal.tsx            # Task editing modal
│   ├── MemberManager.tsx        # Team member management
│   ├── SettingsModal.tsx        # Project settings
│   └── FilterPanel.tsx          # Task filtering UI
├── electron/                     # Electron main process
│   └── main.cjs                 # Main process entry point
├── docs/                         # Documentation
│   ├── API.md                   # API reference
│   ├── ARCHITECTURE.md          # This file
│   ├── DESIGN.md                # Design details
│   └── FEATURES.md              # Feature list
├── public/                       # Static assets
│   └── icon.ico                 # App icon
├── dist/                         # Build output (Vite)
├── release/                      # Electron Builder output
├── release-packager/             # Electron Packager output
├── App.tsx                       # Main application component
├── types.ts                      # TypeScript type definitions
├── utils.ts                      # Utility functions
├── index.tsx                     # React entry point
├── index.html                    # HTML template
├── index.css                     # Global styles (Tailwind)
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project configuration
```

---

## Component Architecture

### Component Hierarchy

```
App (Root Component)
├── Header (Toolbar)
│   ├── View Mode Toggle
│   ├── Add Task Button
│   ├── Members Button
│   ├── Settings Button
│   ├── Time Scale Selector
│   ├── Navigation Controls
│   ├── Filter Button
│   ├── Save Dropdown
│   └── About Button
├── FilterPanel (Conditional)
├── TaskList (View Mode: Table/Split)
│   ├── Task Rows
│   │   ├── Status Dropdown
│   │   ├── Priority Dropdown
│   │   ├── Owner Selector
│   │   ├── Date Inputs
│   │   └── Progress Bar
│   └── Batch Actions
└── GanttChart (View Mode: Gantt/Split)
    ├── Header (Date Grid)
    ├── Task Bars
    │   └── Drag Handlers
    └── Dependency Lines
        └── Delete Buttons

Modals (Conditional Rendering)
├── TaskModal
│   ├── Basic Info Tab
│   ├── Assignments Tab
│   ├── Dependencies Tab
│   └── Advanced Tab
├── MemberManager
│   ├── Add Member Form
│   └── Member List
├── SettingsModal
│   ├── General Settings
│   ├── Holidays
│   └── Make-up Days
└── AboutModal
```

---

## State Management

ProGantt uses **React's built-in state management** (useState, useMemo, useEffect) without external state libraries.

### State Location

All application state is managed in `App.tsx`:

```typescript
// Core Data
const [tasks, setTasks] = useState<Task[]>([]);
const [dependencies, setDependencies] = useState<Dependency[]>([]);
const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
const [settings, setSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);

// View State
const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
const [timeScale, setTimeScale] = useState<TimeScale>(TimeScale.Day);
const [viewStartDate, setViewStartDate] = useState<Date>(new Date());
const [viewDays, setViewDays] = useState<number>(30);

// UI State
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [notification, setNotification] = useState<{...} | null>(null);
const [showCriticalPath, setShowCriticalPath] = useState(false);

// Filter State
const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER);
const [isFilterOpen, setIsFilterOpen] = useState(false);

// Modal Visibility
const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [isAboutOpen, setIsAboutOpen] = useState(false);
const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
```

### Derived State

Computed values use `useMemo` for performance:

```typescript
const derivedStartDate = useMemo(() => {...}, [viewStartDate]);
const viewEndDate = useMemo(() => {...}, [derivedStartDate, viewDays]);
const derivedColumnWidth = useMemo(() => {...}, [timeScale, viewDays, containerWidth]);
const headerDates = useMemo(() => {...}, [derivedStartDate, viewEndDate, timeScale]);
const criticalTaskIds = useMemo(() => {...}, [tasks, dependencies, showCriticalPath]);
const filteredTasks = useMemo(() => {...}, [tasks, filterState]);
```

**Key Changes:**
- `derivedColumnWidth`: Now dynamically calculated based on time scale unit (Day/Week/Month/Year) and container width
- `headerDates`: Returns different date arrays based on time scale (daily, weekly, monthly, or yearly dates)


### State Flow

```
User Action → Event Handler → setState → Re-render → Update UI
                    ↓
            Update localStorage
                    ↓
            (Electron only) Update file
```

---

## Data Flow

### Task Update Flow

```
TaskList/GanttChart (User Edit)
    ↓
handleTaskUpdate (App.tsx)
    ↓
setTasks (Update State)
    ↓
Re-render Components
    ↓
localStorage.setItem (Persist)
```

### Dependency Management

```
GanttChart (Drag Line)
    ↓
handleDependencyCreate (App.tsx)
    ↓
Check for duplicates/cycles
    ↓
setDependencies (Add new dependency)
    ↓
Re-render GanttChart (Show new line)
```

### File Operations (Electron)

```
Save Flow:
User clicks Save
    ↓
saveProject (App.tsx)
    ↓
Check if projectSavePath exists
    ↓ No            ↓ Yes
saveProjectAs   electronAPI.saveProject
    ↓                   ↓
Show dialog      Write to file
    ↓                   ↓
Update settings   Success notification

Load Flow:
User clicks Open
    ↓
electronAPI.loadProject
    ↓
Show file picker
    ↓
Read file content
    ↓
loadProjectData (Parse JSON)
    ↓
setState (tasks, dependencies, members, settings)
    ↓
Auto zoom to fit
```

---

## Rendering Strategy

### Conditional Rendering

Components are rendered conditionally based on view mode and state:

```typescript
{(viewMode === ViewMode.Table || viewMode === ViewMode.Split) && (
    <TaskList {...props} />
)}

{(viewMode === ViewMode.Gantt || viewMode === ViewMode.Split) && (
    <GanttChart {...props} />
)}
```

### Performance Optimizations

1. **useMemo**: Expensive calculations (critical path, filtered tasks)
2. **Conditional rendering**: Only render visible components
3. **Virtual scrolling**: Not implemented (could be future enhancement)
4. **Key props**: Proper keys on list items for efficient reconciliation

---

## Event Handling

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save project |

Implementation:
```typescript
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProject();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Mouse Interactions

- **Task Bar Dragging**: Resize/move tasks on Gantt chart
- **Dependency Creation**: Drag from task connector dots
- **Scrolling**: Synchronized between header and chart

---

## Data Persistence

### Storage Strategy

ProGantt uses a **dual persistence** approach:

1. **localStorage** (Always): Auto-save on changes
2. **File System** (Electron only): Manual save to .json files

### Storage Key

```typescript
const STORAGE_KEY = 'progantt-data-v2';
```

### Data Format

All data is serialized as JSON:

```json
{
    "tasks": [...],
    "dependencies": [...],
    "members": [...],
    "settings": {...}
}
```

### Migration Strategy

When loading old data:
```typescript
const loadedTasks = (data.tasks || []).map(t => ({
    ...t,
    // Ensure new fields exist with defaults
    assignments: t.assignments || [],
    ownerEffort: t.ownerEffort ?? 100,
    // ... other fields
}));
```

---

## Build & Deployment

### Development Build

```bash
npm run dev
```

Runs Vite dev server on `http://localhost:3000`

### Production Build

```bash
npm run build
```

Steps:
1. TypeScript compilation (`tsc`)
2. Vite build → `dist/`

### Electron Development

```bash
npm run electron
```

Steps:
1. Start Vite dev server
2. Wait for server ready
3. Launch Electron window

### Electron Packaging

**Method 1: electron-packager** (Current)
```bash
npx electron-packager . ProGantt --platform=win32 --arch=x64 \
  --out=release-packager --overwrite --icon="public/icon.ico" \
  --ignore="^/src$" --ignore="^/node_modules$" ...
```

Output: `release-packager/ProGantt-win32-x64/`

**Method 2: electron-builder**
```bash
npm run electron:dist
```

Output: `release/ProGantt.exe` (portable)

---

## Cross-Platform Compatibility

### Web Mode
- Runs in any modern browser
- File operations use download/upload
- No Electron APIs

### Electron Mode
- Desktop application (Windows, macOS, Linux)
- Native file dialogs
- Direct file system access

### Feature Detection

```typescript
if (window.electronAPI?.isElectron) {
    // Use Electron APIs
} else {
    // Use web fallbacks
}
```

---

## Dependencies

### Runtime Dependencies

- `react`: UI framework
- `react-dom`: React DOM renderer
- `lucide-react`: Icon components

### Development Dependencies

- Build: `vite`, `typescript`, `@vitejs/plugin-react`
- Electron: `electron`, `electron-builder`, `electron-packager`
- Styling: `tailwindcss`, `autoprefixer`, `postcss`
- Linting: `eslint`, `@typescript-eslint/*`
- Dev Tools: `concurrently`, `wait-on`, `cross-env`

---

## Security Considerations

### Electron Context Isolation

The main process is isolated from the renderer. Only specific APIs are exposed via `contextBridge`.

### Safe Parser Usage

When loading project files, JSON parsing is wrapped in try-catch to prevent crashes:

```typescript
try {
    const data: ProjectData = JSON.parse(jsonString);
    // Validate and use data
} catch (err) {
    showNotification('Failed to load project data', 'error');
}
```

### Input Validation

- Date inputs are validated before conversion
- Task dependencies are checked for cycles (not implemented, future enhancement)

---

## Extension Points

### Adding New Task Fields

1. Update `Task` interface in `types.ts`
2. Add input in `TaskModal.tsx`
3. Add column in `TaskList.tsx`
4. Update CSV export in `utils.ts`

### Adding New View Modes

1. Add to `ViewMode` enum
2. Add button in toolbar
3. Create new component
4. Add to conditional rendering

### Custom Calculations

Add new utility functions in `utils.ts` and import where needed.

---

## Known Limitations

1. **No real-time collaboration**: Single-user application
2. **No undo/redo**: State changes are immediate
3. **No circular dependency detection**: Could cause infinite loops
4. **Limited scalability**: Performance may degrade with 1000+ tasks
5. **No data validation**: Relies on TypeScript type checking

---

## Future Architecture Improvements

1. **State Management**: Consider Zustand or Redux for complex state
2. **Virtual Scrolling**: For large task lists
3. **Web Workers**: For heavy computations (critical path)
4. **IndexedDB**: For better web persistence
5. **GraphQL/REST API**: For cloud sync capabilities
6. **WebSocket**: For real-time collaboration
