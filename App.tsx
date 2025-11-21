
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, Dependency, ViewMode, TimeScale, DependencyType, ProjectData, COLUMN_WIDTH } from './types';
import GanttChart from './components/GanttChart';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import { addDays, addMonths, addYears, getDatesRange, calculateCriticalPath, diffDays } from './utils';
import { 
    Layout, Table, Columns, BarChart3, Save, Download, 
    Trash2, Plus, ChevronLeft, ChevronRight, FolderOpen,
    ZoomIn, ZoomOut, Network
} from 'lucide-react';

const STORAGE_KEY = 'progantt-data-v1';

const INITIAL_TASKS: Task[] = [
  { id: '1', name: 'Project Initiation', start: new Date(2024, 5, 1), end: new Date(2024, 5, 5), duration: 4, progress: 100, owner: 'Alice', role: 'PM', type: 'phase' },
  { id: '2', name: 'Requirement Analysis', start: new Date(2024, 5, 6), end: new Date(2024, 5, 10), duration: 4, progress: 60, owner: 'Bob', role: 'Analyst', type: 'task' },
  { id: '3', name: 'Design Phase', start: new Date(2024, 5, 11), end: new Date(2024, 5, 18), duration: 7, progress: 0, owner: 'Charlie', role: 'Designer', type: 'task' },
  { id: '4', name: 'Development', start: new Date(2024, 5, 15), end: new Date(2024, 5, 30), duration: 15, progress: 0, owner: 'Dave', role: 'Dev', type: 'task' },
  { id: '5', name: 'Testing', start: new Date(2024, 6, 1), end: new Date(2024, 6, 10), duration: 9, progress: 0, owner: 'Eve', role: 'QA', type: 'task' },
  { id: '6', name: 'Final Review', start: new Date(2024, 6, 11), end: new Date(2024, 6, 12), duration: 1, progress: 0, owner: 'Alice', role: 'PM', type: 'milestone', color: '#f59e0b' },
];

const INITIAL_DEPENDENCIES: Dependency[] = [
  { id: 'd1', sourceId: '1', targetId: '2', type: DependencyType.FS },
  { id: 'd2', sourceId: '2', targetId: '3', type: DependencyType.FS },
  { id: 'd3', sourceId: '3', targetId: '4', type: DependencyType.FS },
  { id: 'd4', sourceId: '4', targetId: '5', type: DependencyType.FS },
  { id: 'd5', sourceId: '5', targetId: '6', type: DependencyType.FS },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [dependencies, setDependencies] = useState<Dependency[]>(INITIAL_DEPENDENCIES);
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [timeScale, setTimeScale] = useState<TimeScale>(TimeScale.Day);
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date(2024, 5, 1));
  const [viewDays, setViewDays] = useState<number>(30);
  const [showCriticalPath, setShowCriticalPath] = useState<boolean>(false);
  
  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived State
  const columnWidth = useMemo(() => {
      switch(timeScale) {
          case TimeScale.Day: return 50;
          case TimeScale.Month: return 15; // Compact for monthly view
          case TimeScale.Quarter: return 8;
          case TimeScale.HalfYear: return 4;
          case TimeScale.Year: return 2;
          default: return 50;
      }
  }, [timeScale]);

  const viewEndDate = useMemo(() => addDays(viewStartDate, viewDays), [viewStartDate, viewDays]);
  const headerDates = useMemo(() => getDatesRange(viewStartDate, viewEndDate), [viewStartDate, viewEndDate]);
  
  const criticalTaskIds = useMemo(() => {
      if (!showCriticalPath) return new Set<string>();
      return calculateCriticalPath(tasks, dependencies);
  }, [tasks, dependencies, showCriticalPath]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: ProjectData = JSON.parse(saved);
        const restoredTasks = parsed.tasks.map(t => ({
          ...t,
          start: new Date(t.start),
          end: new Date(t.end)
        }));
        setTasks(restoredTasks);
        setDependencies(parsed.dependencies);
      } catch (e) { console.error("Failed load", e); }
    }
  }, []);

  const saveProject = () => {
    const data: ProjectData = { tasks, dependencies };
    const json = JSON.stringify(data, null, 2);
    localStorage.setItem(STORAGE_KEY, json);
    
    // Download File
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progantt-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const openProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const parsed: ProjectData = JSON.parse(ev.target?.result as string);
              setTasks(parsed.tasks.map(t => ({ ...t, start: new Date(t.start), end: new Date(t.end) })));
              setDependencies(parsed.dependencies);
              // Center view on project start
              if (parsed.tasks.length > 0) {
                const minDate = new Date(Math.min(...parsed.tasks.map(t => new Date(t.start).getTime())));
                setViewStartDate(minDate);
              }
          } catch(err) { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
  };

  const clearProject = () => {
      if(confirm('Reset to default?')) {
          setTasks(INITIAL_TASKS);
          setDependencies(INITIAL_DEPENDENCIES);
      }
  }

  // Navigation Logic
  const handleStep = (direction: 'prev' | 'next') => {
      const factor = direction === 'next' ? 1 : -1;
      switch(timeScale) {
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

  // Task CRUD
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleTaskSave = (updatedTask: Task, newDeps: Dependency[]) => {
      handleTaskUpdate(updatedTask);
      // Update deps: Remove old ones for this target, add new ones
      setDependencies(prev => {
          const others = prev.filter(d => d.targetId !== updatedTask.id);
          return [...others, ...newDeps];
      });
  };

  const handleTaskDelete = (id: string) => {
      if(confirm('Delete this task?')) {
          setTasks(prev => prev.filter(t => t.id !== id));
          setDependencies(prev => prev.filter(d => d.sourceId !== id && d.targetId !== id));
          setIsModalOpen(false);
      }
  };

  const handleAddTask = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const start = new Date(viewStartDate);
    const end = addDays(start, 2);
    const newTask: Task = {
        id: newId, name: 'New Task', start, end, duration: 2, progress: 0, owner: '', type: 'task'
    };
    setTasks([...tasks, newTask]);
  };

  // Dependencies
  const handleDependencyCreate = (sourceId: string, targetId: string) => {
     if(dependencies.find(d => d.sourceId === sourceId && d.targetId === targetId)) return;
     if(sourceId === targetId) return;
     setDependencies([...dependencies, {
         id: Math.random().toString(36).substr(2, 9), sourceId, targetId, type: DependencyType.FS
     }]);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 mr-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                <h1 className="text-lg font-bold text-slate-800 hidden md:block">ProGantt</h1>
           </div>
           
           {/* View Modes */}
           <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode(ViewMode.Table)} className={`p-1.5 rounded ${viewMode === ViewMode.Table ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Table size={18}/></button>
              <button onClick={() => setViewMode(ViewMode.Split)} className={`p-1.5 rounded ${viewMode === ViewMode.Split ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Columns size={18}/></button>
              <button onClick={() => setViewMode(ViewMode.Gantt)} className={`p-1.5 rounded ${viewMode === ViewMode.Gantt ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><BarChart3 size={18}/></button>
           </div>

           <div className="h-6 w-px bg-gray-200 mx-2"></div>
           
           <button onClick={handleAddTask} className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              <Plus size={16} className="mr-1" /> Task
           </button>

           {/* Scale Dropdown */}
           <select 
             value={timeScale} 
             onChange={(e) => {
                 setTimeScale(e.target.value as TimeScale);
                 // Adjust visible days based on scale to keep view reasonable
                 if (e.target.value === TimeScale.Year) setViewDays(365);
                 else if (e.target.value === TimeScale.Month) setViewDays(60);
                 else setViewDays(30);
             }}
             className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50"
           >
               <option value={TimeScale.Day}>Day View</option>
               <option value={TimeScale.Month}>Month View</option>
               <option value={TimeScale.Quarter}>Quarter View</option>
               <option value={TimeScale.HalfYear}>Half Year</option>
               <option value={TimeScale.Year}>Year View</option>
           </select>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 p-1 space-x-1">
                <button onClick={() => handleStep('prev')} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={16}/></button>
                <button onClick={goToToday} className="px-2 py-0.5 text-xs font-medium bg-white border rounded shadow-sm hover:bg-gray-50">Today</button>
                <button onClick={() => handleStep('next')} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={16}/></button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <input type="file" ref={fileInputRef} onChange={openProject} accept=".json" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Open File">
                <FolderOpen size={20} />
            </button>

            <button onClick={saveProject} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Save & Download">
                <Save size={20} />
            </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {(viewMode === ViewMode.Table || viewMode === ViewMode.Split) && (
           <div className={`${viewMode === ViewMode.Table ? 'w-full' : 'w-1/3 min-w-[350px]'} flex flex-col z-10 shadow-lg bg-white`}>
              <TaskList 
                tasks={tasks} 
                onTaskUpdate={handleTaskUpdate} 
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
              />
           </div>
        )}

        {(viewMode === ViewMode.Gantt || viewMode === ViewMode.Split) && (
           <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {/* Dynamic Header */}
              <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-20 h-[50px] overflow-hidden">
                   <div className="relative h-full" style={{ width: headerDates.length * columnWidth }}>
                        {headerDates.map((date, i) => {
                            const isYearStart = date.getMonth() === 0 && date.getDate() === 1;
                            const isMonthStart = date.getDate() === 1;
                            const isWeekStart = date.getDay() === 1;
                            const isToday = diffDays(date, new Date()) === 0;

                            // Render logic depends on scale
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
                                    style={{ left: i * columnWidth, width: columnWidth }}
                                >
                                    {/* Top Level Month/Year Label */}
                                    {(isMonthStart || (i===0 && timeScale === TimeScale.Day)) && (
                                        <div className="absolute top-1 left-1 font-bold text-slate-700 whitespace-nowrap z-10 bg-gray-50 px-1 rounded">
                                            {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </div>
                                    )}

                                    {showLabel && columnWidth > 10 && (
                                        <>
                                            <span className={isToday ? 'font-bold text-blue-600' : ''}>{labelText}</span>
                                            {columnWidth > 30 && <span className="text-[10px] opacity-60">{subText}</span>}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                   </div>
              </div>

              <GanttChart 
                  tasks={tasks}
                  dependencies={dependencies}
                  viewStartDate={viewStartDate}
                  viewEndDate={viewEndDate}
                  columnWidth={columnWidth}
                  showCriticalPath={showCriticalPath}
                  onTaskUpdate={handleTaskUpdate}
                  onDependencyDelete={(id) => setDependencies(prev => prev.filter(d => d.id !== id))}
                  onDependencyCreate={handleDependencyCreate}
                  onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                  criticalTaskIds={criticalTaskIds}
              />
           </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && (
          <TaskModal 
            task={selectedTask}
            allTasks={tasks}
            dependencies={dependencies}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleTaskSave}
            onDelete={handleTaskDelete}
          />
      )}
    </div>
  );
};

export default App;
