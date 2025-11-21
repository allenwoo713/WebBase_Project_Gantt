import React from 'react';
import { Task, ROW_HEIGHT } from '../types';
import { Calendar, User, CheckCircle2 } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate }) => {
  
  const handleChange = (id: string, field: keyof Task, value: any) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        onTaskUpdate({ ...task, [field]: value });
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white select-none">
      {/* Header */}
      <div className="flex items-center bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-500 h-[50px]">
        <div className="w-10 flex justify-center">#</div>
        <div className="flex-1 px-2 border-l border-gray-100">Task Name</div>
        <div className="w-24 px-2 border-l border-gray-100 hidden md:block">Owner</div>
        <div className="w-24 px-2 border-l border-gray-100 hidden lg:block">Start</div>
        <div className="w-16 px-2 border-l border-gray-100 hidden xl:block">%</div>
      </div>

      {/* Rows */}
      <div className="overflow-auto flex-1">
        {tasks.map((task, index) => (
          <div 
            key={task.id} 
            className="flex items-center border-b border-gray-100 hover:bg-blue-50 transition-colors"
            style={{ height: ROW_HEIGHT }}
          >
            <div className="w-10 flex justify-center text-gray-400 text-xs">{index + 1}</div>
            
            {/* Name Input */}
            <div className="flex-1 px-2 border-l border-transparent">
               <input 
                 type="text" 
                 value={task.name}
                 onChange={(e) => handleChange(task.id, 'name', e.target.value)}
                 className="w-full bg-transparent text-sm text-gray-800 focus:outline-none focus:border-b focus:border-blue-500"
               />
            </div>

            {/* Owner */}
            <div className="w-24 px-2 border-l border-gray-100 hidden md:flex items-center text-xs text-gray-600">
                <User size={12} className="mr-1 opacity-50"/>
                <span className="truncate">{task.owner || 'Unassigned'}</span>
            </div>

            {/* Start Date (Read-only usually, editable via calendar ideally) */}
            <div className="w-24 px-2 border-l border-gray-100 hidden lg:flex items-center text-xs text-gray-500">
                <Calendar size={12} className="mr-1 opacity-50" />
                {task.start.toLocaleDateString()}
            </div>

            {/* Progress */}
            <div className="w-16 px-2 border-l border-gray-100 hidden xl:block text-xs text-center">
                <span className={`px-2 py-0.5 rounded-full ${task.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {task.progress}%
                </span>
            </div>
          </div>
        ))}
        
        {/* Empty state placeholder rows to fill space */}
        {tasks.length < 10 && Array.from({ length: 10 - tasks.length }).map((_, i) => (
             <div key={`empty-${i}`} className="flex items-center border-b border-gray-50" style={{ height: ROW_HEIGHT }}>
                <div className="w-full bg-gray-50/30 h-full"></div>
             </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;