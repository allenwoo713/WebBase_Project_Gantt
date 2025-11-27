# Project Structure Rules

This document defines the rules for creating and organizing files in the ProGantt project.
All AI agents MUST follow these rules when adding new content.

## 1. Directory Structure Overview

- **`src/`**: ALL source code (React components, logic, types, utils).
- **`docs/`**: Project documentation.
- **`public/assets/`**: Static assets (images, icons) for the application.
- **`electron/`**: Electron main process configuration.
- **`.agent/`**: AI workflows and rules.

## 2. File Placement Rules

### Source Code (`src/`)
- **New Components**: Place in `src/components/`.
  - Use PascalCase for filenames (e.g., `NewFeature.tsx`).
- **Core Logic**: Place in `src/`.
- **Types**: Add to `src/types.ts` or create new type files in `src/types/` if needed.
- **Utilities**: Add to `src/utils.ts` or `src/utils/`.

### Documentation (`docs/`)
- **General Docs**: Place in `docs/` root (e.g., `NEW_FEATURE.md`).
- **Reports**: Place in `docs/reports/` (e.g., `FIX_REPORT_YYYY-MM-DD.md`).
- **Bug Logs**: Place in `docs/bugfix-logs/`.

### Assets (`public/assets/`)
- **App Icons**: `public/assets/icon.ico` (for build).
- **Images**: Place all static images here.
- **Reference**: Use relative path `./assets/filename.ext` in code.

### Electron (`electron/`)
- **Main Process**: `electron/main.cjs`.
- **Preload**: `electron/preload.cjs`.

## 3. Naming Conventions

- **React Components**: `PascalCase.tsx`
- **Helper/Utils**: `camelCase.ts`
- **Documentation**: `UPPER_CASE_SNAKE_CASE.md` (preferred for major docs) or `kebab-case.md`.
- **Directories**: `kebab-case` (e.g., `bugfix-logs`).

## 4. Prohibitions 

- **DO NOT** create source files (`.ts`, `.tsx`) in the project root.
- **DO NOT** place documentation in the root (except `README.md`).
- **DO NOT** place raw assets in `src/` unless imported via bundler (prefer `public/assets/`).
