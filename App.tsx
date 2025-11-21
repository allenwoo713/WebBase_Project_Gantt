import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Dependency, ViewMode, TimeScale, DependencyType, ProjectData, Member, ProjectSettings, Holiday } from './types';
import GanttChart from './components/GanttChart';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import MemberManager from './components/MemberManager';
import SettingsModal from './components/SettingsModal';
import { addDays, addMonths, addYears, getDatesRange, calculateCriticalPath, diffDays, diffProjectDays, addProjectDays } from './utils';
import { 
    Table, Columns, BarChart3, Save, Plus, ChevronLeft, ChevronRight, FolderOpen,
    Users, Settings as SettingsIcon
} from 'lucide-react';

const STORAGE_KEY = 'progantt-data-v2';

const INITIAL_MEMBERS: Member[] = [
    { id: 'm1', name: 'Alice', role: 'Project Manager', email: 'alice@corp.com', color: '#3b82f6' },
    { id: 'm2', name: 'Bob', role: 'Business Analyst', email: 'bob@corp.com', color: '#f59e0b' },
    { id: 'm3', name: 'Charlie', role: 'UI Designer', email: 'charlie@corp.com', color: '#ec4899' },
    { id: 'm4', name: 'Dave', role: 'Lead Dev', email: 'dave@corp.com', color: '#10b981' },
    { id: 'm5', name: 'Eve', role: 'QA Engineer', email: 'eve@corp.com', color: '#8b5cf6' },
];

const INITIAL_TASKS: Task[] = [
  { id: '1', name: 'Project Initiation', start: new Date(2024, 5, 1), end: new Date(2024, 5, 5), duration: 4, progress: 100, ownerId: 'm1', role: 'PM', type: 'phase' },
  { id: '2', name: 'Requirement Analysis', start: new Date(2024, 5, 6), end: new Date(2024, 5, 10), duration: 4, progress: 60, ownerId: 'm2', role: 'Analyst', type: 'task' },
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
  
  // Modal States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columnWidth = useMemo(() => {
      switch(timeScale) {
          case TimeScale.Day: return 50;
          case TimeScale.Month: return 15; 
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

  // Persistence & Migration
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: ProjectData = JSON.parse(saved);
        setTasks(parsed.tasks.map(t => ({ ...t, start: new Date(t.start), end: new Date(t.end) })));
        setDependencies(parsed.dependencies);
        if(parsed.members) setMembers(parsed.members);
        
        // Migration for Holidays (String[] -> Holiday[])
        let loadedSettings = parsed.settings || INITIAL_SETTINGS;
        if (loadedSettings.holidays && loadedSettings.holidays.length > 0) {
            // Check if it is old string format
            if (typeof loadedSettings.holidays[0] === 'string') {
                 const oldHolidays = loadedSettings.holidays as unknown as string[];
                 const newHolidays: Holiday[] = oldHolidays.map((hStr, idx) => ({
                     id: `migrated-${idx}`,
                     name: 'Holiday',
                     start: hStr,
                     end: hStr
                 }));
                 loadedSettings = { ...loadedSettings, holidays: newHolidays };
            }
        }
        setSettings(loadedSettings);

      } catch (e) { console.error("Failed load", e); }
    }
  }, []);

  const saveProject = () => {
    const data: ProjectData = { tasks, dependencies, members, settings };
    const json = JSON.stringify(data, null, 2);
    localStorage.setItem(STORAGE_KEY, json);
    
    const filename = settings.projectFilename ? `${settings.projectFilename}.json` : `progantt-${new Date().toISOString().slice(0,10)}.json`;
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
              if(parsed.members) setMembers(parsed.members);
              
              // Migration on Open
              let loadedSettings = parsed.settings || INITIAL_SETTINGS;
              if (loadedSettings.holidays && loadedSettings.holidays.length > 0) {
                    if (typeof loadedSettings.holidays[0] === 'string') {
                        const oldHolidays = loadedSettings.holidays as unknown as string[];
                        const newHolidays: Holiday[] = oldHolidays.map((hStr, idx) => ({
                            id: `migrated-${idx}`,
                            name: 'Holiday',
                            start: hStr,
                            end: hStr
                        }));
                        loadedSettings = { ...loadedSettings, holidays: newHolidays };
                    }
              }
              setSettings(loadedSettings);
              
              if (parsed.tasks.length > 0) {
                const minDate = new Date(Math.min(...parsed.tasks.map(t => new Date(t.start).getTime())));
                setViewStartDate(minDate);
              }
          } catch(err) { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
  };

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

  // RECALCULATE DURATION FOR ALL TASKS ON SETTINGS CHANGE
  const handleSettingsSave = (newSettings: ProjectSettings) => {
      setSettings(newSettings);
      setTasks(prevTasks => prevTasks.map(t => {
          // Re-run the calculation logic with the NEW settings
          const duration = diffProjectDays(t.start, t.end, newSettings);
          return { ...t, duration };
      }));
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => {
        if (t.id !== updatedTask.id) return t;
        if (t.start.getTime() !== updatedTask.start.getTime()) {
             const newEnd = addProjectDays(updatedTask.start, t.duration, settings);
             return { ...updatedTask, end: newEnd };
        }
        if (t.end.getTime() !== updatedTask.end.getTime()) {
             const newDuration = diffProjectDays(updatedTask.start, updatedTask.end, settings);
             return { ...updatedTask, duration: newDuration };
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

  const handleAddTask = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const start = new Date(viewStartDate);
    const end = addProjectDays(start, 2, settings); 
    const newTask: Task = {
        id: newId, name: 'New Task', start, end, duration: 2, progress: 0, type: 'task'
    };
    setTasks([...tasks, newTask]);
  };

  const handleDependencyCreate = (sourceId: string, targetId: string) => {
     if(dependencies.find(d => d.sourceId === sourceId && d.targetId === targetId)) return;
     if(sourceId === targetId) return;
     setDependencies([...dependencies, {
         id: Math.random().toString(36).substr(2, 9), sourceId, targetId, type: DependencyType.FS
     }]);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm z-20">
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 mr-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                <h1 className="text-lg font-bold text-slate-800 hidden md:block">ProGantt</h1>
           </div>
           
           <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode(ViewMode.Table)} className={`p-1.5 rounded ${viewMode === ViewMode.Table ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Table size={18}/></button>
              <button onClick={() => setViewMode(ViewMode.Split)} className={`p-1.5 rounded ${viewMode === ViewMode.Split ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Columns size={18}/></button>
              <button onClick={() => setViewMode(ViewMode.Gantt)} className={`p-1.5 rounded ${viewMode === ViewMode.Gantt ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><BarChart3 size={18}/></button>
           </div>

           <div className="h-6 w-px bg-gray-200 mx-2"></div>
           
           <button onClick={handleAddTask} className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm">
              <Plus size={16} className="mr-1" /> Task
           </button>
           
           <button onClick={() => setIsMemberManagerOpen(true)} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
               <Users size={16} className="mr-2"/> Members
           </button>
           
           <button onClick={() => setIsSettingsOpen(true)} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
               <SettingsIcon size={16} className="mr-2"/> Settings
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
            <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 p-1 space-x-1">
                <button onClick={() => handleStep('prev')} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={16}/></button>
                <button onClick={goToToday} className="px-2 py-0.5 text-xs font-medium bg-white border rounded shadow-sm hover:bg-gray-50">Today</button>
                <button onClick={() => handleStep('next')} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={16}/></button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <input type="file" ref={fileInputRef} onChange={openProject} accept=".json" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Open File">
                <FolderOpen size={20} />
            </button>

            <button onClick={saveProject} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Save & Download">
                <Save size={20} />
            </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {(viewMode === ViewMode.Table || viewMode === ViewMode.Split) && (
           <div className={`${viewMode === ViewMode.Table ? 'w-full' : 'w-1/3'} flex flex-col z-10 shadow-xl bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}>
              <TaskList 
                tasks={tasks}
                members={members} 
                onTaskUpdate={handleTaskUpdate} 
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
              />
           </div>
        )}

        {(viewMode === ViewMode.Gantt || viewMode === ViewMode.Split) && (
           <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {/* Dynamic Gantt Header */}
              <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10 h-[50px] overflow-hidden select-none shadow-sm">
                   <div className="relative h-full" style={{ width: headerDates.length * columnWidth }}>
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
                                    style={{ left: i * columnWidth, width: columnWidth }}
                                >
                                    {/* Month Label */}
                                    {(isMonthStart || (i===0 && timeScale === TimeScale.Day)) && (
                                        <div className="absolute top-1 left-1 font-bold text-slate-700 whitespace-nowrap z-10 bg-gray-50 px-1 rounded border border-gray-200 shadow-sm text-[10px]">
                                            {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </div>
                                    )}

                                    {showLabel && columnWidth > 10 && (
                                        <>
                                            <span className={isToday ? 'font-bold text-blue-600' : ''}>{labelText}</span>
                                            {columnWidth > 30 && <span className="text-[9px] opacity-60 uppercase">{subText}</span>}
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
    </div>
  );
};

export default App;