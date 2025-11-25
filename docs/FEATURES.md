# ProGantt Features Documentation

## Overview

ProGantt is a modern, desktop/web-based project management tool that provides comprehensive Gantt chart visualization and task management capabilities.

**Version**: 1.0.0-beta  
**Author**: Allen Woo  
**Release Date**: 2025-11-25

---

## Table of Contents

- [Core Features](#core-features)
- [Task Management](#task-management)
- [Team Management](#team-management)
- [Project Settings](#project-settings)
- [Visualization](#visualization)
- [Data Management](#data-management)
- [User Interface](#user-interface)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Known Limitations](#known-limitations)

---

## Core Features

### ✅ Implemented Features

#### 1. **Gantt Chart Visualization**
- Interactive Gantt chart with drag-and-drop support
- Multiple time scales (Day, Month, Quarter, Half-Year, Year)
- Color-coded task bars by priority:
  - 🟠 High Priority: Orange
  - 🔵 Medium Priority: Blue
  - 🟢 Low Priority: Green
- Progress indicators on task bars
- Milestone markers
- Weekend highlighting (configurable)

#### 2. **Task Management**
- Create, edit, and delete tasks
- Task properties:
  - Name, description, deliverable
  - Start date, end date, duration (in working days)
  - Status: Not Started, In Progress, Completed, On Hold
  - Priority: Low, Medium, High
  - Progress (0-100%)
  - Owner assignment
  - Multiple assignees with effort allocation
  - Role/category
  - Baseline score and score metrics

#### 3. **Dependency Management**
- Create dependencies by dragging between tasks
- Dependency types:
  - FS (Finish-to-Start) ✅ Fully supported
  - SS, FF, SF ⚠️ Defined but not fully implemented
- Visual dependency lines on Gantt chart
- Delete dependencies with one click
- Edit dependencies in task modal

#### 4. **Critical Path Analysis**
- Automatic critical path calculation
- Highlight critical tasks in red
- Toggle visibility on/off
- Uses CPM (Critical Path Method) algorithm

#### 5. **Team Member Management**
- Add, edit, delete team members
- Member properties:
  - Name, role, email, phone
  - Customizable avatar color
- Assign members as task owners
- Assign multiple members to tasks with effort %
- Export members to CSV

#### 6. **Working Days Configuration**
- Weekend mode (include/exclude weekends)
- Custom holidays
- Make-up working days (override weekends)
- Configurable working hours per day (default: 8)

#### 7. **Task Hours Calculation**
- Automatic calculation based on:
  - Task duration (working days)
  - Owner effort %
  - Additional assignee efforts
  - Working hours per day
- Formula: `Hours = (TotalEffort% / 100) × Duration × WorkingHours`
- Displayed in Task List and CSV export

#### 8. **Multi-select & Batch Operations**
- Select multiple tasks with checkboxes
- Select all / Deselect all
- Batch delete selected tasks
- Visual feedback for selection

#### 9. **Advanced Filtering**
- Filter by:
  - Status (multi-select)
  - Priority (multi-select)
  - Owner (multi-select)
  - Role (multi-select)
  - Progress range (min/max)
  - Start date range
  - End date range
- Active filter indicator
- Clear all filters with one click

#### 10. **Data Export**
- Export tasks to CSV with all fields
- Export team members to CSV
- Includes calculated hours column
- UTF-8 BOM for Excel compatibility

#### 11. **Project Persistence**
- Auto-save to localStorage (web and desktop)
- Manual save to file (desktop only)
- "Save As" functionality with file picker
- Load from file
- JSON format for easy inspection

#### 12. **Desktop Application**
- Windows portable executable
- Native file dialogs
- System integration
- No installation required

---

## Task Management

### Creating Tasks

**Methods**:
1. Click **"+ Task"** button in toolbar
2. Default task created with:
   - Name: "New Task"
   - Duration: 2 working days
   - Start: Current view date
   - Status: Not Started
   - Priority: Medium

### Editing Tasks

#### Task List View
- Click any cell to edit inline:
  - **Name**: Text input
  - **Status**: Dropdown (Not Started, In Progress, Completed, On Hold)
  - **Priority**: Dropdown (Low, Medium, High)
  - **Role**: Text input (autocomplete with existing roles)
  - **Owner**: Dropdown (team members)
  - **Assignments**: Click to open assignment modal
  - **Start/End**: Date picker
  - **Duration**: Number input (working days)
  - **Progress**: Slider (0-100%)

#### Gantt Chart View
- **Drag task bar**: Move task dates
- **Drag left edge**: Change start date
- **Drag right edge**: Change end date
- **Click task bar**: Open task modal

#### Task Modal (Advanced Editing)
Open by clicking task name in Task List or task bar in Gantt.

**Basic Info Tab**:
- Name, Type (Task/Milestone)
- Start, End, Duration
- Status, Priority, Progress
- Owner, Role

**Assignments Tab**:
- Add/remove team members
- Set effort % for each member
- Owner effort % configuration

**Dependencies Tab**:
- View all predecessors
- Add new dependencies
- Remove dependencies

**Advanced Tab**:
- Description
- Deliverable
- Baseline Score
- Score

### Deleting Tasks

**Single Delete**:
1. Open task modal
2. Click **"Delete Task"** button
3. Confirm deletion

**Batch Delete**:
1. Select tasks using checkboxes
2. Click trash icon in Task List header
3. All selected tasks deleted at once
4. Associated dependencies also removed

### Moving Tasks

In Task List view:
- **↑** button: Move task up in list
- **↓** button: Move task down in list

---

## Team Management

### Member Manager

Access via **"Members"** button in toolbar.

### Adding Members

1. Fill in the form:
   - Name (required)
   - Role
   - Email
   - Phone
2. Click **"Add"** button

### Editing Members

- Click any field in the member table to edit inline
- Click avatar to change color (color picker appears on hover)

### Deleting Members

1. Click trash icon next to member
2. Click **"Sure?"** to confirm

### Exporting Members

Click **"Export CSV"** button to download member list.

**CSV Format**:
```
ID, Name, Role, Email, Phone, Color
```

---

## Project Settings

Access via **"Settings"** button in toolbar.

### General Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Project Filename** | Name for saved files | "MyProject" |
| **Show Dependencies** | Display dependency lines on Gantt | ✅ Enabled |
| **Include Weekends** | Count weekends in duration | ❌ Disabled |
| **Working Day Hours** | Hours per working day | 8 |

### Duration Calculation

**Weekend Mode**:
- **Disabled**: Only Mon-Fri count as working days
- **Enabled**: All 7 days count as working days

**Example**:
- Task from Monday to Friday
- Weekend mode OFF: 5 working days
- Weekend mode ON: 5 working days (same)

- Task from Friday to Monday
- Weekend mode OFF: 2 working days (Fri, Mon)
- Weekend mode ON: 4 working days (Fri, Sat, Sun, Mon)

### Holidays

Add non-working days:

1. Click **"Add Holiday"**
2. Enter date (YYYY-MM-DD) and name
3. Click **"Add"**

Holidays are excluded from working day calculations.

### Make-up Days

Override weekends to make them working days:

1. Click **"Add Make-up Day"**
2. Enter date (YYYY-MM-DD)
3. Click **"Add"**

**Priority**: Make-up days override holidays and weekend mode.

---

## Visualization

### View Modes

Toggle with buttons in toolbar:

| Mode | Icon | Description |
|------|------|-------------|
| **Table** | 📊 | Task list only |
| **Split** | ⚔️ | Task list + Gantt chart (default) |
| **Gantt** | 📈 | Gantt chart only |

### Time Scales

Select from dropdown:

- **Day View**: Daily columns (recommended for < 30 days)
- **Month View**: Weekly columns
- **Quarter View**: Monthly columns
- **Half-Year View**: Monthly columns (wider view)
- **Year View**: Monthly columns (widest view)

### Navigation

| Control | Action |
|---------|--------|
| **← Prev** | Step backward (7 days / 1 month / etc.) |
| **Today** | Jump to current date |
| **Next →** | Step forward |
| **🔍 Zoom to Fit** | Auto-adjust view to show all tasks |

### Color Coding

**Priority Colors**:
- 🟠 High: Orange (`#ef4444`)
- 🔵 Medium: Blue (`#3b82f6`)
- 🟢 Low: Green (`#10b981`)

**Critical Path**:
- 🔴 Red: Tasks on critical path (when enabled)

**Progress**:
- Gradient fill on task bar shows completion %

**Weekends**:
- Light gray background on Sat/Sun columns

---

## Data Management

### Saving Projects

#### Auto-Save (Web & Desktop)
- Automatically saves to browser localStorage
- Triggered on every change
- Storage key: `progantt-data-v2`

#### Manual Save (Desktop Only)

**Save** (Ctrl+S):
1. If file path exists: Overwrite file
2. If no path: Trigger "Save As"

**Save As**:
1. Click dropdown arrow next to Save button
2. Select "Save As..."
3. Choose location and filename
4. File saved as `.json`

#### Web Fallback
In browser mode, "Save" triggers download of JSON file.

### Loading Projects

#### Desktop
1. Click folder icon
2. Select `.json` file
3. Project loaded and auto-zoomed

#### Web
1. Click folder icon
2. Select `.json` file from file picker
3. Project loaded

### Project File Format

JSON structure:
```json
{
  "tasks": [...],
  "dependencies": [...],
  "members": [...],
  "settings": {...}
}
```

All dates stored as ISO strings.

---

## User Interface

### Toolbar (Top)

From left to right:
1. **Logo & Title**: "ProGantt"
2. **View Mode**: Table / Split / Gantt
3. **+ Task**: Create new task
4. **Members**: Open member manager
5. **Settings**: Open settings modal
6. **Time Scale**: Dropdown selector
7. **Filter**: Toggle filter panel
8. **Export**: Export tasks to CSV (Table mode only)
9. **Navigation**: Prev / Today / Next / Zoom to Fit
10. **Open**: Load project file
11. **Save**: Save dropdown (Save / Save As)
12. **About**: App version info

### Task List Columns

| Column | Editable | Type |
|--------|----------|------|
| Index | ❌ | Auto-numbered |
| Name | ✅ | Text input |
| Status | ✅ | Dropdown |
| Priority | ✅ | Dropdown |
| Role | ✅ | Text input |
| Owner | ✅ | Dropdown |
| Assignments | ✅ | Modal |
| Hours | ❌ | Calculated |
| Start | ✅ | Date picker |
| End | ✅ | Date picker |
| Duration | ✅ | Number input |
| Progress | ✅ | Slider |
| Move | ❌ | Up/Down buttons |

### Gantt Chart

**Header**:
- Date columns with month labels
- Weekend shading

**Task Rows**:
- Task bars (draggable)
- Connector dots for dependencies
- Progress overlay

**Dependency Lines**:
- L-shaped paths from source to target
- Delete button (❌) on hover

**Controls**:
- Critical Path toggle
- Task count display

---

## Keyboard Shortcuts

| Shortcut | Action | Platform |
|----------|--------|----------|
| `Ctrl+S` | Save project | Windows/Linux |
| `Cmd+S` | Save project | macOS |

---

## Known Limitations

### Current Version (1.0.0-beta)

1. **No Undo/Redo**: Changes are immediate and cannot be undone
2. **No Collaboration**: Single-user application
3. **No Cloud Sync**: Data stored locally only
4. **No Cycle Detection**: Creating circular dependencies may cause issues
5. **Limited Dependency Types**: Only FS (Finish-to-Start) fully implemented
6. **No Resource Leveling**: No automatic resource allocation optimization
7. **No Baseline Comparison**: Baseline score is stored but not visualized
8. **No Custom Fields**: Task fields are predefined
9. **No Printing**: No print-friendly view
10. **No Mobile App**: Desktop and web only (responsive design not optimized)

### Performance Limits

- **Recommended**: Up to 500 tasks for smooth performance
- **Maximum tested**: 1000 tasks (may experience lag)
- **Dependencies**: Up to 1000 without performance issues

### Browser Compatibility

**Supported**:
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

**Not Supported**:
- ❌ Internet Explorer (any version)

---

## Future Enhancements

### Planned Features (Not Yet Implemented)

1. **Resource Management**:
   - Resource pools
   - Allocation tracking
   - Overallocation warnings

2. **Reporting**:
   - Gantt chart export to PDF/image
   - Custom report templates
   - Burndown charts

3. **Advanced Scheduling**:
   - Auto-schedule based on dependencies
   - Resource leveling
   - What-if scenarios

4. **Collaboration**:
   - Real-time multi-user editing
   - Cloud storage integration
   - Comments and notifications

5. **Mobile Support**:
   - Responsive design for tablets
   - Native mobile apps (iOS/Android)
   - Touch-optimized controls

6. **Integrations**:
   - Export to MS Project
   - Import from Excel
   - API for third-party tools

7. **Enhanced UI**:
   - Dark mode
   - Custom themes
   - Drag-and-drop file upload

8. **Data Features**:
   - Undo/Redo system
   - Version history
   - Change tracking
   - Backup and restore

---

## Feature Configuration

### Enabling/Disabling Features

Most features are always enabled. Configurable options are in **Settings**:

| Feature | Location | Default |
|---------|----------|---------|
| Show Dependencies | Settings → General | ✅ On |
| Include Weekends | Settings → Duration | ❌ Off |
| Critical Path Display | Gantt → Toggle | ❌ Off |
| Filters | Filter Panel | ❌ Off (no filters) |

---

## Usage Tips

### Best Practices

1. **Set up members first**: Add team members before creating tasks
2. **Configure holidays**: Add holidays before scheduling tasks
3. **Use roles**: Categorize tasks by role for better filtering
4. **Regular saves**: Save project file periodically (Ctrl+S)
5. **Zoom to fit**: Use zoom to fit button after adding many tasks
6. **Critical path**: Enable critical path to identify bottlenecks
7. **Filters**: Use filters to focus on specific task subsets
8. **Batch operations**: Use multi-select for bulk task deletion

### Common Workflows

#### Starting a New Project
1. Click "Members" → Add team members
2. Click "Settings" → Configure weekend mode and holidays
3. Click "+ Task" → Create first task
4. Edit task details in modal
5. Add more tasks and dependencies
6. Save project (Ctrl+S)

#### Tracking Progress
1. Filter by status "In Progress"
2. Update progress % on tasks
3. Adjust end dates if needed
4. Check critical path for delays

#### Team Resource Planning
1. Filter by owner
2. Review task assignments
3. Check hours column for workload
4. Rebalance assignments if needed

---

## Troubleshooting

### Common Issues

**Issue**: Tasks not showing on Gantt
- **Solution**: Check if tasks are outside view range. Use "Zoom to Fit"

**Issue**: Cannot save file (web mode)
- **Solution**: Web mode downloads file instead. Check browser download folder

**Issue**: Working day calculation seems wrong
- **Solution**: Check Settings → weekend mode and holidays

**Issue**: Critical path not showing
- **Solution**: Toggle "Show Critical Path" checkbox in Gantt view

**Issue**: Deleted task reappears
- **Solution**: Make sure to save project (Ctrl+S) after deletion

---

## Support & Feedback

**Version**: 1.0.0-beta (Beta release)  
**Author**: Allen Woo  
**License**: Proprietary (All rights reserved)

For bug reports and feature requests, please contact the author.

---

## Changelog

### v1.0.0-beta (2025-11-25)

**New Features**:
- ✨ Working day hours configuration
- ✨ Task hours calculation and display
- ✨ Multi-select for batch deletion
- ✨ Save dropdown with "Save As" option
- ✨ Keyboard shortcut (Ctrl+S) for saving
- ✨ Member CSV export

**Improvements**:
- 🎨 Enhanced UI with better visual hierarchy
- ⚡ Optimized working day calculations
- 📝 Comprehensive documentation

**Bug Fixes**:
- 🐛 Fixed duration calculation edge cases
- 🐛 Corrected date handling in filters
- 🐛 Resolved dependency line rendering issues

---

## Acknowledgments

**Technologies Used**:
- React, TypeScript, Vite, Electron, Tailwind CSS, Lucide Icons

**Inspired By**:
- Microsoft Project
- Smartsheet
- Monday.com
- GanttProject
