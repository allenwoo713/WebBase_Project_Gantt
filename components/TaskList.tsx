import React from 'react';
import { Task, ROW_HEIGHT, Member, Priority } from '../types';
import { Calendar, User, CheckCircle2, Users, Target, Clock } from 'lucide-react';
import { formatDate } from '../utils';

interface TaskListProps {
  tasks: Task[];
  members: Member[];
  onTaskUpdate: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onError: (msg: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, members, onTaskUpdate, onTaskClick, onError }) => {
  
  const handleChange = (id: string, field: keyof Task, value: any) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        onTaskUpdate({ ...task, [field]: value });
    }
  };

  // Helper to handle date changes safely without UTC shifts
  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>, task: Task, field: 'start' | 'end') => {
      if (!e.target.value) return;
      
      // Parse YYYY-MM-DD to Local Time (00:00:00)
      const [y, m, d] = e.target.value.split('-').map(Number);
      const newDate = new Date(y, m - 1, d);

      if (field === 'start') {
          // Comparison logic using getTime()
          if (newDate.getTime() > task.end.getTime()) {
              onError("Start date cannot be later than end date.");
              return;
          }
          const duration = task.end.getTime() - task.start.getTime();
          // Maintain duration for start change
          const newEnd = new Date(newDate.getTime() + duration);
          onTaskUpdate({ ...task, start: newDate, end: newEnd });
      } else {
          // Comparison logic using getTime()
          if (newDate.getTime() < task.start.getTime()) {
              onError("End date cannot be earlier than start date.");
              return;
          }
          onTaskUpdate({ ...task, end: newDate });
      }
  };

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.High: return 'text-orange-600 bg-orange-50';
          case Priority.Medium: return 'text-blue-600 bg-blue-50';
          case Priority.Low: return 'text-green-600 bg-green-50';
          default: return 'text-gray-600';
      }
  };

  const showPicker = (e: React.MouseEvent<HTMLInputElement>) => {
      try {
          if (e.currentTarget && typeof e.currentTarget.showPicker === 'function') {
              e.currentTarget.showPicker();
          }
      } catch (err) {
          // Fallback
      }
  };

  // Common style for inputs
  const dateInputClass = "w-full bg-transparent focus:outline-none text-[11px] cursor-pointer [color-scheme:light]";

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white select-none w-full overflow-hidden">
      {/* Header - Scrollable Container */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1300px]"> 
            
            {/* Header Row */}
            <div className="flex items-center bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-500 sticky top-0 z-10" style={{ height: 50 }}>
                <div className="w-10 flex justify-center shrink-0">#</div>
                <div className="w-64 px-2 border-l border-gray-100 shrink-0">Task Name</div>
                <div className="w-24 px-2 border-l border-gray-100 shrink-0">Role</div>
                <div className="w-40 px-2 border-l border-gray-100 shrink-0">Owner (Effort)</div>
                <div className="w-48 px-2 border-l border-gray-100 shrink-0">Team (Effort)</div>
                <div className="w-32 px-2 border-l border-gray-100 shrink-0">Deliverable</div>
                <div className="w-24 px-2 border-l border-gray-100 shrink-0">Base Score</div>
                <div className="w-24 px-2 border-l border-gray-100 shrink-0">Score</div>
                <div className="w-28 px-2 border-l border-gray-100 shrink-0">Start</div>
                <div className="w-28 px-2 border-l border-gray-100 shrink-0">End</div>
                <div className="w-16 px-2 border-l border-gray-100 shrink-0">Days</div>
                <div className="w-16 px-2 border-l border-gray-100 shrink-0">%</div>
                <div className="w-24 px-2 border-l border-gray-100 shrink-0">Priority</div>
            </div>

            {/* Rows */}
            <div>
                {tasks.map((task, index) => (
                <div 
                    key={task.id} 
                    className="flex items-center border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer bg-white"
                    style={{ height: ROW_HEIGHT }}
                    onDoubleClick={() => onTaskClick && onTaskClick(task)}
                >
                    <div className="w-10 flex justify-center text-gray-400 text-xs shrink-0">{index + 1}</div>
                    
                    {/* Name */}
                    <div className="w-64 px-2 border-l border-transparent shrink-0">
                        <input 
                            type="text" 
                            value={task.name}
                            onChange={(e) => handleChange(task.id, 'name', e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-800 focus:outline-none focus:border-b focus:border-blue-500 truncate"
                        />
                    </div>

                    {/* Role */}
                    <div className="w-24 px-2 border-l border-gray-100 shrink-0">
                        <input 
                            type="text" 
                            value={task.role || ''} 
                            onChange={(e) => handleChange(task.id, 'role', e.target.value)}
                            className="w-full bg-transparent text-xs text-gray-600 focus:outline-none focus:border-b focus:border-blue-500 truncate placeholder-gray-300"
                            placeholder="-"
                        />
                    </div>

                    {/* Owner */}
                    <div className="w-40 px-2 border-l border-gray-100 shrink-0 flex items-center text-xs text-gray-600">
                        <select
                            value={task.ownerId || ''}
                            onChange={(e) => handleChange(task.id, 'ownerId', e.target.value)}
                            className="bg-transparent outline-none w-full cursor-pointer truncate appearance-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">Unassigned</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        {task.ownerId && (
                            <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">
                                {task.ownerEffort || 100}%
                            </span>
                        )}
                    </div>

                    {/* Team (Members) */}
                    <div className="w-48 px-2 border-l border-gray-100 shrink-0 flex items-center gap-1 overflow-hidden">
                        {task.assignments && task.assignments.length > 0 ? (
                            task.assignments.map((assign, i) => {
                                const m = members.find(mem => mem.id === assign.memberId);
                                if (!m) return null;
                                return (
                                    <div key={i} className="flex items-center bg-gray-100 rounded px-1.5 py-0.5 whitespace-nowrap" title={`${m.name} (${assign.effort}%)`}>
                                        <div className="w-2 h-2 rounded-full mr-1" style={{ background: m.color }}></div>
                                        <span className="text-[10px] text-gray-700 max-w-[60px] truncate">{m.name}</span>
                                        <span className="text-[9px] text-gray-400 ml-1">{assign.effort}%</span>
                                    </div>
                                );
                            })
                        ) : (
                            <span className="text-xs text-gray-300 italic pl-1">No members</span>
                        )}
                    </div>

                    {/* Deliverable */}
                    <div className="w-32 px-2 border-l border-gray-100 shrink-0">
                         <input 
                            type="text" 
                            value={task.deliverable || ''}
                            onChange={(e) => handleChange(task.id, 'deliverable', e.target.value)}
                            className="w-full bg-transparent text-xs text-gray-600 focus:outline-none focus:border-b focus:border-blue-500 truncate placeholder-gray-300"
                            placeholder="-"
                        />
                    </div>

                    {/* Baseline */}
                    <div className="w-24 px-2 border-l border-gray-100 shrink-0 text-center">
                         <input 
                            type="text" 
                            value={task.baselineScore || ''}
                            onChange={(e) => handleChange(task.id, 'baselineScore', e.target.value)}
                            className="w-full bg-transparent text-xs text-center text-gray-600 focus:outline-none focus:border-b focus:border-blue-500 placeholder-gray-300"
                            placeholder="-"
                        />
                    </div>

                    {/* Score */}
                    <div className="w-24 px-2 border-l border-gray-100 shrink-0 text-center">
                         <input 
                            type="text" 
                            value={task.score || ''}
                            onChange={(e) => handleChange(task.id, 'score', e.target.value)}
                            className="w-full bg-transparent text-xs text-center text-gray-600 focus:outline-none focus:border-b focus:border-blue-500 placeholder-gray-300"
                            placeholder="-"
                        />
                    </div>

                    {/* Start */}
                    <div className="w-28 px-2 border-l border-gray-100 shrink-0 flex items-center text-xs text-gray-500">
                         <input 
                            type="date" 
                            value={formatDate(task.start)}
                            onChange={(e) => onDateChange(e, task, 'start')}
                            onClick={showPicker}
                            className={dateInputClass}
                        />
                    </div>

                    {/* End */}
                    <div className="w-28 px-2 border-l border-gray-100 shrink-0 flex items-center text-xs text-gray-500">
                         <input 
                            type="date" 
                            value={formatDate(task.end)}
                            onChange={(e) => onDateChange(e, task, 'end')}
                            onClick={showPicker}
                            className={dateInputClass}
                        />
                    </div>

                     {/* Duration */}
                     <div className="w-16 px-2 border-l border-gray-100 shrink-0 text-center text-xs text-gray-600">
                        {task.duration} d
                    </div>

                    {/* Progress */}
                    <div className="w-16 px-2 border-l border-gray-100 shrink-0 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${task.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {task.progress}%
                        </span>
                    </div>

                    {/* Priority */}
                    <div className="w-24 px-2 border-l border-gray-100 shrink-0 text-center">
                        <select
                            value={task.priority || Priority.Medium}
                            onChange={(e) => handleChange(task.id, 'priority', e.target.value)}
                            className={`w-full text-xs font-medium border-none outline-none bg-transparent cursor-pointer rounded px-1 py-0.5 ${getPriorityColor(task.priority || Priority.Medium)}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value={Priority.High}>High</option>
                            <option value={Priority.Medium}>Medium</option>
                            <option value={Priority.Low}>Low</option>
                        </select>
                    </div>
                </div>
                ))}
                
                {/* Empty Filler */}
                {tasks.length < 15 && Array.from({ length: 15 - tasks.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-w-[1300px] flex items-center border-b border-gray-50" style={{ height: ROW_HEIGHT }}>
                        <div className="w-full bg-gray-50/10 h-full"></div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;