# Changelog

## [1.0.1-alpha] - 2025-12-01

### Added
- **Actual Dates**: Added "Actual Start" and "Actual End" date fields to tasks for tracking real-world progress against the plan.
- **Enhanced CSV Export**: Improved CSV export to include all task fields (including actual dates), reordered columns for better readability, and added BOM for Excel compatibility.

### Fixed
- **Export Toast Behavior**: Fixed an issue where the "Export Successful" toast would appear immediately upon clicking the button. It now correctly waits for the file to be saved and does not appear if the user cancels the dialog.

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
- **Zoom to Fit**: Added a new button in the toolbar (next to "Today") that automatically adjusts the Gantt chart view range and time scale to fit all tasks on the screen. This ensures the entire project timeline is visible at a glance.
