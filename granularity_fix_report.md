# Gantt Chart Fixes & Granularity Update

## 1. Layout Fix
- **Issue**: The Gantt chart was overlapping the Task List in Split View.
- **Fix**: Added `relative` positioning to the Gantt container and Header container in `App.tsx`. This ensures the scrollable area is contained correctly within its parent flex item.
- **Verification**: Confirmed via browser screenshot `layout_retry.png`.

## 2. Time Axis Granularity
- **Issue**: The previous implementation didn't strictly follow "1 cell = 1 Unit" (Week/Month/Year).
- **Fix**:
    - **`utils.ts`**: Added `getWeeksRange`, `getMonthsRange`, `getYearsRange` to generate grid dates based on units. Added `diffWeeks`, `diffMonths`, `diffYears` for accurate positioning.
    - **`App.tsx`**:
        - Updated `headerDates` to use the appropriate range generator based on `timeScale`.
        - Updated `derivedColumnWidth` to calculate width dynamically based on the *Unit* (e.g., Year view width is calculated to fit the total years in the container).
        - Passed `timeScale` to `GanttChart`.
    - **`GanttChart.tsx`**:
        - Updated `dates` (grid lines) to use the correct unit range.
        - Updated `getTaskX` and `getTaskWidth` to calculate position and width based on the selected `timeScale` unit (e.g., in Year view, position is based on year difference, not day difference).
        - Updated `renderGrid` to draw lines for each unit.

## 3. Zoom to Fit
- **Logic**: The `handleZoomToFit` function sets the `viewDays` to the total project duration.
- **Dynamic Width**: The new `derivedColumnWidth` logic uses `viewDays` to calculate the exact column width needed to fit the entire project into the `containerWidth` for the selected `TimeScale`.
    - Example (Year View): `columnWidth = (containerWidth * 365) / totalDays`.
    - Example (Week View): `columnWidth = (containerWidth * 7) / totalDays`.

## Status
- **Build**: `npm run build` passed.
- **Runtime**: `npm run dev` is running on port 3001.
- **Visuals**: Verified Week View and Layout.
