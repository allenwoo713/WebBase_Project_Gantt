# ProGantt Packaging Guideline

This document outlines the standard procedure for packaging the ProGantt application to ensure a consistent and optimized file size.

## Prerequisites

- Node.js installed
- Dependencies installed (`npm install`)

## Build & Package Process

We use a two-step process:
1.  **Build**: Compile the React/TypeScript frontend into static assets.
2.  **Package**: Bundle the Electron runtime with the built assets, excluding unnecessary development files.

### 1. Build Frontend

Run the following command to compile the React application:

```bash
npm run build
```

This creates the `dist` directory containing the production-ready frontend code.

### 2. Package Application

Use `electron-packager` with specific ignore rules to exclude `node_modules`, source code, and other dev artifacts. This drastically reduces the package size (from ~200MB+ to <100MB).

**Command:**

```bash
npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="public/icon.ico" --ignore="^/src" --ignore="^/node_modules" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release" --ignore="^/release-packager" --ignore="^/public"
```

**Key Flags Explanation:**
- `--platform=win32 --arch=x64`: Target Windows 64-bit.
- `--out=release-packager`: Output directory.
- `--overwrite`: Replace existing builds.
- `--ignore="..."`: Critical for size optimization. We explicitly ignore:
    - `^/src`: Original source code (not needed, we use `dist`).
    - `^/node_modules`: Dev dependencies (Electron bundles what it needs, or we rely on pre-bundled logic. *Note: If runtime dependencies are needed, they should be handled carefully, but for this app, the build is self-contained in `dist` and `electron/main.cjs` uses standard modules*).
    - `^/.git`: Git history.
    - `^/.vscode`: Editor config.
    - `^/public`: Raw public assets (Vite copies them to `dist`).

## Output

The packaged application will be available in:
`release-packager/ProGantt-win32-x64/ProGantt.exe`
