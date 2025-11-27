# Changelog

## [1.0.0-gamma] - 2025-11-27

### Refactored
- **Project Structure**: Reorganized the entire project to follow modern frontend best practices.
  - Created `src/` directory for all source code (`App.tsx`, `index.tsx`, `types.ts`, `utils.ts`, `components/`).
  - Created `docs/` directory for all documentation and reports.
  - Created `public/assets/` for static assets (icons, images).
  - Created `.agent/` for AI workflows and rules.
- **Asset Management**: Moved application icons to `public/assets/` and updated all references to use relative paths (`./assets/`) for compatibility with both Web and Electron environments.

### Fixed
- **Packaging**: Resolved issues with `electron-packager` including unnecessary files.
  - Updated ignore rules to exclude `src/`, `docs/`, and other dev files.
  - Reduced package size from ~5.7MB to ~0.43MB by moving documentation assets out of the build path.
- **Icon Display**: Fixed issue where application icons were not showing in the packaged app by correcting paths in `App.tsx` and `electron/main.cjs`.

### Added
- **AI Agent Rules**: Added `.agent/rules/project_structure.md` to guide future development.
- **Workflows**: Added `.agent/workflows/build_and_package.md` for automated building and packaging.

## [Unreleased] - 2025-11-24

### Fixed
- **Application Entry Point**: Fixed a critical issue where the application failed to load (blank page) by restoring the missing `<script type="module" src="/index.tsx"></script>` tag in `index.html`.
- **Gantt Chart Visibility**: Resolved an issue where task bars were not rendering in the Gantt chart view by restoring the main `<rect>` element in `components/GanttChart.tsx`.
- **Task Data Synchronization**: Fixed a bug in `components/TaskModal.tsx` where the modal would not reflect updates made in the Task List (e.g., Owner changes) if the same task was re-opened. The modal now correctly re-initializes its state whenever it is opened.
- **Dependency Rendering**: Corrected the SVG path calculation in `components/GanttChart.tsx` to ensure dependency lines are drawn correctly relative to task bars.
- **Corrupted Logic Restoration**: Restored several critical functions in `App.tsx` that were previously corrupted or missing, including `handleStep`, `goToToday`, `handleSettingsSave`, `handleTaskSave`, `handleTaskDelete`, and `handleTaskMove`.

### Changed
- **Task Interaction Logic (`App.tsx`)**:
  - Refined `handleTaskUpdate` to intelligently distinguish between **Move** and **Resize** operations.
  - **Move**: Preserves the task's working-day duration.
  - **Resize**: Recalculates the duration based on the new start/end dates.
- **Gantt Chart Component (`components/GanttChart.tsx`)**:
  - Added dedicated resize handles (left and right edges) to task bars.
  - Updated drag-and-drop logic to support `resize-l` (left) and `resize-r` (right) actions alongside the existing move action.
  - Added an explicit `onDoubleClick` handler to task bars to ensure the Task Modal opens reliably.
- **Project Settings**: `handleSettingsSave` now triggers a recalculation of all task durations when project settings (e.g., weekends, holidays) are modified, ensuring consistency.

### Added
- **Zoom to Fit**: Added a new button in the toolbar (next to "Today") that automatically adjusts the Gantt chart view range and time scale to fit all tasks on the screen. This ensures the entire project timeline is visible at a glance.

### Fixed (continued)
- **"Save & Download" Issue**:
  - Modified `saveProject` function in `App.tsx` to correctly trigger a file download using a temporary anchor element appended to the document body. This resolves the issue where the browser would navigate to a `blob:` URL instead of downloading the file.
- **Codebase Integrity**:
  - Restored full functionality of `App.tsx` after detecting significant corruption. Re-implemented missing functions (`useEffect`, `saveProject`, `openProject`, `handleStep`, `goToToday`) and fixed syntax errors to ensure the application runs correctly.
