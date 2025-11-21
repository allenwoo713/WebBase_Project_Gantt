
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, Dependency, ViewMode, TimeScale, DependencyType, ProjectData, COLUMN_WIDTH } from './types';
import GanttChart from './components/GanttChart';
import TaskList from './components/TaskList';
import { addDays, getDatesRange, calculateCriticalPath, diffDays } from './utils';
import { 
    Layout, 
    Table, 
    Columns, 
    BarChart3, 
    Save, 
    Download, 
    Trash2, 
    Plus, 
    ChevronLeft, 
    ChevronRight,
    Calendar as CalendarIcon,
    Network,
    ZoomIn,
    ZoomOut
} from 'lucide-react';

const STORAGE_KEY = 'progantt-data-v1';

// --- Initial Mock Data ---
const INITIAL_TASKS: Task[] = [
  { id: '1', name: 'Project Initiation', start: new Date(2024, 5, 1), end: new Date(2024, 5, 5), duration: 4, progress: 100, owner: 'Alice', type: 'phase' },
  { id: '2', name: 'Requirement Analysis', start: new Date(2024, 5, 6), end: new Date(2024, 5, 10), duration: 4, progress: 60, owner: 'Bob', type: 'task' },
  { id: '3', name: 'Design Phase', start: new Date(2024, 5, 11), end: new Date(2024, 5, 18), duration: 7, progress: 0, owner: 'Charlie', type: 'task' },
  { id: '4', name: 'Development', start: new Date(2024, 5, 15), end: new Date(2024, 5, 30), duration: 15, progress: 0, owner: 'Dave', type: 'task' },
  { id: '5', name: 'Testing', start: new Date(2024, 6, 1), end: new Date(2024, 6, 10), duration: 9, progress: 0, owner: 'Eve', type: 'task' },
  { id: '6', name: 'Final Review', start: new Date(2024, 6, 11), end: new Date(2024, 6, 12), duration: 1, progress: 0, owner: 'Alice', type: 'milestone', color: '#f59e0b' },
];

const INITIAL_DEPENDENCIES: Dependency[] = [
  { id: 'd1', sourceId: '1', targetId: '2', type: DependencyType.FS },
  { id: 'd2', sourceId: '2', targetId: '3', type: DependencyType.FS },
  { id: 'd3', sourceId: '3', targetId: '4', type: DependencyType.FS },
  { id: 'd4', sourceId: '4', targetId: '5', type: DependencyType.FS },
  { id: 'd5', sourceId: '5', targetId: '6', type: DependencyType.FS },
];

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [dependencies, setDependencies] = useState<Dependency[]>(INITIAL_DEPENDENCIES);
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date(2024, 5, 1)); // Start roughly at project start
  const [viewDays, setViewDays] = useState<number>(30);
  const [showCriticalPath, setShowCriticalPath] = useState<boolean>(false);
  
  // --- Derived State ---
  const viewEndDate = useMemo(() => addDays(viewStartDate, viewDays), [viewStartDate, viewDays]);
  
  // Dates Header
  const headerDates = useMemo(() => getDatesRange(viewStartDate, viewEndDate), [viewStartDate, viewEndDate]);

  // Critical Path Analysis
  const criticalTaskIds = useMemo(() => {
      if (!showCriticalPath) return new Set<string>();
      return calculateCriticalPath(tasks, dependencies);
  }, [tasks, dependencies, showCriticalPath]);

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: ProjectData = JSON.parse(saved);
        // Restore Dates from strings
        const restoredTasks = parsed.tasks.map(t => ({
          ...t,
          start: new Date(t.start),
          end: new Date(t.end)
        }));
        setTasks(restoredTasks);
        setDependencies(parsed.dependencies);
      } catch (e) {
        console.error("Failed to load project", e);
      }
    }
  }, []);

  const saveProject = () => {
    const data: ProjectData = { tasks, dependencies };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    alert('Project saved successfully!');
  };

  const clearProject = () => {
      if(confirm('Are you sure you want to reset to default data? All changes will be lost.')) {
          setTasks(INITIAL_TASKS);
          setDependencies(INITIAL_DEPENDENCIES);
          localStorage.removeItem(STORAGE_KEY);
      }
  }

  // --- Handlers ---
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleAddTask = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    // Add after last task or relative to view
    const start = new Date(viewStartDate);
    const end = addDays(start, 2);
    const newTask: Task = {
        id: newId,
        name: 'New Task',
        start,
        end,
        duration: 2,
        progress: 0,
        owner: '',
        type: 'task'
    };
    setTasks([...tasks, newTask]);
  };

  const handleDependencyCreate = (sourceId: string, targetId: string) => {
     // Prevent duplicates
     if(dependencies.find(d => d.sourceId === sourceId && d.targetId === targetId)) return;
     // Prevent self-loops
     if(sourceId === targetId) return;

     const newDep: Dependency = {
         id: Math.random().toString(36).substr(2, 9),
         sourceId,
         targetId,
         type: DependencyType.FS
     };
     setDependencies([...dependencies, newDep]);
  };

  const handleDependencyDelete = (id: string) => {
      setDependencies(prev => prev.filter(d => d.id !== id));
  };

  const handleZoom = (direction: 'in' | 'out') => {
      setViewDays(prev => direction === 'in' ? Math.max(7, prev - 7) : Math.min(90, prev + 7));
  }

  const handleScrollDate = (days: number) => {
      setViewStartDate(prev => addDays(prev, days));
  }

  const goToToday = () => {
      const today = new Date();
      // Align to roughly start of week
      today.setDate(today.getDate() - 3); 
      setViewStartDate(today);
  }

  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 mr-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                <h1 className="text-lg font-bold text-slate-800 hidden md:block">ProGantt</h1>
           </div>
           
           {/* View Toggles */}
           <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode(ViewMode.Table)}
                className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.Table ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Table Only"
              >
                 <Table size={18}/>
              </button>
              <button 
                onClick={() => setViewMode(ViewMode.Split)}
                className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.Split ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Split View"
              >
                 <Columns size={18}/>
              </button>
              <button 
                onClick={() => setViewMode(ViewMode.Gantt)}
                className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.Gantt ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Gantt Only"
              >
                 <BarChart3 size={18}/>
              </button>
           </div>

           <div className="h-6 w-px bg-gray-200 mx-2"></div>

           {/* Actions */}
           <button onClick={handleAddTask} className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors">
              <Plus size={16} className="mr-1" /> New Task
           </button>

           <button 
                onClick={() => setShowCriticalPath(!showCriticalPath)}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${showCriticalPath ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
           >
               <Network size={16} className="mr-1" /> Critical Path
           </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 p-1 space-x-1">
                <button onClick={() => handleScrollDate(-7)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={16}/></button>
                <button onClick={goToToday} className="px-2 py-0.5 text-xs font-medium bg-white border rounded shadow-sm hover:bg-gray-50">Today</button>
                <button onClick={() => handleScrollDate(7)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={16}/></button>
            </div>

            <div className="flex items-center space-x-1">
                <button onClick={() => handleZoom('out')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><ZoomOut size={18}/></button>
                <button onClick={() => handleZoom('in')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><ZoomIn size={18}/></button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <button onClick={saveProject} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Save Locally">
                <Save size={20} />
            </button>
            <button onClick={clearProject} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Reset Data">
                <Trash2 size={20} />
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel: Task List */}
        {(viewMode === ViewMode.Table || viewMode === ViewMode.Split) && (
           <div 
            className={`${viewMode === ViewMode.Table ? 'w-full' : 'w-1/3 min-w-[350px]'} flex flex-col z-10 shadow-lg bg-white`}
            style={{ transition: 'width 0.2s' }}
           >
              <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} />
           </div>
        )}

        {/* Right Panel: Gantt */}
        {(viewMode === ViewMode.Gantt || viewMode === ViewMode.Split) && (
           <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {/* Timeline Header */}
              <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-20 h-[50px] overflow-hidden" style={{ marginLeft: 0 }}>
                   <div className="relative h-full" style={{ width: headerDates.length * COLUMN_WIDTH }}>
                        {headerDates.map((date, i) => {
                            const isMonthStart = date.getDate() === 1;
                            return (
                                <div 
                                    key={i} 
                                    className={`absolute h-full border-r border-gray-200 flex flex-col justify-end items-center pb-1 text-xs text-gray-500 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100/50' : ''}`}
                                    style={{ left: i * COLUMN_WIDTH, width: COLUMN_WIDTH }}
                                >
                                    {/* Month Label (Only show on first day or every 7 days roughly if needed) */}
                                    {isMonthStart && (
                                        <div className="absolute top-1 left-1 font-bold text-slate-700 whitespace-nowrap">
                                            {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </div>
                                    )}
                                    <span className={diffDays(date, new Date()) === 0 ? 'font-bold text-blue-600' : ''}>
                                        {date.getDate()}
                                    </span>
                                    <span className="text-[10px] opacity-60">{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                </div>
                            );
                        })}
                   </div>
              </div>

              {/* Chart Area */}
              <GanttChart 
                  tasks={tasks}
                  dependencies={dependencies}
                  viewStartDate={viewStartDate}
                  viewEndDate={viewEndDate}
                  showCriticalPath={showCriticalPath}
                  onTaskUpdate={handleTaskUpdate}
                  onDependencyDelete={handleDependencyDelete}
                  onDependencyCreate={handleDependencyCreate}
                  criticalTaskIds={criticalTaskIds}
              />
           </div>
        )}
      </div>
    </div>
  );
};

export default App;
