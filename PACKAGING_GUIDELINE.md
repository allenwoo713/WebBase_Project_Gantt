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
   - Update `version` field (e.g., "1.0.0-beta")
   - Verify `author` field is set

2. **App.tsx** (lines 16-18):
   ```typescript
   const APP_VERSION = '1.0.0-beta';  // Match package.json version
   const APP_AUTHOR = 'Allen Woo';
   const APP_RELEASE_DATE = '2025-11-25';  // Use current system date from above
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
- ✅ **Small size**: App folder ~0.43 MB (vs 10+ MB with source code)
- ✅ **Secure**: No source code exposure
- ✅ **Professional**: Production-ready distribution

**Command:**

```bash
npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="public/icon.ico" --ignore="^/src$" --ignore="^/node_modules$" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release$" --ignore="^/release-packager$" --ignore="^/public$" --ignore="^/.cache$" --ignore="^/.agent$" --ignore="^/components$" --ignore="^/docs$" --ignore="\.tsx$" --ignore="\.ts$" --ignore="^/.*\.md$" --ignore="vite\.config" --ignore="tsconfig" --ignore="^/index\.html$" --ignore="^/index\.tsx$" --ignore="^/metadata\.json$" --ignore="^/changelog"
```

**Key Flags Explanation:**

- `--platform=win32 --arch=x64`: Target Windows 64-bit
- `--out=release-packager`: Output directory
- `--overwrite`: Replace existing builds
- `--icon="public/icon.ico"`: Application icon
- `--ignore="..."`: Critical for optimization. We exclude:
  - **Source directories**: `components/`, `docs/`, `src/`
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
│       └── index-xxx.js
├── electron/          # Electron main process
│   ├── main.cjs
│   └── preload.cjs
└── package.json       # Package metadata
```

**What's NOT included** (and shouldn't be):
- ❌ Source code files (App.tsx, types.ts, utils.ts, etc.)
- ❌ Component source files (components/ directory)
- ❌ Configuration files (tsconfig.json, vite.config.ts)
- ❌ Documentation files (README.md, PACKAGING_GUIDELINE.md)
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

# Expected: ~0.43 MB
```

## Output

The packaged application will be available in:
```
release-packager/ProGantt-win32-x64/ProGantt.exe
```

## One-Line Build & Package

For convenience, you can combine both steps:

```bash
npm run build && npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="public/icon.ico" --ignore="^/src$" --ignore="^/node_modules$" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release$" --ignore="^/release-packager$" --ignore="^/public$" --ignore="^/.cache$" --ignore="^/.agent$" --ignore="^/components$" --ignore="^/docs$" --ignore="\.tsx$" --ignore="\.ts$" --ignore="^/.*\.md$" --ignore="vite\.config" --ignore="tsconfig" --ignore="^/index\.html$" --ignore="^/index\.tsx$" --ignore="^/metadata\.json$" --ignore="^/changelog"
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

### Icon not showing

- Verify `public/icon.ico` exists
- Use absolute path if relative path fails: `--icon="C:\path\to\icon.ico"`
