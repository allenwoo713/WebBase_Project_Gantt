import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task, Dependency, ViewMode, TimeScale, DependencyType, ProjectData, Member, ProjectSettings, Holiday, Priority, TaskStatus, FilterState } from './types';
import GanttChart from './components/GanttChart';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import MemberManager from './components/MemberManager';
import SettingsModal from './components/SettingsModal';
import FilterPanel from './components/FilterPanel';
import { addDays, addMonths, addYears, getDatesRange, getWeeksRange, getMonthsRange, getYearsRange, calculateCriticalPath, diffDays, diffProjectDays, addProjectDays, exportTasksToCSV, formatDate, calculateColumnWidth } from './utils';
import {
    Table, Columns, BarChart3, Save, Plus, ChevronLeft, ChevronRight, FolderOpen,
    Users, Settings as SettingsIcon, AlertTriangle, Download, Filter, Maximize, Info, ChevronDown
} from 'lucide-react';

const STORAGE_KEY = 'progantt-data-v2';
const APP_VERSION = '1.0.1-gamma';
const APP_AUTHOR = 'Allen Woo';
const APP_RELEASE_DATE = '2025-12-02';

const INITIAL_MEMBERS: Member[] = [
    { id: 'm1', name: 'Alice', role: 'Project Manager', color: '#3b82f6' },
    { id: 'm2', name: 'Bob', role: 'Developer', color: '#10b981' },
    { id: 'm3', name: 'Charlie', role: 'Designer', color: '#f59e0b' },
    { id: 'm4', name: 'Diana', role: 'QA', color: '#ef4444' }
];

const INITIAL_SETTINGS: ProjectSettings = {
    showDependencies: true,
    includeWeekends: false,
    holidays: [],
    makeUpDays: [],
    projectFilename: 'MyProject',
    projectSavePath: '',
    workingDayHours: 8
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
    const [settings, setSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
    const [timeScale, setTimeScale] = useState<TimeScale>(TimeScale.Day);
    const [viewStartDate, setViewStartDate] = useState<Date>(new Date());
    const [viewDays, setViewDays] = useState<number>(30);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [showCriticalPath, setShowCriticalPath] = useState(false);
    const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [ganttContainer, setGanttContainer] = useState<HTMLDivElement | null>(null);
    const saveMenuRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(1000); // Default width

    // Derived State
    const derivedStartDate = useMemo(() => {
        const d = new Date(viewStartDate);
        d.setDate(d.getDate() - 2); // Buffer
        return d;
    }, [viewStartDate]);

    const viewEndDate = useMemo(() => addDays(derivedStartDate, viewDays + 4), [derivedStartDate, viewDays]);

    const derivedColumnWidth = useMemo(() => {
        return calculateColumnWidth(timeScale, viewDays, containerWidth);
    }, [timeScale, viewDays, containerWidth]);

    const headerDates = useMemo(() => {
        // Import these from utils or define them if not imported yet. 
        // Since I cannot easily add imports with replace_file_content without seeing the top, 
        // I will assume they are available or I will add them to the import list in a separate step if needed.
        // Wait, I just added them to utils.ts. I need to update imports in App.tsx.
        // For now, let's assume I'll fix imports next.

        switch (timeScale) {
            case TimeScale.Day: return getDatesRange(derivedStartDate, viewEndDate);
            case TimeScale.Week: return getWeeksRange(derivedStartDate, viewEndDate);
            case TimeScale.Month:
            case TimeScale.Quarter:
            case TimeScale.HalfYear: return getMonthsRange(derivedStartDate, viewEndDate);
            case TimeScale.Year: return getYearsRange(derivedStartDate, viewEndDate);
            default: return getDatesRange(derivedStartDate, viewEndDate);
        }
    }, [derivedStartDate, viewEndDate, timeScale]);

    const criticalTaskIds = useMemo(() => showCriticalPath ? calculateCriticalPath(tasks, dependencies, settings) : new Set<string>(), [tasks, dependencies, showCriticalPath, settings]);

    // Filter Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (filterState.statuses.length > 0 && !filterState.statuses.includes(task.status || TaskStatus.NotStarted)) return false;
            if (filterState.priorities.length > 0 && !filterState.priorities.includes(task.priority || Priority.Medium)) return false;
            if (filterState.ownerIds.length > 0 && !filterState.ownerIds.includes(task.ownerId || '')) return false;
            if (filterState.roles.length > 0 && !filterState.roles.includes(task.role || '')) return false;

            if (filterState.progressMin !== '' && task.progress < Number(filterState.progressMin)) return false;
            if (filterState.progressMax !== '' && task.progress > Number(filterState.progressMax)) return false;

            // Date Range Filtering
            if (filterState.dateRangeStart.from && formatDate(task.start) < filterState.dateRangeStart.from) return false;
            if (filterState.dateRangeStart.to && formatDate(task.start) > filterState.dateRangeStart.to) return false;
            if (filterState.dateRangeEnd.from && formatDate(task.end) < filterState.dateRangeEnd.from) return false;
            if (filterState.dateRangeEnd.to && formatDate(task.end) > filterState.dateRangeEnd.to) return false;

            return true;
        });
    }, [tasks, filterState]);


    const isFilterActive = useMemo(() => {
        return filterState.statuses.length > 0 ||
            filterState.priorities.length > 0 ||
            filterState.ownerIds.length > 0 ||
            filterState.roles.length > 0 ||
            filterState.progressMin !== '' ||
            filterState.progressMax !== '' ||
            filterState.dateRangeStart.from !== '' ||
            filterState.dateRangeStart.to !== '' ||
            filterState.dateRangeEnd.from !== '' ||
            filterState.dateRangeEnd.to !== '';
    }, [filterState]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 1000);
    };

    const handleGanttScroll = (scrollLeft: number) => {
        if (headerRef.current) {
            headerRef.current.scrollLeft = scrollLeft;
        }
    };

    const handleZoomToFit = () => {
        if (tasks.length === 0) return;
        const minDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
        const maxDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));

        // Add buffer
        minDate.setDate(minDate.getDate() - 5);
        maxDate.setDate(maxDate.getDate() + 5);

        const diff = diffDays(maxDate, minDate);

        setViewStartDate(minDate);

        // Auto-adjust timescale and viewDays based on duration and container width
        const availableWidth = containerWidth - 40;

        if (diff > 730) {
            setTimeScale(TimeScale.Year);
            setViewDays(diff);
        } else if (diff > 365) {
            setTimeScale(TimeScale.HalfYear);
            setViewDays(diff);
        } else if (diff > 180) {
            setTimeScale(TimeScale.Quarter);
            setViewDays(diff);
        } else if (diff > 60) {
            setTimeScale(TimeScale.Month);
            // Width 5
            const fittableDays = Math.floor(availableWidth / 5);
            setViewDays(Math.max(diff, fittableDays));
        } else if (diff > 20) {
            setTimeScale(TimeScale.Week);
            // Width 15
            const fittableDays = Math.floor(availableWidth / 15);
            setViewDays(Math.max(diff, fittableDays));
        } else {
            setTimeScale(TimeScale.Day);
            // Width 40
            const fittableDays = Math.floor(availableWidth / 40);
            setViewDays(Math.max(diff, fittableDays));
        }
    };

    const loadProjectData = (jsonString: string) => {
        try {
            const data: ProjectData = JSON.parse(jsonString);

            // Validate and migrate data
            const loadedTasks = (data.tasks || []).map(t => ({
                ...t,
                start: new Date(t.start),
                end: new Date(t.end),
                // Ensure new fields exist
                assignments: t.assignments || [],
                ownerEffort: t.ownerEffort ?? 100,
                baselineScore: t.baselineScore,
                score: t.score,
                deliverable: t.deliverable,
                role: t.role,
                description: t.description
            }));

            setTasks(loadedTasks);
            setDependencies(data.dependencies || []);
            setMembers(data.members || INITIAL_MEMBERS);

            // Merge settings, preserving defaults for new fields
            setSettings({
                ...INITIAL_SETTINGS,
                ...(data.settings || {})
            });

            showNotification('Project loaded successfully');

            // Auto-zoom to fit loaded project
            if (loadedTasks.length > 0) {
                setTimeout(handleZoomToFit, 100);
            }
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
            const link = document.createElement('a');
            link.href = url;
            link.download = `${settings.projectFilename || 'project'}.json`;
            link.click();
            URL.revokeObjectURL(url);
            showNotification('Project downloaded (Web Mode)', 'success');
        }
    };

    const saveProjectAs = async () => {
        const data = { tasks, dependencies, members, settings };
        const jsonString = JSON.stringify(data, null, 2);

        if (window.electronAPI?.isElectron) {
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
            }
        } else {
            // Web fallback - same as save (download)
            saveProject();
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            loadProjectData(saved);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveProject();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close save menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
                setIsSaveMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Track container width for dynamic column sizing
    useEffect(() => {
        if (!ganttContainer) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(ganttContainer);

        // Set initial width
        setContainerWidth(ganttContainer.offsetWidth);

        return () => {
            resizeObserver.disconnect();
        };
    }, [ganttContainer]);

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
            case TimeScale.Week: setViewStartDate(d => addDays(d, 14 * factor)); break;
            case TimeScale.Month: setViewStartDate(d => addMonths(d, 1 * factor)); break;
            case TimeScale.Quarter: setViewStartDate(d => addMonths(d, 3 * factor)); break;
            case TimeScale.HalfYear: setViewStartDate(d => addMonths(d, 6 * factor)); break;
            case TimeScale.Year: setViewStartDate(d => addYears(d, 1 * factor)); break;
        }
    };

    const handleDependencyCreate = (sourceId: string, targetId: string) => {
        if (dependencies.find(d => d.sourceId === sourceId && d.targetId === targetId)) return;
        if (sourceId === targetId) return;
        setDependencies([...dependencies, {
            id: Math.random().toString(36).substr(2, 9), sourceId, targetId, type: DependencyType.FS
        }]);
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

    const handleBatchDelete = (ids: string[]) => {
        setTasks(prev => prev.filter(t => !ids.includes(t.id)));
        setDependencies(prev => prev.filter(d => !ids.includes(d.sourceId) && !ids.includes(d.targetId)));
        showNotification(`Deleted ${ids.length} tasks`, 'success');
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

    const handleSettingsSave = (newSettings: ProjectSettings) => {
        setSettings(newSettings);
        setTasks(prevTasks => prevTasks.map(t => {
            const duration = diffProjectDays(t.start, t.end, newSettings);
            return { ...t, duration };
        }));
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

    const goToToday = () => {
        const today = new Date();
        today.setDate(today.getDate() - 3);
        setViewStartDate(today);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Notification Toast */}
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
                        <img src="./assets/icon.ico" alt="ProGantt" className="w-8 h-8 rounded-lg" />
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

                    <label className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showCriticalPath}
                            onChange={(e) => setShowCriticalPath(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Critical Path</span>
                    </label>

                    <select
                        value={timeScale}
                        onChange={(e) => {
                            const newScale = e.target.value as TimeScale;
                            setTimeScale(newScale);

                            // Dynamically adjust viewDays based on time scale and container width
                            const availableWidth = containerWidth - 40;

                            if (newScale === TimeScale.Year) {
                                // For Year view, show all tasks
                                if (tasks.length > 0) {
                                    const minDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
                                    const maxDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
                                    const taskDays = diffDays(maxDate, minDate) + 10;
                                    setViewDays(taskDays);
                                } else {
                                    setViewDays(365);
                                }
                            } else if (newScale === TimeScale.HalfYear) {
                                // For Half Year view, show all tasks
                                if (tasks.length > 0) {
                                    const minDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
                                    const maxDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
                                    const taskDays = diffDays(maxDate, minDate) + 10;
                                    setViewDays(taskDays);
                                } else {
                                    setViewDays(180);
                                }
                            } else if (newScale === TimeScale.Quarter) {
                                // For Quarter view, show all tasks
                                if (tasks.length > 0) {
                                    const minDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
                                    const maxDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
                                    const taskDays = diffDays(maxDate, minDate) + 10;
                                    setViewDays(taskDays);
                                } else {
                                    setViewDays(90);
                                }
                            } else if (newScale === TimeScale.Month) {
                                // Calculate days that fit (width 5)
                                const fittableDays = Math.floor(availableWidth / 5);
                                setViewDays(Math.max(60, fittableDays));
                            } else if (newScale === TimeScale.Week) {
                                // Calculate days that fit (width 15)
                                const fittableDays = Math.floor(availableWidth / 15);
                                setViewDays(Math.max(30, fittableDays));
                            } else {
                                // Day view - calculate days that fit (width 40)
                                const fittableDays = Math.floor(availableWidth / 40);
                                setViewDays(Math.max(30, fittableDays));
                            }
                        }}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50 outline-none"
                    >
                        <option value={TimeScale.Day}>Day View</option>
                        <option value={TimeScale.Week}>Week View</option>
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
                            onClick={async () => {
                                const result = await exportTasksToCSV(tasks, members, dependencies, settings);
                                if (result.success) {
                                    showNotification('Tasks exported successfully', 'success');
                                }
                            }}
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

                    <div className="relative" ref={saveMenuRef}>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={saveProject}
                                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-l-md hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                                title="Save Project (Ctrl+S)"
                            >
                                <Save size={16} className="mr-1" /> Save
                            </button>
                            <button
                                onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                                className="flex items-center px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border-t border-b border-r border-gray-200 rounded-r-md hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                            >
                                <ChevronDown size={14} />
                            </button>
                        </div>

                        {isSaveMenuOpen && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                                <button
                                    onClick={() => { saveProjectAs(); setIsSaveMenuOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Save As...
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={() => setIsAboutOpen(true)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                        <Info size={20} />
                    </button>
                </div>
            </header>

            {/* Filter Panel */}
            <FilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                members={members}
                filter={filterState}
                onFilterChange={setFilterState}
                onClearFilters={() => setFilterState(INITIAL_FILTER)}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {(viewMode === ViewMode.Split || viewMode === ViewMode.Table) && (
                    <div className={`${viewMode === ViewMode.Split ? 'w-1/3 border-r border-gray-200' : 'w-full'} h-full overflow-hidden bg-white`}>
                        <TaskList
                            tasks={filteredTasks}
                            members={members}
                            onTaskUpdate={handleTaskUpdate}
                            onTaskMove={handleTaskMove}
                            onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                            settings={settings}
                            onBatchDelete={handleBatchDelete}
                            onError={(msg) => showNotification(msg, 'error')}
                        />
                    </div>
                )}

                {(viewMode === ViewMode.Split || viewMode === ViewMode.Gantt) && (
                    <div className={`${viewMode === ViewMode.Split ? 'w-2/3' : 'w-full'} h-full overflow-hidden flex flex-col bg-gray-50 relative`} ref={setGanttContainer}>
                        {/* Gantt Header (Dates) */}
                        <div className="h-10 bg-white border-b border-gray-200 flex overflow-hidden select-none" ref={headerRef}>
                            <div className="flex relative" style={{ width: headerDates.length * derivedColumnWidth }}>
                                {headerDates.map((date, i) => {
                                    const isMonthStart = date.getDate() === 1;
                                    const isWeekStart = date.getDay() === 1; // Monday
                                    const isToday = date.toDateString() === new Date().toDateString();

                                    let showLabel = false;
                                    let labelText = '';
                                    let subText = '';

                                    if (timeScale === TimeScale.Day) {
                                        showLabel = true;
                                        labelText = date.getDate().toString();
                                        subText = date.toLocaleDateString('en-US', { weekday: 'short' });
                                    } else if (timeScale === TimeScale.Week) {
                                        if (isWeekStart || i === 0) {
                                            showLabel = true;
                                            labelText = `W${getWeekNumber(date)}`;
                                            subText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }
                                    } else if (timeScale === TimeScale.Month) {
                                        if (isMonthStart || i === 0) {
                                            showLabel = true;
                                            labelText = date.toLocaleDateString('en-US', { month: 'short' });
                                        }
                                    } else {
                                        // Year, HalfYear, Quarter
                                        if (isMonthStart || i === 0) {
                                            showLabel = true;
                                            labelText = date.toLocaleDateString('en-US', { month: 'short' });
                                        }
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
                            tasks={filteredTasks}
                            dependencies={dependencies}
                            onScroll={handleGanttScroll}
                            viewStartDate={derivedStartDate}
                            viewEndDate={viewEndDate}
                            columnWidth={derivedColumnWidth}
                            showCriticalPath={showCriticalPath}
                            settings={settings}
                            timeScale={timeScale}
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
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
                onSave={handleTaskSave}
                onDelete={handleTaskDelete}
                onError={(msg) => showNotification(msg, 'error')}
                members={members}
                dependencies={dependencies}
                allTasks={tasks}
                settings={settings}
            />

            <MemberManager
                isOpen={isMemberManagerOpen}
                onClose={() => setIsMemberManagerOpen(false)}
                members={members}
                onUpdateMembers={setMembers}
                onShowNotification={showNotification}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={handleSettingsSave}
            />

            {/* About Dialog */}
            {isAboutOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <img src="./assets/icon.ico" alt="ProGantt" className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-md" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">ProGantt</h2>
                        <p className="text-sm text-gray-500 mb-4">Version {APP_VERSION}</p>

                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                            <p>Created by <span className="font-medium text-slate-800">{APP_AUTHOR}</span></p>
                            <p>Released on {APP_RELEASE_DATE}</p>
                        </div>

                        <button
                            onClick={() => setIsAboutOpen(false)}
                            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for week number
function getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

// Helper for isFilterActive
const isFilterActive = false; // Placeholder if not used, but let's check if we need it.
// Actually, isFilterActive is not defined in the component state, but used in JSX.
// Let's add it to the component state or derive it.
// Looking at previous code, it wasn't there. But `filteredTasks` logic implies filtering.
// Let's derive it.

export default App;
