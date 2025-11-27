---
description: Build and package the ProGantt application
---

1. Check and update version in package.json and src/App.tsx manually.

2. Run build
// turbo
3. npm run build

4. Package application (Auto-resolves icon path)
// turbo
5. $iconPath = (Resolve-Path "public\assets\icon.ico").Path; npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="$iconPath" --ignore="^/src$" --ignore="^/node_modules$" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release$" --ignore="^/release-packager$" --ignore="^/public$" --ignore="^/.cache$" --ignore="^/.agent$" --ignore="^/docs$" --ignore="\.tsx$" --ignore="\.ts$" --ignore="^/.*\.md$" --ignore="vite\.config" --ignore="tsconfig" --ignore="^/index\.html$" --ignore="^/metadata\.json$"
