import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Dependency, ViewMode, TimeScale, DependencyType, ProjectData, Member, ProjectSettings, Holiday, Priority, TaskStatus, FilterState } from './types';
import GanttChart from './components/GanttChart';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import MemberManager from './components/MemberManager';
import SettingsModal from './components/SettingsModal';
import FilterPanel from './components/FilterPanel';
import { addDays, addMonths, addYears, getDatesRange, calculateCriticalPath, diffDays, diffProjectDays, addProjectDays, exportTasksToCSV, formatDate } from './utils';
import {
    Table, Columns, BarChart3, Save, Plus, ChevronLeft, ChevronRight, FolderOpen,
    Users, Settings as SettingsIcon, AlertTriangle, Download, Filter, Maximize, Info
} from 'lucide-react';

const STORAGE_KEY = 'progantt-data-v2';
const APP_VERSION = '1.0.0-beta';
const APP_AUTHOR = 'Allen Woo';

const INITIAL_MEMBERS: Member[] = [
    { id: 'm1', name: 'Alice', role: 'Project Manager', email: 'alice@corp.com', color: '#3b82f6' },
    { id: 'm2', name: 'Bob', role: 'Business Analyst', email: 'bob@corp.com', color: '#f59e0b' },
    { id: 'm3', name: 'Charlie', role: 'UI Designer', email: 'charlie@corp.com', color: '#ec4899' },
    { id: 'm4', name: 'Dave', role: 'Lead Dev', email: 'dave@corp.com', color: '#10b981' },
    { id: 'm5', name: 'Eve', role: 'QA Engineer', email: 'eve@corp.com', color: '#8b5cf6' },
];

const INITIAL_TASKS: Task[] = [
    { id: '1', name: 'Project Initiation', start: new Date(2024, 5, 1), end: new Date(2024, 5, 5), duration: 4, progress: 100, ownerId: 'm1', role: 'PM', type: 'phase', priority: Priority.High, status: TaskStatus.Done },
    { id: '2', name: 'Requirement Analysis', start: new Date(2024, 5, 6), end: new Date(2024, 5, 10), duration: 4, progress: 60, ownerId: 'm2', role: 'Analyst', type: 'task', priority: Priority.Medium, status: TaskStatus.Ongoing },
];

const INITIAL_DEPENDENCIES: Dependency[] = [
    { id: 'd1', sourceId: '1', targetId: '2', type: DependencyType.FS },
];

const INITIAL_SETTINGS: ProjectSettings = {
    showDependencies: true,
    includeWeekends: true,
    holidays: [],
    makeUpDays: [],
    projectFilename: 'MyProject',
    projectSavePath: ''
};

const INITIAL_FILTER: FilterState = {
    statuses: [],
    priorities: [],
    ownerIds: [],
    roles: [],
    progressMin: '',
    progressMax: '',
    dateRangeStart: { from: '', to: '' },
    dateRangeEnd: { from: '', to: '' }
};

const App: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [dependencies, setDependencies] = useState<Dependency[]>(INITIAL_DEPENDENCIES);
    const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
    const [settings, setSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);

    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
    const [timeScale, setTimeScale] = useState<TimeScale>(TimeScale.Day);
    const [viewStartDate, setViewStartDate] = useState<Date>(new Date(2024, 5, 1));
    const [viewDays, setViewDays] = useState<number>(30);
    const [showCriticalPath, setShowCriticalPath] = useState<boolean>(false);

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER);

    // Global Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Modal States
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const handleGanttScroll = (scrollLeft: number) => {
        if (headerRef.current) {
            headerRef.current.scrollLeft = scrollLeft;
        }
    };

    const [containerWidth, setContainerWidth] = useState(0);
    const ganttContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ganttContainerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        ro.observe(ganttContainerRef.current);
        return () => ro.disconnect();
    }, [viewMode]);

    const projectRange = useMemo(() => {
        if (tasks.length === 0) return { start: new Date(), end: new Date() };
        const min = new Date(Math.min(...tasks.map(t => t.start.getTime())));
        const max = new Date(Math.max(...tasks.map(t => t.end.getTime())));
        return { start: min, end: max };
    }, [tasks]);

    const { derivedStartDate, derivedColumnWidth, derivedViewDays } = useMemo(() => {
        const isLongTerm = [TimeScale.Quarter, TimeScale.HalfYear, TimeScale.Year].includes(timeScale);

        if (isLongTerm) {
            const bufferDays = timeScale === TimeScale.Year ? 30 : 15;
            const start = addDays(projectRange.start, -bufferDays);
            const end = addDays(projectRange.end, bufferDays);
            const days = diffDays(end, start);
            const width = containerWidth > 0 ? Math.max(containerWidth / days, 1) : 2;
            return { derivedStartDate: start, derivedColumnWidth: width, derivedViewDays: days };
        } else {
            let width = 50;
            if (timeScale === TimeScale.Month) width = 15;

            const minDays = containerWidth > 0 ? Math.ceil(containerWidth / width) : 30;
            const days = Math.max(viewDays, minDays);

            return { derivedStartDate: viewStartDate, derivedColumnWidth: width, derivedViewDays: days };
        }
    }, [timeScale, projectRange, containerWidth, viewStartDate, viewDays]);

    const viewEndDate = useMemo(() => addDays(derivedStartDate, derivedViewDays), [derivedStartDate, derivedViewDays]);
    const headerDates = useMemo(() => getDatesRange(derivedStartDate, viewEndDate), [derivedStartDate, viewEndDate]);

    // Compute Filtered Tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // 1. Status Filter
            if (filterState.statuses.length > 0 && !filterState.statuses.includes(task.status)) {
                return false;
            }

            // 2. Priority Filter
            if (filterState.priorities.length > 0 && !filterState.priorities.includes(task.priority)) {
                return false;
            }

            // 3. Owner Filter
            if (filterState.ownerIds.length > 0) {
                const owner = task.ownerId || 'unassigned';
                if (!filterState.ownerIds.includes(owner)) {
                    return false;
                }
            }

            // 4. Role Filter
            if (filterState.roles.length > 0) {
                if (!task.role || !filterState.roles.includes(task.role)) {
                    return false;
                }
            }

            // 5. Progress Filter
            if (filterState.progressMin !== '' && task.progress < filterState.progressMin) return false;
            if (filterState.progressMax !== '' && task.progress > filterState.progressMax) return false;

            // 6. Start Date Range
            if (filterState.dateRangeStart.from) {
                const from = new Date(filterState.dateRangeStart.from + 'T00:00:00');
                if (task.start < from) return false;
            }
            if (filterState.dateRangeStart.to) {
                const to = new Date(filterState.dateRangeStart.to + 'T23:59:59');
                if (task.start > to) return false;
            }

            // 7. End Date Range
            if (filterState.dateRangeEnd.from) {
                const from = new Date(filterState.dateRangeEnd.from + 'T00:00:00');
                if (task.end < from) return false;
            }
            if (filterState.dateRangeEnd.to) {
                const to = new Date(filterState.dateRangeEnd.to + 'T23:59:59');
                if (task.end > to) return false;
            }

            return true;
        });
    }, [tasks, filterState]);

    const criticalTaskIds = useMemo(() => {
        if (!showCriticalPath) return new Set<string>();
        return calculateCriticalPath(tasks, dependencies);
    }, [tasks, dependencies, showCriticalPath]);

    // Notification Handler
    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Persistence & Migration
    const handleZoomToFit = (arg?: Task[] | React.MouseEvent) => {
        const currentTasks = Array.isArray(arg) ? arg : tasks;
        if (currentTasks.length === 0) return;

        const minStart = new Date(Math.min(...currentTasks.map(t => new Date(t.start).getTime())));
        const maxEnd = new Date(Math.max(...currentTasks.map(t => new Date(t.end).getTime())));

        // Add larger buffer to fill screen (e.g., 30 days after)
        const newStart = addDays(minStart, -7);
        const newEnd = addDays(maxEnd, 45); // Increased buffer from 7 to 45 days
        const totalDays = diffDays(newEnd, newStart);

        setViewStartDate(newStart);
        setViewDays(totalDays);

        // Auto-adjust timescale based on duration to fit screen better
        if (totalDays > 730) {
            setTimeScale(TimeScale.Year);
        } else if (totalDays > 365) {
            setTimeScale(TimeScale.HalfYear);
        } else if (totalDays > 180) {
            setTimeScale(TimeScale.Quarter);
        } else if (totalDays > 60) {
            setTimeScale(TimeScale.Month);
        } else {
            setTimeScale(TimeScale.Day);
        }
    };

    const loadProjectData = (jsonString: string) => {
        try {
            const parsed: ProjectData = JSON.parse(jsonString);

            // Process Tasks
            const loadedTasks = (parsed.tasks || []).map(t => ({
                ...t,
                start: new Date(t.start),
                end: new Date(t.end),
                status: t.status || (t.progress === 100 ? TaskStatus.Done : (t.progress === 0 ? TaskStatus.NotStarted : TaskStatus.Ongoing))
            }));
            setTasks(loadedTasks);
            setDependencies(parsed.dependencies || []);
            setMembers(parsed.members || []);

            // Process Settings
            let loadedSettings = { ...INITIAL_SETTINGS, ...(parsed.settings || {}) };
            if (!Array.isArray(loadedSettings.holidays)) loadedSettings.holidays = [];
            if (!Array.isArray(loadedSettings.makeUpDays)) loadedSettings.makeUpDays = [];

            // Migration for holidays
            if (loadedSettings.holidays.length > 0 && typeof loadedSettings.holidays[0] === 'string') {
                const oldHolidays = loadedSettings.holidays as unknown as string[];
                loadedSettings.holidays = oldHolidays.map((hStr, idx) => ({
                    id: `migrated-${idx}`,
                    name: 'Holiday',
                    start: hStr,
                    end: hStr
                }));
            }
            setSettings(loadedSettings);

            // View Adjustment
            if (loadedTasks.length > 0) {
                const minDate = new Date(Math.min(...loadedTasks.map(t => t.start.getTime())));
                setViewStartDate(minDate);
                handleZoomToFit(loadedTasks);
            }

            // Persist to localStorage
            const dataToSave: ProjectData = {
                tasks: loadedTasks,
                dependencies: parsed.dependencies || [],
                members: parsed.members || [],
                settings: loadedSettings
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave, null, 2));

        } catch (err) {
            console.error(err);
            showNotification('Failed to load project data', 'error');
        }
    };

    const saveProject = async () => {
        const data = { tasks, dependencies, members, settings };
        const jsonString = JSON.stringify(data, null, 2);

        if (window.electronAPI?.isElectron) {
            let currentPath = settings.projectSavePath;
            let saveResult;

            if (currentPath) {
                // Try to save to existing path
                saveResult = await window.electronAPI.saveProject(currentPath, jsonString);
            }

            // If no path or save failed with ENOENT (file not found/path invalid), trigger Save As
            if (!currentPath || (saveResult && !saveResult.success && saveResult.error && saveResult.error.includes('ENOENT'))) {
                if (currentPath && saveResult?.error) {
                    // Show the detailed error first
                    showNotification(`Failed to save: ${saveResult.error}`, 'error');
                    // Wait a moment for user to see the error
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                // Trigger Save As dialog
                const saveAsResult = await window.electronAPI.saveProjectAs(jsonString);

                if (saveAsResult.success && saveAsResult.filePath) {
                    const newSettings = {
                        ...settings,
                        projectSavePath: saveAsResult.filePath,
                        projectFilename: saveAsResult.filePath.split('\\').pop()?.replace('.json', '')
                    };
                    setSettings(newSettings);

                    // Update localStorage
                    const newData = { ...data, settings: newSettings };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData, null, 2));

                    showNotification('Project saved successfully!', 'success');
                } else if (saveAsResult.canceled) {
                    // User canceled, do nothing
                } else {
                    showNotification(`Failed to save: ${saveAsResult.error}`, 'error');
                }
            } else if (saveResult && !saveResult.success) {
                // Other error
                showNotification(`Failed to save: ${saveResult.error}`, 'error');
            } else {
                // Success (Direct save)
                showNotification('Project saved successfully!', 'success');
            }
        } else {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${settings.projectFilename || 'project'}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('Project downloaded!', 'success');
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            loadProjectData(saved);
        }
    }, []);

    const handleOpenFileClick = () => {
        if (window.electronAPI?.isElectron) {
            openProject();
        } else {
            fileInputRef.current?.click();
        }
    };

    const openProject = async (e?: React.ChangeEvent<HTMLInputElement>) => {
        if (window.electronAPI?.isElectron) {
            const result = await window.electronAPI.loadProject();
            if (result.success && result.data && result.filePath) {
                // We need to inject the filePath into the loaded settings
                const parsed: ProjectData = JSON.parse(result.data);
                const updatedSettings = {
                    ...(parsed.settings || INITIAL_SETTINGS),
                    projectSavePath: result.filePath,
                    projectFilename: result.filePath?.split('\\').pop()?.replace('.json', '')
                };

                // Re-serialize with updated settings to pass to loadProjectData
                const updatedData = { ...parsed, settings: updatedSettings };
                loadProjectData(JSON.stringify(updatedData));
            }
        } else {
            const file = e?.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                loadProjectData(ev.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleStep = (direction: 'prev' | 'next') => {
        const factor = direction === 'next' ? 1 : -1;
        switch (timeScale) {
            case TimeScale.Day: setViewStartDate(d => addDays(d, 7 * factor)); break;
            case TimeScale.Month: setViewStartDate(d => addMonths(d, 1 * factor)); break;
            case TimeScale.Quarter: setViewStartDate(d => addMonths(d, 3 * factor)); break;
            case TimeScale.HalfYear: setViewStartDate(d => addMonths(d, 6 * factor)); break;
            case TimeScale.Year: setViewStartDate(d => addYears(d, 1 * factor)); break;
        }
    };

    const goToToday = () => {
        const today = new Date();
        today.setDate(today.getDate() - 3);
        setViewStartDate(today);
    };



    const handleSettingsSave = (newSettings: ProjectSettings) => {
        setSettings(newSettings);
        setTasks(prevTasks => prevTasks.map(t => {
            const duration = diffProjectDays(t.start, t.end, newSettings);
            return { ...t, duration };
        }));
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== updatedTask.id) return t;

            const startChanged = t.start.getTime() !== updatedTask.start.getTime();
            const endChanged = t.end.getTime() !== updatedTask.end.getTime();

            if (startChanged && !endChanged) {
                const newDuration = diffProjectDays(updatedTask.start, updatedTask.end, settings);
                return { ...updatedTask, duration: newDuration };
            }

            if (!startChanged && endChanged) {
                const newDuration = diffProjectDays(updatedTask.start, updatedTask.end, settings);
                return { ...updatedTask, duration: newDuration };
            }

            if (startChanged && endChanged) {
                const newEnd = addProjectDays(updatedTask.start, t.duration, settings);
                return { ...updatedTask, end: newEnd };
            }

            return updatedTask;
        }));
    };

    const handleTaskSave = (updatedTask: Task, newDeps: Dependency[]) => {
        const duration = diffProjectDays(updatedTask.start, updatedTask.end, settings);
        const finalTask = { ...updatedTask, duration };

        handleTaskUpdate(finalTask);
        setDependencies(prev => {
            const others = prev.filter(d => d.targetId !== updatedTask.id);
            return [...others, ...newDeps];
        });
    };

    const handleTaskDelete = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        setDependencies(prev => prev.filter(d => d.sourceId !== id && d.targetId !== id));
        setIsModalOpen(false);
    };

    const handleTaskMove = (taskId: string, direction: 'up' | 'down') => {
        const index = tasks.findIndex(t => t.id === taskId);
        if (index === -1) return;

        const newTasks = [...tasks];

        if (direction === 'up') {
            if (index === 0) return;
            [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
        } else {
            if (index === tasks.length - 1) return;
            [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
        }

        setTasks(newTasks);
    };

    const handleAddTask = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const start = new Date(viewStartDate);
        const end = addProjectDays(start, 2, settings);
        const newTask: Task = {
            id: newId, name: 'New Task', start, end, duration: 2, progress: 0, type: 'task', priority: Priority.Medium, status: TaskStatus.NotStarted
        };
        setTasks([...tasks, newTask]);
    };

    const handleDependencyCreate = (sourceId: string, targetId: string) => {
        if (dependencies.find(d => d.sourceId === sourceId && d.targetId === targetId)) return;
        if (sourceId === targetId) return;
        setDependencies([...dependencies, {
            id: Math.random().toString(36).substr(2, 9), sourceId, targetId, type: DependencyType.FS
        }]);
    };

    // Helper to check if any filter is active
    const isFilterActive =
        filterState.statuses.length > 0 ||
        filterState.priorities.length > 0 ||
        filterState.ownerIds.length > 0 ||
        filterState.roles.length > 0 || // Added roles
        filterState.progressMin !== '' ||
        filterState.progressMax !== '' ||
        filterState.dateRangeStart.from !== '' ||
        filterState.dateRangeEnd.from !== '';

    return (
        <div className="flex flex-col h-screen bg-white text-slate-900 font-sans overflow-hidden">
            {/* Global Notification */}
            {notification && (
                <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-xl flex items-center animate-bounce ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    {notification.type === 'error' && <AlertTriangle size={20} className="mr-2" />}
                    <span className="font-medium">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-4 opacity-80 hover:opacity-100">
                        <div className="bg-white/20 rounded-full p-1"><span className="text-xs font-bold">X</span></div>
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm z-20 relative">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 mr-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                        <h1 className="text-lg font-bold text-slate-800 hidden md:block">ProGantt</h1>
                    </div>

                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setViewMode(ViewMode.Table)} className={`p-1.5 rounded ${viewMode === ViewMode.Table ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Table size={18} /></button>
                        <button onClick={() => setViewMode(ViewMode.Split)} className={`p-1.5 rounded ${viewMode === ViewMode.Split ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Columns size={18} /></button>
                        <button onClick={() => setViewMode(ViewMode.Gantt)} className={`p-1.5 rounded ${viewMode === ViewMode.Gantt ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><BarChart3 size={18} /></button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <button onClick={handleAddTask} className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm">
                        <Plus size={16} className="mr-1" /> Task
                    </button>

                    <button onClick={() => setIsMemberManagerOpen(true)} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        <Users size={16} className="mr-2" /> Members
                    </button>

                    <button onClick={() => setIsSettingsOpen(true)} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        <SettingsIcon size={16} className="mr-2" /> Settings
                    </button>

                    <select
                        value={timeScale}
                        onChange={(e) => {
                            setTimeScale(e.target.value as TimeScale);
                            if (e.target.value === TimeScale.Year) setViewDays(365);
                            else if (e.target.value === TimeScale.Month) setViewDays(60);
                            else setViewDays(30);
                        }}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50 outline-none"
                    >
                        <option value={TimeScale.Day}>Day View</option>
                        <option value={TimeScale.Month}>Month View</option>
                        <option value={TimeScale.Quarter}>Quarter View</option>
                        <option value={TimeScale.HalfYear}>Half Year</option>
                        <option value={TimeScale.Year}>Year View</option>
                    </select>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isFilterOpen || isFilterActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100'}`}
                    >
                        <Filter size={16} className="mr-1" /> {isFilterActive ? 'Filters On' : 'Filter'}
                    </button>

                    {/* Export CSV Button (only in Table mode) */}
                    {viewMode === ViewMode.Table && (
                        <button
                            onClick={() => exportTasksToCSV(tasks, members, dependencies)}
                            className="flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 mr-2"
                            title="Export as CSV"
                        >
                            <Download size={16} className="mr-1" /> Export
                        </button>
                    )}

                    <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 p-1 space-x-1">
                        <button onClick={() => handleStep('prev')} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={16} /></button>
                        <button onClick={goToToday} className="px-2 py-0.5 text-xs font-medium bg-white border rounded shadow-sm hover:bg-gray-50">Today</button>
                        <button onClick={() => handleStep('next')} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={16} /></button>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <button onClick={handleZoomToFit} className="p-1 hover:bg-gray-200 rounded" title="Zoom to Fit"><Maximize size={16} /></button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <input type="file" ref={fileInputRef} onChange={openProject} accept=".json" className="hidden" />
                    <button onClick={() => handleOpenFileClick()} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Open File">
                        <FolderOpen size={20} />
                    </button>

                    <button onClick={saveProject} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Save Project Backup (.json)">
                        <Save size={20} />
                    </button>

                    <button onClick={() => setIsAboutOpen(true)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="About">
                        <Info size={20} />
                    </button>
                </div>
            </header>

            <FilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                members={members}
                filter={filterState}
                onFilterChange={setFilterState}
                onClearFilters={() => setFilterState(INITIAL_FILTER)}
            />

            <div className="flex-1 flex overflow-hidden relative">
                {(viewMode === ViewMode.Table || viewMode === ViewMode.Split) && (
                    <div className={`${viewMode === ViewMode.Table ? 'w-full' : 'w-1/3'} flex flex-col z-10 shadow-xl bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}>
                        <TaskList
                            tasks={filteredTasks} // Use filtered tasks
                            members={members}
                            onTaskUpdate={handleTaskUpdate}
                            onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                            onTaskMove={handleTaskMove}
                            onError={(msg) => showNotification(msg, 'error')}
                        />
                    </div>
                )}

                {(viewMode === ViewMode.Gantt || viewMode === ViewMode.Split) && (
                    <div ref={ganttContainerRef} className="flex-1 flex flex-col min-w-0 bg-white relative">
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showCriticalPath}
                                        onChange={e => setShowCriticalPath(e.target.checked)}
                                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    Show Critical Path (Red)
                                </label>
                                <div className="h-3 w-px bg-gray-300"></div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded bg-orange-500"></span> High Priority
                                    <span className="w-3 h-3 rounded bg-blue-500 ml-2"></span> Medium
                                    <span className="w-3 h-3 rounded bg-green-500 ml-2"></span> Low
                                </div>
                            </div>
                            <div className="text-gray-400">
                                {filteredTasks.length} tasks
                            </div>
                        </div>

                        {/* Dynamic Gantt Header */}
                        <div ref={headerRef} className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10 h-[50px] overflow-hidden select-none shadow-sm">
                            <div className="relative h-full" style={{ width: headerDates.length * derivedColumnWidth }}>
                                {headerDates.map((date, i) => {
                                    const isMonthStart = date.getDate() === 1;
                                    const isWeekStart = date.getDay() === 1;
                                    const isToday = diffDays(date, new Date()) === 0;

                                    let showLabel = false;
                                    let labelText = "";
                                    let subText = "";

                                    if (timeScale === TimeScale.Day) {
                                        showLabel = true;
                                        labelText = date.getDate().toString();
                                        subText = date.toLocaleDateString('en-US', { weekday: 'narrow' });
                                    } else if (timeScale === TimeScale.Month && isWeekStart) {
                                        showLabel = true;
                                        labelText = date.getDate().toString();
                                    } else if ((timeScale === TimeScale.Quarter || timeScale === TimeScale.Year) && isMonthStart) {
                                        showLabel = true;
                                        labelText = date.toLocaleDateString('en-US', { month: 'short' });
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={`absolute h-full border-r border-gray-200 flex flex-col justify-end items-center pb-1 text-xs text-gray-500 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100/50' : ''}`}
                                            style={{ left: i * derivedColumnWidth, width: derivedColumnWidth }}
                                        >
                                            {/* Month Label */}
                                            {(isMonthStart || (i === 0 && timeScale === TimeScale.Day)) && (
                                                <div className="absolute top-1 left-1 font-bold text-slate-700 whitespace-nowrap z-10 bg-gray-50 px-1 rounded border border-gray-200 shadow-sm text-[10px]">
                                                    {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </div>
                                            )}

                                            {showLabel && derivedColumnWidth > 10 && (
                                                <>
                                                    <span className={isToday ? 'font-bold text-blue-600' : ''}>{labelText}</span>
                                                    {derivedColumnWidth > 30 && <span className="text-[9px] opacity-60 uppercase">{subText}</span>}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <GanttChart
                            tasks={filteredTasks} // Use filtered tasks
                            dependencies={dependencies}
                            onScroll={handleGanttScroll}
                            viewStartDate={derivedStartDate}
                            viewEndDate={viewEndDate}
                            columnWidth={derivedColumnWidth}
                            showCriticalPath={showCriticalPath}
                            settings={settings}
                            onTaskUpdate={handleTaskUpdate}
                            onDependencyDelete={(id) => setDependencies(prev => prev.filter(d => d.id !== id))}
                            onDependencyCreate={handleDependencyCreate}
                            onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                            criticalTaskIds={criticalTaskIds}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    allTasks={tasks}
                    members={members}
                    dependencies={dependencies}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleTaskSave}
                    onDelete={handleTaskDelete}
                    settings={settings}
                    onError={(msg) => showNotification(msg, 'error')}
                />
            )}

            <MemberManager
                isOpen={isMemberManagerOpen}
                onClose={() => setIsMemberManagerOpen(false)}
                members={members}
                onUpdateMembers={setMembers}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={handleSettingsSave}
            />

            {/* About Modal */}
            {isAboutOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAboutOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg">
                                P
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">ProGantt</h2>
                            <div className="text-center space-y-3 mb-6">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-blue-600">Version:</span> {APP_VERSION}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-blue-600">Author:</span> {APP_AUTHOR}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-blue-600">Release Date:</span> November 2024
                                </p>
                            </div>
                            <div className="w-full border-t border-gray-200 pt-4 mb-4">
                                <p className="text-xs text-gray-500 text-center leading-relaxed">
                                    A professional project management tool with Gantt chart visualization,
                                    task dependencies, critical path analysis, and team collaboration features.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAboutOpen(false)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
