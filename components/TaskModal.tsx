import React, { useState, useEffect } from 'react';
import { Task, Dependency, DependencyType } from '../types';
import { X, Trash2, Link, Calendar, User, FileText, Target, Plus } from 'lucide-react';
import { formatDate } from '../utils';

interface TaskModalProps {
  task: Task;
  allTasks: Task[];
  dependencies: Dependency[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task, newDependencies: Dependency[]) => void;
  onDelete: (taskId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  allTasks, 
  dependencies, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete 
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [taskDeps, setTaskDeps] = useState<Dependency[]>([]);
  const [newDepTargetId, setNewDepTargetId] = useState<string>('');

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      // Filter dependencies where this task is the target (predecessors)
      setTaskDeps(dependencies.filter(d => d.targetId === task.id));
    }
  }, [task, dependencies, isOpen]);

  if (!isOpen || !editedTask) return null;

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
      if (!value) return;
      const date = new Date(value);
      handleChange(field, date);
      
      // Auto-calc duration if both present
      if (editedTask) {
          const otherDate = field === 'start' ? editedTask.end : new Date(value); // simplistic
          // Ideally re-calculate duration here
      }
  };

  const addDependency = () => {
      if (!newDepTargetId) return;
      // Check exists
      if (taskDeps.find(d => d.sourceId === newDepTargetId)) return;
      
      const newDep: Dependency = {
          id: Math.random().toString(36).substr(2, 9),
          sourceId: newDepTargetId,
          targetId: task.id,
          type: DependencyType.FS
      };
      setTaskDeps([...taskDeps, newDep]);
      setNewDepTargetId('');
  };

  const removeDependency = (id: string) => {
      setTaskDeps(prev => prev.filter(d => d.id !== id));
  };

  const handleSave = () => {
      onSave(editedTask, taskDeps);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-slate-800">Task Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Basic Info Group */}
          <div className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Node Name</label>
                <input 
                    type="text" 
                    value={editedTask.name} 
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-medium"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <User size={16} className="text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            value={editedTask.role || ''} 
                            onChange={e => handleChange('role', e.target.value)}
                            className="w-full outline-none text-sm"
                            placeholder="e.g. Project Manager"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Owner</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <User size={16} className="text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            value={editedTask.owner || ''} 
                            onChange={e => handleChange('owner', e.target.value)}
                            className="w-full outline-none text-sm"
                            placeholder="Unassigned"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deliverable</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                    <FileText size={16} className="text-gray-400 mr-2" />
                    <input 
                        type="text" 
                        value={editedTask.deliverable || ''} 
                        onChange={e => handleChange('deliverable', e.target.value)}
                        className="w-full outline-none text-sm"
                        placeholder="Document, Code, Review..."
                    />
                </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Schedule Group */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-700 flex items-center">
                <Calendar size={16} className="mr-2 text-blue-600"/> Schedule
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input 
                        type="date" 
                        value={formatDate(editedTask.start)} 
                        onChange={e => handleDateChange('start', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input 
                        type="date" 
                        value={formatDate(editedTask.end)} 
                        onChange={e => handleDateChange('end', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Progress (%)</label>
                    <input 
                        type="number" 
                        min="0" max="100"
                        value={editedTask.progress} 
                        onChange={e => handleChange('progress', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Baseline Score</label>
                    <input 
                        type="text" 
                        value={editedTask.baselineScore || ''} 
                        onChange={e => handleChange('baselineScore', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Score</label>
                    <input 
                        type="text" 
                        value={editedTask.score || ''} 
                        onChange={e => handleChange('score', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                 </div>
             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Dependencies Group */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center">
                <Link size={16} className="mr-2 text-blue-600"/> Predecessors
            </h3>
            <div className="space-y-2">
                {taskDeps.map(dep => {
                    const source = allTasks.find(t => t.id === dep.sourceId);
                    return (
                        <div key={dep.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                            <span className="flex items-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                {source?.name || 'Unknown Task'} 
                                <span className="text-xs text-gray-400 ml-2">(ID: {dep.sourceId})</span>
                            </span>
                            <button onClick={() => removeDependency(dep.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )
                })}
                {taskDeps.length === 0 && <div className="text-sm text-gray-400 italic">No dependencies</div>}
            </div>

            <div className="flex space-x-2 mt-2">
                <select 
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                    value={newDepTargetId}
                    onChange={e => setNewDepTargetId(e.target.value)}
                >
                    <option value="">Add predecessor...</option>
                    {allTasks
                        .filter(t => t.id !== task.id && !taskDeps.find(d => d.sourceId === t.id))
                        .map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <button 
                    onClick={addDependency}
                    disabled={!newDepTargetId}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                >
                    Add
                </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50 rounded-b-xl">
            <button 
                onClick={() => onDelete(task.id)}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
                <Trash2 size={18} className="mr-2" /> Delete Task
            </button>
            <div className="flex space-x-3">
                <button 
                    onClick={onClose}
                    className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                >
                    Save Changes
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;