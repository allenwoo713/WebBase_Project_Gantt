<div align="center">

# 📊 ProGantt

**Professional Gantt Chart & Project Management Tool**

A powerful standalone desktop application for project planning, task management, and team collaboration.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/allenwoo713/WebBase_Project_Gantt/releases/tag/v1.0.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20x64-lightgrey.svg)](https://github.com/allenwoo713/WebBase_Project_Gantt/releases)

</div>

---

## �?Features

### 📈 Gantt Chart Visualization
- **Interactive Timeline**: Drag-and-drop task scheduling with visual feedback
- **Multiple Time Scales**: Day, Month, Quarter, Half-Year, and Year views
- **Critical Path Analysis**: Automatically identify and highlight critical tasks
- **Zoom to Fit**: Smart auto-zoom to display all tasks optimally

### 👥 Team Management
- **Member Profiles**: Manage team members with roles, emails, and color coding
- **Task Assignment**: Assign tasks to specific team members
- **Role-based Filtering**: Filter tasks by role or team member

### 📋 Task Management
- **Rich Task Properties**: Name, duration, progress, priority, status, and more
- **Task Dependencies**: Create Finish-to-Start (FS) relationships between tasks
- **Drag-and-Drop Reordering**: Easily reorganize task lists
- **Progress Tracking**: Visual progress bars and status indicators

### 🔧 Advanced Features
- **Project Settings**: Configure weekends, holidays, and make-up days
- **Smart Filtering**: Filter by status, priority, owner, role, progress, and date ranges
- **CSV Export**: Export task data for external analysis
- **Auto-Save**: Automatic local storage with manual save/load options
- **Error Recovery**: Intelligent save path validation with auto-recovery

### 💾 Data Persistence
- **Local Storage**: Automatic saving to browser localStorage
- **File Export/Import**: Save and load projects as JSON files
- **Path Validation**: Automatic "Save As" dialog when save path is invalid
- **Settings Sync**: Project settings automatically update with file paths

---

## 🚀 Quick Start

### For End Users (Standalone Application)

1. **Download** the latest release from [Releases](https://github.com/allenwoo713/WebBase_Project_Gantt/releases)
2. **Extract** the ZIP file to your preferred location
3. **Run** `ProGantt.exe` from the extracted folder
4. **Start Planning** your projects!

### For Developers

#### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

#### Installation

```bash
# Clone the repository
git clone https://github.com/allenwoo713/WebBase_Project_Gantt.git
cd WebBase_Project_Gantt

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🔨 Building from Source

### Build Web Application

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Standalone Application

```bash
# 1. Build the frontend
npm run build

# 2. Package as Electron app
npx electron-packager . ProGantt --platform=win32 --arch=x64 --out=release-packager --overwrite --icon="public/icon.ico" --ignore="^/src" --ignore="^/node_modules" --ignore="^/.git" --ignore="^/.vscode" --ignore="^/release" --ignore="^/release-packager" --ignore="^/public"
```

The packaged application will be in `release-packager/ProGantt-win32-x64/`

For detailed packaging instructions, see [PACKAGING_GUIDELINE.md](PACKAGING_GUIDELINE.md)

---

## 📖 Usage Guide

### Creating a New Project

1. Click the **"+ Task"** button to add tasks
2. Fill in task details (name, dates, duration, assignee, etc.)
3. Create dependencies by clicking task bars in Gantt view
4. Adjust timeline using the time scale selector

### Saving Your Project

- **Auto-Save**: Projects are automatically saved to browser localStorage
- **Manual Save**: Click the 💾 Save button to export as JSON file
- **Save As**: If the save path is invalid, a "Save As" dialog will automatically appear

### Managing Team Members

1. Click **"Members"** button in the toolbar
2. Add, edit, or remove team members
3. Assign colors and roles to members
4. Assign members to tasks in the task modal

### Filtering Tasks

1. Click the **"Filter"** button
2. Select criteria (status, priority, owner, role, progress, dates)
3. Apply filters to focus on specific tasks
4. Clear filters to show all tasks

---

## 🛠�?Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Desktop Framework**: Electron
- **UI Components**: Custom React components
- **Icons**: Lucide React
- **Styling**: Tailwind CSS (utility-first)
- **State Management**: React Hooks
- **Data Persistence**: LocalStorage + File System (Electron)

---

## 📁 Project Structure

```
WebBase_Project_Gantt/
├── src/
�?  ├── components/          # React components
�?  �?  ├── GanttChart.tsx   # Main Gantt chart component
�?  �?  ├── TaskList.tsx     # Task list view
�?  �?  ├── TaskModal.tsx    # Task editing modal
�?  �?  ├── MemberManager.tsx # Team member management
�?  �?  ├── SettingsModal.tsx # Project settings
�?  �?  └── FilterPanel.tsx  # Task filtering
�?  ├── App.tsx              # Main application component
�?  ├── types.ts             # TypeScript type definitions
�?  └── utils.ts             # Utility functions
├── electron/
�?  ├── main.cjs             # Electron main process
�?  └── preload.cjs          # Electron preload script
├── public/
�?  └── icon.ico             # Application icon
├── dist/                    # Build output (generated)
└── release-packager/        # Packaged app (generated)
```

---

## 🐛 Known Issues & Limitations

- Currently supports Windows x64 only (macOS and Linux builds coming soon)
- Large projects (>1000 tasks) may experience performance degradation

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Electron](https://www.electronjs.org/)
- Icons by [Lucide](https://lucide.dev/)

---

<div align="center">

**Made with ❤️ for Project Managers**

[Report Bug](https://github.com/allenwoo713/WebBase_Project_Gantt/issues) · [Request Feature](https://github.com/allenwoo713/WebBase_Project_Gantt/issues)

</div>
