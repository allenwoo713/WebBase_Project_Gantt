import React, { useState, useEffect } from 'react';
import { Task, ROW_HEIGHT, Member, Priority, TaskStatus, ProjectSettings } from '../types';
import { Calendar, User, CheckCircle2, Users, Target, Clock, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { formatDate } from '../utils';

interface TaskListProps {
    tasks: Task[];
    members: Member[];
    settings: ProjectSettings;
    onTaskUpdate: (task: Task) => void;
    onTaskClick?: (task: Task) => void;
    onTaskMove?: (taskId: string, direction: 'up' | 'down') => void;
    onBatchDelete?: (taskIds: string[]) => void;
    onError: (msg: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, members, settings, onTaskUpdate, onTaskClick, onTaskMove, onBatchDelete, onError }) => {
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

    // Clear selection if tasks change significantly (optional, but good for safety)
    useEffect(() => {
        setSelectedTaskIds(new Set());
    }, [tasks.length]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTaskIds(new Set(tasks.map(t => t.id)));
        } else {
            setSelectedTaskIds(new Set());
        }
    };

    const handleSelect = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedTaskIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedTaskIds(newSelected);
    };

    const handleDeleteSelected = () => {
        if (onBatchDelete && selectedTaskIds.size > 0) {
            if (confirm(`Are you sure you want to delete ${selectedTaskIds.size} tasks?`)) {
                onBatchDelete(Array.from(selectedTaskIds));
                setSelectedTaskIds(new Set());
            }
        }
    };

    const handleChange = (id: string, field: keyof Task, value: any) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const updates: Partial<Task> = { [field]: value };

            // Sync Role if Owner changes
            if (field === 'ownerId') {
                const member = members.find(m => m.id === value);
                if (member) {
                    updates.role = member.role;
                }
            }

            onTaskUpdate({ ...task, ...updates });
        }
    };

    // Helper to handle date changes safely without UTC shifts
    const onDateChange = (e: React.ChangeEvent<HTMLInputElement>, task: Task, field: 'start' | 'end') => {
        if (!e.target.value) return;

        const [y, m, d] = e.target.value.split('-').map(Number);
        const newDate = new Date(y, m - 1, d);

        if (field === 'start') {
            if (newDate.getTime() > task.end.getTime()) {
                onError("Start date cannot be later than end date.");
                return;
            }
            const duration = task.end.getTime() - task.start.getTime();
            const newEnd = new Date(newDate.getTime() + duration);
            onTaskUpdate({ ...task, start: newDate, end: newEnd });
        } else {
            if (newDate.getTime() < task.start.getTime()) {
                onError("End date cannot be earlier than start date.");
                return;
            }
            onTaskUpdate({ ...task, end: newDate });
        }
    };

    const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
        let newProgress = task.progress;
        if (newStatus === TaskStatus.NotStarted) {
            newProgress = 0;
        } else if (newStatus === TaskStatus.Done) {
            newProgress = 100;
        } else if (newStatus === TaskStatus.Ongoing) {
            if (newProgress === 0) newProgress = 1;
            if (newProgress === 100) newProgress = 99;
        }
        onTaskUpdate({ ...task, status: newStatus, progress: newProgress });
    };

    const handleProgressChange = (task: Task, val: number) => {
        let newStatus = task.status;
        if (val === 0) {
            newStatus = TaskStatus.NotStarted;
        } else if (val === 100) {
            newStatus = TaskStatus.Done;
        } else {
            newStatus = TaskStatus.Ongoing;
        }
        onTaskUpdate({ ...task, progress: val, status: newStatus });
    };

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case Priority.High: return 'text-orange-600 bg-orange-50';
            case Priority.Medium: return 'text-blue-600 bg-blue-50';
            case Priority.Low: return 'text-green-600 bg-green-50';
            default: return 'text-gray-600';
        }
    };

    const getStatusColor = (s: TaskStatus) => {
        switch (s) {
            case TaskStatus.NotStarted: return 'text-gray-500 bg-gray-100';
            case TaskStatus.Ongoing: return 'text-blue-600 bg-blue-50';
            case TaskStatus.Done: return 'text-green-600 bg-green-50';
            default: return 'text-gray-600';
        }
    };

    const calculateHours = (task: Task) => {
        const workingHours = settings?.workingDayHours || 8;
        const ownerEffort = task.ownerEffort || 100;
        let totalEffort = ownerEffort;
        if (task.assignments) {
            totalEffort += task.assignments.reduce((acc, curr) => acc + curr.effort, 0);
        }
        // Effort is percentage, so divide by 100
        // Formula: (Total Effort / 100) * Duration * WorkingHours
        const hours = (totalEffort / 100) * task.duration * workingHours;
        return Math.round(hours * 10) / 10; // Round to 1 decimal
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

    const dateInputClass = "w-full bg-transparent focus:outline-none text-[11px] cursor-pointer [color-scheme:light]";

    return (
        <div className="flex flex-col h-full border-r border-gray-200 bg-white select-none w-full overflow-hidden">
            {/* Header - Scrollable Container */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[1500px]">

                    {/* Header Row */}
                    <div className="flex items-center bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-500 sticky top-0 z-10" style={{ height: 50 }}>
                        <div className="w-10 flex justify-center shrink-0">
                            <input
                                type="checkbox"
                                checked={tasks.length > 0 && selectedTaskIds.size === tasks.length}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                        <div className="w-16 flex justify-center shrink-0">
                            {selectedTaskIds.size > 0 ? (
                                <button onClick={handleDeleteSelected} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Delete Selected">
                                    <Trash2 size={14} />
                                </button>
                            ) : (
                                <span>#</span>
                            )}
                        </div>
                        <div className="w-64 px-2 border-l border-gray-100 shrink-0">Task Name</div>
                        <div className="w-24 px-2 border-l border-gray-100 shrink-0">Status</div>
                        <div className="w-24 px-2 border-l border-gray-100 shrink-0">Role</div>
                        <div className="w-40 px-2 border-l border-gray-100 shrink-0">Owner (Effort)</div>
                        <div className="w-48 px-2 border-l border-gray-100 shrink-0">Team (Effort)</div>
                        <div className="w-20 px-2 border-l border-gray-100 shrink-0">Hours</div>
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
                                className={`flex items-center border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer group ${selectedTaskIds.has(task.id) ? 'bg-blue-50/50' : 'bg-white'}`}
                                style={{ height: ROW_HEIGHT }}
                                onDoubleClick={() => onTaskClick && onTaskClick(task)}
                            >
                                {/* Checkbox */}
                                <div className="w-10 flex justify-center items-center shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={selectedTaskIds.has(task.id)}
                                        onChange={(e) => handleSelect(task.id, e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Index / Move Controls */}
                                <div className="w-16 flex justify-center items-center text-gray-400 text-xs shrink-0 relative">
                                    <span className="group-hover:hidden">{index + 1}</span>
                                    <div className="hidden group-hover:flex items-center space-x-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onTaskMove?.(task.id, 'up'); }}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent text-gray-600"
                                        >
                                            <ArrowUp size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onTaskMove?.(task.id, 'down'); }}
                                            disabled={index === tasks.length - 1}
                                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent text-gray-600"
                                        >
                                            <ArrowDown size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="w-64 px-2 border-l border-transparent shrink-0">
                                    <input
                                        type="text"
                                        value={task.name}
                                        onChange={(e) => handleChange(task.id, 'name', e.target.value)}
                                        className="w-full bg-transparent text-sm text-gray-800 focus:outline-none focus:border-b focus:border-blue-500 truncate"
                                    />
                                </div>

                                {/* Status */}
                                <div className="w-24 px-2 border-l border-gray-100 shrink-0">
                                    <select
                                        value={task.status || TaskStatus.NotStarted}
                                        onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                                        className={`w-full text-xs font-medium border-none outline-none bg-transparent cursor-pointer rounded px-1 py-0.5 ${getStatusColor(task.status || TaskStatus.NotStarted)}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value={TaskStatus.NotStarted}>Not Started</option>
                                        <option value={TaskStatus.Ongoing}>Ongoing</option>
                                        <option value={TaskStatus.Done}>Done</option>
                                    </select>
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

                                {/* Hours */}
                                <div className="w-20 px-2 border-l border-gray-100 shrink-0 text-center text-xs text-gray-700 font-medium">
                                    {calculateHours(task)} h
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
                                    <input
                                        type="number" min="0" max="100"
                                        value={task.progress}
                                        onChange={(e) => handleProgressChange(task, parseInt(e.target.value))}
                                        className="w-full bg-transparent text-xs text-center text-gray-600 focus:outline-none focus:border-b focus:border-blue-500"
                                    />
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
                            <div key={`empty-${i}`} className="min-w-[1500px] flex items-center border-b border-gray-50" style={{ height: ROW_HEIGHT }}>
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