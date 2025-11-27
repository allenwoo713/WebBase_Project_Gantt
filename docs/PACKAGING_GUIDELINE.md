# ProGantt Packaging Guideline

This document outlines the standard procedure for packaging the ProGantt application with optimized file size and production-ready quality.

## Prerequisites

- Node.js installed
- Dependencies installed (`npm install`)

## Build & Package Process

We use a three-step process:
1. **Verify**: Check version and release date information
2. **Build**: Compile the React/TypeScript frontend into static assets
3. **Package**: Bundle the Electron runtime with the built assets, excluding unnecessary development files

### 0. Pre-Build Verification (MANDATORY)

**Before every build**, verify the following information is up-to-date:

#### Check Current System Date
```powershell
Get-Date -Format "yyyy-MM-dd"
```

#### Update Version Information in Files

1. **package.json**:
   - Update `version` field (e.g., "1.0.0-gamma")
   - Verify `author` field is set

2. **src/App.tsx** (lines 16-18):
   ```typescript
   const APP_VERSION = '1.0.0-gamma';  // Match package.json version
   const APP_AUTHOR = 'Allen Woo';
   const APP_RELEASE_DATE = '2025-11-27';  // Use current system date from above
   ```

**⚠️ IMPORTANT**: Always use the actual system date from the command above, not a guessed date!

### 1. Build Frontend

Run the following command to compile the React application:

```bash
npm run build
```

This creates the `dist` directory containing the production-ready frontend code.

### 2. Package Application (Optimized)

Use `electron-packager` with comprehensive ignore rules to exclude source code, development files, and temporary directories. This ensures:
- ✅ **Clean package**: Only production files (dist/, electron/, package.json)
- ✅ **Small size**: App folder size optimized (excluding source code)
- ✅ **Secure**: No source code exposure
- ✅ **Professional**: Production-ready distribution

**Get absolute icon path (PowerShell):**

```powershell
$iconPath = (Resolve-Path "public\assets\icon.ico").Path
Write-Output "Icon path: $iconPath"
# Output: D:\python_workspace\Claude_Project\WebBase_Project_Gantt\public\assets\icon.ico
```

**Command (use absolute path for icon):**

```bash
npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="D:\python_workspace\Claude_Project\WebBase_Project_Gantt\public\assets\icon.ico" --ignore="^/src$" --ignore="^/node_modules$" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release$" --ignore="^/release-packager$" --ignore="^/public$" --ignore="^/.cache$" --ignore="^/.agent$" --ignore="^/docs$" --ignore="\.tsx$" --ignore="\.ts$" --ignore="^/.*\.md$" --ignore="vite\.config" --ignore="tsconfig" --ignore="^/index\.html$" --ignore="^/metadata\.json$"
```

**⚠️ IMPORTANT**: Replace the icon path with your actual absolute path from the command above!

**Key Flags Explanation:**

- `--platform=win32 --arch=x64`: Target Windows 64-bit
- `--out=release-packager`: Output directory
- `--overwrite`: Replace existing builds
- `--icon="..."`: Application icon (use absolute path as shown above)
- `--ignore="..."`: Critical for optimization. We exclude:
  - **Source directories**: `src/`, `docs/`
  - **Source files**: All `.tsx` and `.ts` files
  - **Config files**: `tsconfig.json`, `vite.config.ts`
  - **Documentation**: All `.md` files
  - **Temporary files**: `.cache/`, `.agent/`
  - **Development files**: `node_modules/`, `.git/`, `.vscode/`
  - **Build artifacts**: `release/`, `release-packager/`
  - **Public assets**: `public/` (already copied to `dist/` by Vite)

## Packaged Application Structure

After packaging, the `resources/app/` directory should **only** contain:

```
resources/app/
├── dist/              # Compiled frontend code
│   ├── index.html
│   └── assets/
│       ├── index-xxx.js
│       └── icon.ico
├── electron/          # Electron main process
│   ├── main.cjs
│   └── preload.cjs
└── package.json       # Package metadata
```

**What's NOT included** (and shouldn't be):
- ❌ Source code files (src/App.tsx, src/types.ts, src/utils.ts, etc.)
- ❌ Component source files (src/components/ directory)
- ❌ Configuration files (tsconfig.json, vite.config.ts, index.html)
- ❌ Documentation files (README.md, docs/)
- ❌ Temporary directories (.cache/, .agent/)

## Verification

After packaging, verify the contents:

```powershell
# List files in packaged app
Get-ChildItem "release-packager\ProGantt-win32-x64\resources\app" -Name

# Expected output:
# dist
# electron
# package.json

# Check app folder size
$size = (Get-ChildItem "release-packager\ProGantt-win32-x64\resources\app" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
"App folder size: $([math]::Round($size, 2)) MB"

# Note: Size should be around 0.4 - 0.5 MB
```

## Output

The packaged application will be available in:
```
release-packager/ProGantt-win32-x64/ProGantt.exe
```

## One-Line Build & Package

For convenience, you can combine both steps:

```bash
npm run build && npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="D:\YOUR\ABSOLUTE\PATH\TO\public\assets\icon.ico" --ignore="^/src$" --ignore="^/node_modules$" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release$" --ignore="^/release-packager$" --ignore="^/public$" --ignore="^/.cache$" --ignore="^/.agent$" --ignore="^/docs$" --ignore="\.tsx$" --ignore="\.ts$" --ignore="^/.*\.md$" --ignore="vite\.config" --ignore="tsconfig" --ignore="^/index\.html$" --ignore="^/metadata\.json$"
```

## Troubleshooting

### Package contains source files

If you see source files (`.tsx`, `.ts`) in `resources/app/`, ensure:
1. You're using the complete ignore rules from this guide
2. The ignore patterns use proper regex syntax (e.g., `\.tsx$` not `.tsx`)
3. Run with `--overwrite` to replace old builds

### Package size too large

- Verify only `dist/`, `electron/`, and `package.json` are in `resources/app/`
- Check that `node_modules/` is excluded
- Ensure all source files are excluded
- Note: Large assets in `public/` will be copied to `dist/` and increase package size (e.g., documentation images should be in `docs/`)

### Icon not showing

- Verify `public/assets/icon.ico` exists
- Use absolute path if relative path fails: `--icon="C:\path\to\public\assets\icon.ico"`

## Notes on Project Refactoring (2025-11-27)

The project structure was refactored to follow modern frontend best practices:
- Source code moved to `src/` directory
- Assets moved to `public/assets/`
- Documentation organized in `docs/` with `docs/reports/` subdirectory
- All packaging commands updated to reflect new structure
