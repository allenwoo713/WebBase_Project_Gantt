import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Dependency, DependencyType, Member, TaskAssignment, ProjectSettings, Priority, TaskStatus } from '../types';
import { X, Trash2, Link, Calendar, Users, Target, AlignLeft, AlertCircle, Search, CheckSquare, Square, ChevronDown, Activity } from 'lucide-react';
import { formatDate, diffProjectDays } from '../utils';

interface TaskModalProps {
    task: Task;
    allTasks: Task[];
    members: Member[];
    dependencies: Dependency[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task, newDependencies: Dependency[]) => void;
    onDelete: (taskId: string) => void;
    settings: ProjectSettings;
    onError: (msg: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
    task,
    allTasks,
    members,
    dependencies,
    isOpen,
    onClose,
    onSave,
    onDelete,
    settings,
    onError
}) => {
    const [editedTask, setEditedTask] = useState<Task | null>(null);
    const [taskDeps, setTaskDeps] = useState<Dependency[]>([]);

    // Dependency UI State
    const [depSearch, setDepSearch] = useState('');
    const [selectedDepIds, setSelectedDepIds] = useState<Set<string>>(new Set());
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);
    const [deleteDepConfirmId, setDeleteDepConfirmId] = useState<string | null>(null);

    const [newMemberId, setNewMemberId] = useState<string>('');
    const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

    // Filter available tasks for dependencies
    const availableTasks = useMemo(() => {
        if (!task) return [];
        const term = depSearch.trim().toLowerCase();
        return allTasks.filter(t =>
            t.id !== task.id &&
            !taskDeps.some(d => d.sourceId === t.id) &&
            (term === '' || t.name.toLowerCase().includes(term))
        );
    }, [allTasks, task, taskDeps, depSearch]);

    useEffect(() => {
        if (isOpen && task) {
            // Always update when opening or task changes
            setEditedTask({
                ...task,
                priority: task.priority || Priority.Medium,
                status: task.status || TaskStatus.NotStarted,
                ownerEffort: task.ownerEffort ?? 100,
                assignments: task.assignments || []
            });
            setTaskDeps(dependencies.filter(d => d.targetId === task.id));

            setIsDeleteConfirming(false);
            setSelectedDepIds(new Set());
            setDepSearch('');
            setIsSearchFocused(false);
            setDeleteDepConfirmId(null);
        }
    }, [task, isOpen, dependencies]);

    // Handle click outside to close search dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen || !editedTask) return null;

    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask(prev => {
            if (!prev) return null;

            const updates: Partial<Task> = { [field]: value };

            // Sync Role if Owner changes
            if (field === 'ownerId') {
                const member = members.find(m => m.id === value);
                if (member) {
                    updates.role = member.role;
                }
            }

            return { ...prev, ...updates };
        });
    };

    // Logic for Status <-> Progress Synchronization
    const handleStatusChange = (newStatus: TaskStatus) => {
        setEditedTask(prev => {
            if (!prev) return null;
            let newProgress = prev.progress;

            if (newStatus === TaskStatus.NotStarted) {
                newProgress = 0;
            } else if (newStatus === TaskStatus.Done) {
                newProgress = 100;
            } else if (newStatus === TaskStatus.Ongoing) {
                // If moving to ongoing, ensure progress is between 1 and 99
                if (newProgress === 0) newProgress = 1;
                if (newProgress === 100) newProgress = 99;
            }

            return { ...prev, status: newStatus, progress: newProgress };
        });
    };

    const handleProgressChange = (val: number) => {
        setEditedTask(prev => {
            if (!prev) return null;
            let newStatus = prev.status;

            if (val === 0) {
                newStatus = TaskStatus.NotStarted;
            } else if (val === 100) {
                newStatus = TaskStatus.Done;
            } else {
                newStatus = TaskStatus.Ongoing;
            }

            return { ...prev, progress: val, status: newStatus };
        });
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        if (!value) return;

        const [y, m, d] = value.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        setEditedTask(prev => {
            if (!prev) return null;

            let start = prev.start;
            let end = prev.end;

            if (field === 'start') {
                start = date;
            } else {
                end = date;
            }

            if (end.getTime() < start.getTime()) {
                onError(field === 'start' ? "Start date cannot be later than end date." : "End date cannot be earlier than start date.");
                return prev;
            }

            const updates: any = { [field]: date };
            updates.duration = diffProjectDays(start, end, settings);

            return { ...prev, ...updates };
        });
    };

    const handleActualDateChange = (field: 'actualStart' | 'actualEnd', value: string) => {
        if (!value) {
            setEditedTask(prev => prev ? { ...prev, [field]: undefined } : null);
            return;
        }

        const [y, m, d] = value.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        setEditedTask(prev => prev ? { ...prev, [field]: date } : null);
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

    // --- Dependency Logic ---

    const toggleDepSelection = (id: string) => {
        const newSet = new Set(selectedDepIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedDepIds(newSet);
    };

    const addSelectedDependencies = () => {
        const newDeps: Dependency[] = [];
        selectedDepIds.forEach(sourceId => {
            if (!taskDeps.find(d => d.sourceId === sourceId)) {
                newDeps.push({
                    id: Math.random().toString(36).substr(2, 9),
                    sourceId: sourceId,
                    targetId: task.id,
                    type: DependencyType.FS
                });
            }
        });
        setTaskDeps([...taskDeps, ...newDeps]);
        setSelectedDepIds(new Set());
        setDepSearch('');
        setIsSearchFocused(false);
    };

    const removeDependency = (id: string) => {
        setTaskDeps(prev => prev.filter(d => d.id !== id));
        setDeleteDepConfirmId(null);
    };

    const updateDependencyType = (id: string, type: DependencyType) => {
        setTaskDeps(prev => prev.map(d => d.id === id ? { ...d, type } : d));
    };

    // --- Member Assignment Logic ---

    const addAssignment = () => {
        if (!newMemberId) return;
        if (editedTask.assignments?.find(a => a.memberId === newMemberId)) return;
        if (editedTask.ownerId === newMemberId) {
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

    const assignableMembers = members.filter(m => m.id !== editedTask.ownerId && !editedTask.assignments?.some(a => a.memberId === m.id));

    const inputBaseClass = "w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400";
    const dateInputClass = `${inputBaseClass} [color-scheme:light] cursor-pointer`;

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
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task Name</label>
                                <input
                                    type="text"
                                    value={editedTask.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className={`${inputBaseClass} text-lg font-semibold`}
                                    placeholder="Enter task name"
                                />
                            </div>
                            <div className="w-32 shrink-0">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Progress</label>
                                <div className="flex items-center relative">
                                    <input
                                        type="number" min="0" max="100"
                                        value={editedTask.progress}
                                        onChange={e => handleProgressChange(parseInt(e.target.value))}
                                        className={`${inputBaseClass} text-right pr-8`}
                                    />
                                    <span className="absolute right-3 text-gray-500 pointer-events-none">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    <AlertCircle size={14} className="mr-1" /> Priority
                                </label>
                                <select
                                    value={editedTask.priority}
                                    onChange={e => handleChange('priority', e.target.value)}
                                    className={inputBaseClass}
                                >
                                    <option value={Priority.High}>High</option>
                                    <option value={Priority.Medium}>Medium</option>
                                    <option value={Priority.Low}>Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    <Activity size={14} className="mr-1" /> Status
                                </label>
                                <select
                                    value={editedTask.status}
                                    onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                                    className={inputBaseClass}
                                >
                                    <option value={TaskStatus.NotStarted}>Not Started</option>
                                    <option value={TaskStatus.Ongoing}>Ongoing</option>
                                    <option value={TaskStatus.Done}>Done</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                <input
                                    type="text"
                                    value={editedTask.role || ''}
                                    onChange={e => handleChange('role', e.target.value)}
                                    className={inputBaseClass}
                                    placeholder="e.g. Front-end Dev"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deliverable</label>
                                <input
                                    type="text"
                                    value={editedTask.deliverable || ''}
                                    onChange={e => handleChange('deliverable', e.target.value)}
                                    className={inputBaseClass}
                                    placeholder="e.g. API Spec"
                                />
                            </div>
                        </div>

                        {/* Description Field */}
                        <div className="w-full">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                <AlignLeft size={14} className="mr-1" /> Description
                            </label>
                            <textarea
                                value={editedTask.description || ''}
                                onChange={e => handleChange('description', e.target.value)}
                                className={`${inputBaseClass} min-h-[80px] resize-y text-sm`}
                                placeholder="Add detailed notes here..."
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Section 2: People & Effort */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                            <Users size={16} className="mr-2 text-blue-600" /> Team & Effort
                        </h3>

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">

                            {/* Owner */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm">Own</div>
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-gray-500 block mb-0.5">Owner</label>
                                        <select
                                            value={editedTask.ownerId || ''}
                                            onChange={e => handleChange('ownerId', e.target.value)}
                                            className="bg-transparent font-medium text-gray-800 outline-none w-full cursor-pointer hover:text-blue-600 transition-colors"
                                        >
                                            <option value="">Unassigned</option>
                                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Daily Effort %</label>
                                    <input
                                        type="number" min="0" max="100"
                                        value={editedTask.ownerEffort}
                                        onChange={e => handleChange('ownerEffort', parseInt(e.target.value))}
                                        className="w-full p-1.5 border border-gray-300 rounded-md text-center text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-gray-200 w-full"></div>

                            {/* Team Members */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 block">Additional Members</label>
                                {editedTask.assignments?.map(assign => {
                                    const m = members.find(mem => mem.id === assign.memberId);
                                    if (!m) return null;
                                    return (
                                        <div key={assign.memberId} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: m.color }}>
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
                                                        className="w-16 p-1 border border-gray-300 rounded text-center text-sm bg-white text-gray-900 focus:border-blue-500 outline-none"
                                                    />
                                                    <span className="text-xs text-gray-500 ml-1">%</span>
                                                </div>
                                                <button onClick={() => removeAssignment(assign.memberId)} className="text-gray-400 hover:text-red-500 p-1">
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
                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">+ Add team member...</option>
                                        {assignableMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                    <button
                                        onClick={addAssignment}
                                        disabled={!newMemberId}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
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
                                <Calendar size={16} className="mr-2 text-blue-600" /> Schedule
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        value={formatDate(editedTask.start)}
                                        onChange={e => handleDateChange('start', e.target.value)}
                                        onClick={showPicker}
                                        className={dateInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">End Date</label>
                                    <input
                                        type="date"
                                        value={formatDate(editedTask.end)}
                                        onChange={e => handleDateChange('end', e.target.value)}
                                        onClick={showPicker}
                                        className={dateInputClass}
                                    />
                                </div>
                                <div className="pt-1 text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                                    Duration: <span className="font-bold text-blue-800">{editedTask.duration} days</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Actual Start</label>
                                        <input
                                            type="date"
                                            value={formatDate(editedTask.actualStart || new Date(NaN))}
                                            onChange={e => handleActualDateChange('actualStart', e.target.value)}
                                            onClick={showPicker}
                                            className={dateInputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Actual End</label>
                                        <input
                                            type="date"
                                            value={formatDate(editedTask.actualEnd || new Date(NaN))}
                                            onChange={e => handleActualDateChange('actualEnd', e.target.value)}
                                            onClick={showPicker}
                                            className={dateInputClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scores */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                                <Target size={16} className="mr-2 text-blue-600" /> Metrics
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Baseline Score</label>
                                    <input type="text" value={editedTask.baselineScore || ''} onChange={e => handleChange('baselineScore', e.target.value)} className={inputBaseClass} placeholder="-" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Actual Score</label>
                                    <input type="text" value={editedTask.score || ''} onChange={e => handleChange('score', e.target.value)} className={inputBaseClass} placeholder="-" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Section 4: Dependencies */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                            <Link size={16} className="mr-2 text-blue-600" /> Predecessors
                        </h3>
                        <div className="space-y-3">

                            {/* Dependency List */}
                            {taskDeps.length === 0 && <p className="text-sm text-gray-400 italic">No dependencies linked.</p>}
                            {taskDeps.map(dep => {
                                const source = allTasks.find(t => t.id === dep.sourceId);
                                return (
                                    <div key={dep.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 transition-colors">
                                        <span className="flex items-center font-medium text-gray-700 flex-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                            {source?.name || 'Unknown Task'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={dep.type}
                                                onChange={e => updateDependencyType(dep.id, e.target.value as DependencyType)}
                                                className="bg-white border border-gray-300 text-xs rounded px-1 py-0.5 outline-none cursor-pointer text-gray-700 font-medium"
                                            >
                                                <option value={DependencyType.FS}>FS</option>
                                                <option value={DependencyType.SS}>SS</option>
                                                <option value={DependencyType.FF}>FF</option>
                                                <option value={DependencyType.SF}>SF</option>
                                            </select>
                                            {deleteDepConfirmId === dep.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => removeDependency(dep.id)}
                                                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 shadow-sm"
                                                    >
                                                        Sure?
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteDepConfirmId(null)}
                                                        className="text-gray-400 hover:bg-gray-200 p-1 rounded"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteDepConfirmId(dep.id)}
                                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Add Dependency Controls */}
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mt-2" ref={searchWrapperRef}>
                                <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1.5 relative">
                                    <Search size={14} className="text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Select tasks to link..."
                                        value={depSearch}
                                        onChange={e => { setDepSearch(e.target.value); setIsSearchFocused(true); }}
                                        onFocus={() => setIsSearchFocused(true)}
                                        className="w-full text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                                    />
                                    <ChevronDown size={14} className="text-gray-400 ml-2" />
                                </div>

                                {/* Dropdown List */}
                                {isSearchFocused && (
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded bg-white mt-2 shadow-sm">
                                        {availableTasks.length === 0 ? (
                                            <div className="p-3 text-xs text-gray-400 text-center italic">
                                                {depSearch ? "No matching tasks found" : "No other tasks available"}
                                            </div>
                                        ) : (
                                            availableTasks.map(t => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => toggleDepSelection(t.id)}
                                                    className={`flex items-center p-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${selectedDepIds.has(t.id) ? 'bg-blue-50' : ''}`}
                                                >
                                                    <div className={`mr-2 ${selectedDepIds.has(t.id) ? 'text-blue-600' : 'text-gray-300'}`}>
                                                        {selectedDepIds.has(t.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                                    </div>
                                                    <span className="text-gray-700 truncate">{t.name}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={addSelectedDependencies}
                                    disabled={selectedDepIds.size === 0}
                                    className="w-full py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors mt-2"
                                >
                                    Add Selected ({selectedDepIds.size})
                                </button>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50 rounded-b-xl">
                    {isDeleteConfirming ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 font-medium">Are you sure?</span>
                            <button
                                onClick={() => onDelete(task.id)}
                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 font-medium transition-colors"
                            >
                                Yes, delete
                            </button>
                            <button
                                onClick={() => setIsDeleteConfirming(false)}
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsDeleteConfirming(true)}
                            className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                        >
                            <Trash2 size={18} className="mr-2" /> Delete
                        </button>
                    )}
                    <div className="flex space-x-3">
                        <button onClick={onClose} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all transform active:scale-95">Save Changes</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaskModal;