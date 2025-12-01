#  ProGantt - Professional Project Management Tool

**A powerful, feature-rich Gantt chart application for project management**

**Version:** 1.0.1-beta | **Author:** Allen Woo | **Released:** 2025-12-02

---

##  Features

###  Core Functionality
- **Interactive Gantt Chart**: Visualize project timelines with drag-and-drop task management
- **Task Dependencies**: Create and manage task relationships (Finish-to-Start, Finish-to-Finish)
- **Actual Dates**: Track actual start and end dates to compare against planned schedule
- **Critical Path Analysis**: Automatically identify critical tasks using standard CPM (Critical Path Method)
- **Robust Rendering**: Accurate task alignment across all time scales (Day, Week, Month, Quarter, Year)
- **Multiple View Modes**: Switch between Table, Split, and Gantt views
- **Flexible Time Scales**: Day, Week, Month, Quarter, Half Year, and Year views with "1 cell = 1 unit" granularity

###  Team Collaboration
- **Member Management**: Add team members with roles, colors, and contact information
- **Member Export**: Export team member data to CSV format
- **Task Assignment**: Assign tasks to owners and team members with effort tracking
- **Role-Based Organization**: Organize tasks by roles (PM, Developer, Designer, etc.)

###  Advanced Features
- **Progress Tracking**: Monitor task completion with visual progress bars
- **Priority Levels**: Categorize tasks as High, Medium, or Low priority
- **Task Status**: Track tasks through Not Started, Ongoing, and Done states
- **Advanced Filtering**: Filter by status, priority, owner, role, progress, and date ranges
- **Working Day Calculation**: Configure holidays, make-up days, and weekend settings
- **Working Hours Calculation**: Automatically calculate task hours based on effort and duration

###  Data Management
- **Auto-Save**: Automatic saving to browser localStorage
- **Project Export/Import**: Save and load projects as JSON files
- **CSV Export**: Export task data to CSV format (Table view) with full field support (including Actual Dates)
- **Electron Integration**: Desktop app with native file system access

---

##  Quick Start

### For End Users (Standalone Application)

1. **Download** the latest release from [Releases](https://github.com/allenwoo713/WebBase_Project_Gantt/releases)
2. **Extract** the ZIP file to your preferred location
3. **Run** ProGantt.exe from the extracted folder

No installation required - just extract and run!

### For Developers

#### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

#### Installation

```bash
# Clone the repository
git clone https://github.com/allenwoo713/WebBase_Project_Gantt.git

# Navigate to project directory
cd WebBase_Project_Gantt

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at http://localhost:3000

#### Build for Production

```bash
# Build web application
npm run build

# Package as Electron app (see PACKAGING_GUIDELINE.md for details)
npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite
```

For detailed packaging instructions, see [PACKAGING_GUIDELINE.md](PACKAGING_GUIDELINE.md).

---

##  User Guide

### Creating Your First Project

1. Click **+ Task** button in the toolbar
2. Fill in task details (name, dates, duration, assignee, etc.)
3. Create dependencies by clicking and dragging from task bars in Gantt view
4. Adjust timeline using the time scale selector

### Saving Your Project

- **Auto-Save**: Projects are automatically saved to browser localStorage
- **Manual Save**: Click the Save button to export as JSON file
- **Save As**: If the save path is invalid, a Save As dialog will automatically appear
- **Error Recovery**: Detailed error messages with auto-recovery options

### Managing Team Members

1. Click **Members** button in the toolbar
2. Add, edit, or remove team members
3. Assign colors and roles to members
4. Assign members to tasks in the task modal
5. Export member list to CSV for external use

### Filtering Tasks

1. Click the **Filter** button
2. Select criteria (status, priority, owner, role, progress, dates)
3. Apply filters to focus on specific tasks
4. Clear filters to show all tasks

---

##  Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Desktop Framework**: Electron
- **UI Components**: Custom React components
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Data Persistence**: LocalStorage + File System (Electron)

---

##  Project Structure

```
WebBase_Project_Gantt/
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── GanttChart.tsx
│   │   ├── TaskList.tsx
│   │   └── ...
│   ├── App.tsx                   # Main application component
│   ├── index.tsx                 # Entry point
│   ├── types.ts                  # Type definitions
│   └── utils.ts                  # Utility functions
├── docs/                         # Documentation & Reports
├── public/                       # Static assets
│   └── assets/                   # Icons and images
├── electron/                     # Electron configuration
│   ├── main.cjs
│   └── preload.cjs
├── dist/                         # Build output (generated)
├── release-packager/             # Packaged app (generated)
└── .agent/                       # AI workflows & rules
```

---

##  Known Issues & Limitations

- Currently supports Windows x64 only (macOS and Linux builds coming soon)
- Large projects (>1000 tasks) may experience performance degradation
- CSV export only available in Table view mode

---

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

##  License

This project is licensed under the MIT License.

---

##  Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Electron](https://www.electronjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with  by Allen Woo**

[Report Bug](https://github.com/allenwoo713/WebBase_Project_Gantt/issues)  [Request Feature](https://github.com/allenwoo713/WebBase_Project_Gantt/issues)
