---
description: Complete release process including verification, build, and packaging
---

1. Update version numbers
   - Update `version` in `package.json`
   - Update `APP_VERSION` and `APP_RELEASE_DATE` in `src/App.tsx`
   - Add entry to `docs/CHANGELOG.md`

2. Run automated tests
// turbo
3. npm test
// turbo
4. npm run test:e2e

5. Verify persistence manually (Critical)
   - Save Flow: Create new project -> Save -> Close -> Reopen (Expect: Loads correctly)
   - Save As Flow: Open project -> Save As new -> Close immediately -> Reopen (Expect: Loads new file)
   - Fallback Flow: Corrupt file -> Reopen (Expect: Loads from localStorage with warning)

6. Build application
// turbo
7. npm run build

8. Package application
// turbo
9. $iconPath = (Resolve-Path "public\assets\icon.ico").Path; npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="$iconPath" --ignore="^/src$" --ignore="^/node_modules$" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release$" --ignore="^/release-packager$" --ignore="^/public$" --ignore="^/.cache$" --ignore="^/.agent$" --ignore="^/docs$" --ignore="\.tsx$" --ignore="\.ts$" --ignore="^/.*\.md$" --ignore="vite\.config" --ignore="tsconfig" --ignore="^/index\.html$" --ignore="^/metadata\.json$"

10. Final Verification
    - Launch `release-packager/ProGantt-win32-x64/ProGantt.exe`
    - Verify "About" dialog version
    - Test "Save As" in packaged app
