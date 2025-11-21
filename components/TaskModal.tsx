
import React, { useState, useEffect } from 'react';
import { Task, Dependency, DependencyType, Member, TaskAssignment } from '../types';
import { X, Trash2, Link, Calendar, User, FileText, Target, Plus, Users } from 'lucide-react';
import { formatDate } from '../utils';

interface TaskModalProps {
  task: Task;
  allTasks: Task[];
  members: Member[];
  dependencies: Dependency[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task, newDependencies: Dependency[]) => void;
  onDelete: (taskId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  allTasks, 
  members,
  dependencies, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete 
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [taskDeps, setTaskDeps] = useState<Dependency[]>([]);
  const [newDepTargetId, setNewDepTargetId] = useState<string>('');
  const [newMemberId, setNewMemberId] = useState<string>('');

  useEffect(() => {
    if (task) {
      setEditedTask({ 
          ...task, 
          ownerEffort: task.ownerEffort ?? 100,
          assignments: task.assignments || []
      });
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
  };

  // Dependency Logic
  const addDependency = () => {
      if (!newDepTargetId) return;
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

  // Member Assignment Logic
  const addAssignment = () => {
      if(!newMemberId) return;
      if(editedTask.assignments?.find(a => a.memberId === newMemberId)) return;
      if(editedTask.ownerId === newMemberId) {
          alert("User is already the Owner");
          return;
      }

      const newAssign: TaskAssignment = { memberId: newMemberId, effort: 100 };
      setEditedTask(prev => ({
          ...prev!,
          assignments: [...(prev!.assignments || []), newAssign]
      }));
      setNewMemberId('');
  };

  const removeAssignment = (memberId: string) => {
    setEditedTask(prev => ({
        ...prev!,
        assignments: prev!.assignments?.filter(a => a.memberId !== memberId)
    }));
  };

  const updateAssignmentEffort = (memberId: string, effort: number) => {
    setEditedTask(prev => ({
        ...prev!,
        assignments: prev!.assignments?.map(a => a.memberId === memberId ? { ...a, effort } : a)
    }));
  };

  const handleSave = () => {
      onSave(editedTask, taskDeps);
      onClose();
  };

  const availableMembers = members.filter(m => m.id !== editedTask.ownerId && !editedTask.assignments?.some(a => a.memberId === m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-slate-800">Task Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Identification */}
          <div className="space-y-4">
             <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Task Name</label>
                    <input 
                        type="text" 
                        value={editedTask.name} 
                        onChange={e => handleChange('name', e.target.value)}
                        className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-600 outline-none text-xl font-bold text-gray-800"
                    />
                </div>
                <div className="w-32">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Progress</label>
                    <div className="flex items-center">
                        <input 
                            type="number" min="0" max="100"
                            value={editedTask.progress}
                            onChange={e => handleChange('progress', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-lg text-right font-medium"
                        />
                        <span className="ml-2 text-gray-500">%</span>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                    <input type="text" value={editedTask.role || ''} onChange={e=>handleChange('role', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Front-end Dev"/>
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deliverable</label>
                    <input type="text" value={editedTask.deliverable || ''} onChange={e=>handleChange('deliverable', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. API Spec"/>
                 </div>
             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: People & Effort */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                <Users size={16} className="mr-2 text-blue-600"/> Team & Effort
             </h3>
             
             <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
                 
                 {/* Owner */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">Own</div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block">Owner</label>
                            <select 
                                value={editedTask.ownerId || ''} 
                                onChange={e => handleChange('ownerId', e.target.value)}
                                className="bg-transparent font-medium text-gray-800 outline-none w-full"
                            >
                                <option value="">Unassigned</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="w-32">
                         <label className="text-xs text-gray-500 block mb-1">Daily Effort %</label>
                         <input 
                            type="number" min="0" max="100" 
                            value={editedTask.ownerEffort} 
                            onChange={e => handleChange('ownerEffort', parseInt(e.target.value))}
                            className="w-full p-1 border rounded text-center text-sm"
                        />
                    </div>
                 </div>
                 
                 <div className="h-px bg-gray-200 w-full"></div>

                 {/* Team Members */}
                 <div className="space-y-3">
                     <label className="text-xs text-gray-500 block">Additional Members</label>
                     {editedTask.assignments?.map(assign => {
                         const m = members.find(mem => mem.id === assign.memberId);
                         if(!m) return null;
                         return (
                             <div key={assign.memberId} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                 <div className="flex items-center gap-3 flex-1">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{background: m.color}}>
                                        {m.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{m.name}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <div className="flex items-center">
                                        <span className="text-xs text-gray-400 mr-2">Effort:</span>
                                        <input 
                                            type="number" min="0" max="100"
                                            value={assign.effort}
                                            onChange={e => updateAssignmentEffort(assign.memberId, parseInt(e.target.value))}
                                            className="w-16 p-1 border rounded text-center text-sm"
                                        />
                                        <span className="text-xs text-gray-500 ml-1">%</span>
                                     </div>
                                     <button onClick={() => removeAssignment(assign.memberId)} className="text-gray-400 hover:text-red-500">
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             </div>
                         )
                     })}
                     
                     {/* Add Member Row */}
                     <div className="flex items-center gap-2 pt-2">
                         <select 
                            value={newMemberId}
                            onChange={e => setNewMemberId(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm bg-white"
                         >
                             <option value="">+ Add team member...</option>
                             {availableMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                         </select>
                         <button 
                            onClick={addAssignment}
                            disabled={!newMemberId}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                         >
                             Add
                         </button>
                     </div>
                 </div>

             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Schedule & Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Schedule */}
             <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                    <Calendar size={16} className="mr-2 text-blue-600"/> Schedule
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                        <input type="date" value={formatDate(editedTask.start)} onChange={e => handleDateChange('start', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                        <input type="date" value={formatDate(editedTask.end)} onChange={e => handleDateChange('end', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="pt-2 text-sm text-gray-600">
                        Duration: <span className="font-bold">{editedTask.duration} days</span>
                    </div>
                </div>
             </div>

             {/* Scores */}
             <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                    <Target size={16} className="mr-2 text-blue-600"/> Metrics
                </h3>
                 <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Baseline Score</label>
                        <input type="text" value={editedTask.baselineScore || ''} onChange={e => handleChange('baselineScore', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="-" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Actual Score</label>
                        <input type="text" value={editedTask.score || ''} onChange={e => handleChange('score', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="-" />
                    </div>
                </div>
             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 4: Dependencies */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                <Link size={16} className="mr-2 text-blue-600"/> Predecessors
            </h3>
            <div className="space-y-2">
                {taskDeps.map(dep => {
                    const source = allTasks.find(t => t.id === dep.sourceId);
                    return (
                        <div key={dep.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                            <span className="flex items-center font-medium text-gray-700">
                                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                {source?.name || 'Unknown Task'}
                            </span>
                            <button onClick={() => removeDependency(dep.id)} className="text-gray-400 hover:text-red-500 p-1 rounded">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )
                })}
                
                <div className="flex space-x-2 mt-2">
                    <select 
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                        value={newDepTargetId}
                        onChange={e => setNewDepTargetId(e.target.value)}
                    >
                        <option value="">Select task to link...</option>
                        {allTasks
                            .filter(t => t.id !== task.id && !taskDeps.find(d => d.sourceId === t.id))
                            .map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={addDependency}
                        disabled={!newDepTargetId}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                        Link
                    </button>
                </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50 rounded-b-xl">
            <button 
                onClick={() => onDelete(task.id)}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
                <Trash2 size={18} className="mr-2" /> Delete
            </button>
            <div className="flex space-x-3">
                <button onClick={onClose} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;
