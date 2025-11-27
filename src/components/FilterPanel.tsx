import React, { useState, useEffect, useRef } from 'react';
import { FilterState, Member, Priority, TaskStatus } from '../types';
import { X, Filter, Check, Search, ChevronDown, CheckSquare, Square } from 'lucide-react';

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
    filter: FilterState;
    onFilterChange: (newFilter: FilterState) => void;
    onClearFilters: () => void;
}

// Reusable Multi-Select Dropdown with Search & Select All
const MultiSelectDropdown = ({
    label,
    options,
    selectedValues,
    onToggle,
    onSelectAll,
    onClearSelection,
    placeholder
}: {
    label: string,
    options: { id: string, label: string }[],
    selectedValues: string[],
    onToggle: (id: string) => void,
    onSelectAll: (ids: string[]) => void,
    onClearSelection: (ids: string[]) => void,
    placeholder: string
}) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    // Check if all currently filtered options are selected
    const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedValues.includes(opt.id));

    const handleToggleAll = () => {
        const visibleIds = filteredOptions.map(o => o.id);
        if (allFilteredSelected) {
            onClearSelection(visibleIds);
        } else {
            onSelectAll(visibleIds);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{label}</label>
            <div
                className="flex items-center justify-between w-full p-2 border border-gray-300 rounded bg-white cursor-pointer text-sm text-gray-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">
                    {selectedValues.length === 0
                        ? placeholder
                        : `${selectedValues.length} selected`}
                </span>
                <ChevronDown size={14} className="text-gray-400 ml-2" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 space-y-2">
                        <div className="flex items-center bg-white px-2 py-1.5 rounded border border-gray-200">
                            <Search size={12} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-transparent text-xs outline-none text-gray-700"
                                placeholder="Search..."
                                autoFocus
                            />
                        </div>
                        {/* Select All / Clear Shortcut */}
                        <div
                            onClick={handleToggleAll}
                            className="text-xs text-blue-600 font-medium cursor-pointer hover:text-blue-800 select-none flex items-center"
                        >
                            <div className="mr-2 text-blue-600">
                                {allFilteredSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                            </div>
                            {allFilteredSelected ? 'Unselect All Visible' : 'Select All Visible'}
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length === 0 && <div className="p-3 text-xs text-gray-400 text-center">No matches</div>}
                        {filteredOptions.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => onToggle(opt.id)}
                                className={`flex items-center px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 border-b border-gray-50 last:border-0 ${selectedValues.includes(opt.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                            >
                                <div className={`mr-2 ${selectedValues.includes(opt.id) ? 'text-blue-600' : 'text-gray-300'}`}>
                                    {selectedValues.includes(opt.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                                </div>
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const FilterPanel: React.FC<FilterPanelProps> = ({
    isOpen,
    onClose,
    members,
    filter,
    onFilterChange,
    onClearFilters
}) => {
    if (!isOpen) return null;

    const toggleStatus = (status: TaskStatus) => {
        const newStatuses = filter.statuses.includes(status)
            ? filter.statuses.filter(s => s !== status)
            : [...filter.statuses, status];
        onFilterChange({ ...filter, statuses: newStatuses });
    };

    const togglePriority = (priority: Priority) => {
        const newPriorities = filter.priorities.includes(priority)
            ? filter.priorities.filter(p => p !== priority)
            : [...filter.priorities, priority];
        onFilterChange({ ...filter, priorities: newPriorities });
    };

    // -- Owner Handlers --
    const toggleOwner = (id: string) => {
        const newOwners = filter.ownerIds.includes(id)
            ? filter.ownerIds.filter(o => o !== id)
            : [...filter.ownerIds, id];
        onFilterChange({ ...filter, ownerIds: newOwners });
    };
    const selectAllOwners = (ids: string[]) => {
        const combined = Array.from(new Set([...filter.ownerIds, ...ids]));
        onFilterChange({ ...filter, ownerIds: combined });
    };
    const clearOwners = (ids: string[]) => {
        const remaining = filter.ownerIds.filter(id => !ids.includes(id));
        onFilterChange({ ...filter, ownerIds: remaining });
    };

    // -- Role Handlers --
    const toggleRole = (role: string) => {
        const newRoles = filter.roles.includes(role)
            ? filter.roles.filter(r => r !== role)
            : [...filter.roles, role];
        onFilterChange({ ...filter, roles: newRoles });
    };
    const selectAllRoles = (ids: string[]) => {
        const combined = Array.from(new Set([...filter.roles, ...ids]));
        onFilterChange({ ...filter, roles: combined });
    };
    const clearRoles = (ids: string[]) => {
        const remaining = filter.roles.filter(id => !ids.includes(id));
        onFilterChange({ ...filter, roles: remaining });
    };

    // Prepare Options for Dropdowns
    const ownerOptions = [
        { id: 'unassigned', label: 'Unassigned' },
        ...members.map(m => ({ id: m.id, label: m.name }))
    ];

    const uniqueRoles = Array.from(new Set<string>(members.map(m => m.role).filter((r): r is string => !!r))).map(r => ({ id: r, label: r }));

    const badgeClass = (isActive: boolean, activeColor: string) =>
        `cursor-pointer px-3 py-1 rounded-full text-xs font-medium border transition-colors select-none ${isActive
            ? `${activeColor} border-transparent text-white`
            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
        }`;

    // Common input class for Progress and Date inputs
    const inputClass = "w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 bg-white text-gray-900";

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200 z-30 relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wide">
                        <Filter size={16} className="mr-2 text-blue-600" /> Filter Tasks
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={onClearFilters} className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                            Clear All
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Column 1: Status */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(TaskStatus).map(s => (
                                    <div
                                        key={s}
                                        onClick={() => toggleStatus(s)}
                                        className={badgeClass(filter.statuses.includes(s), s === TaskStatus.Done ? 'bg-green-500' : s === TaskStatus.Ongoing ? 'bg-blue-500' : 'bg-gray-400')}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Priority</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(Priority).map(p => (
                                    <div
                                        key={p}
                                        onClick={() => togglePriority(p)}
                                        className={badgeClass(filter.priorities.includes(p), p === Priority.High ? 'bg-orange-500' : p === Priority.Medium ? 'bg-blue-500' : 'bg-green-500')}
                                    >
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Owners */}
                    <div>
                        <MultiSelectDropdown
                            label="Owners"
                            options={ownerOptions}
                            selectedValues={filter.ownerIds}
                            onToggle={toggleOwner}
                            onSelectAll={selectAllOwners}
                            onClearSelection={clearOwners}
                            placeholder="All Owners"
                        />
                    </div>

                    {/* Column 3: Roles */}
                    <div>
                        <MultiSelectDropdown
                            label="Roles"
                            options={uniqueRoles}
                            selectedValues={filter.roles}
                            onToggle={toggleRole}
                            onSelectAll={selectAllRoles}
                            onClearSelection={clearRoles}
                            placeholder="All Roles"
                        />
                    </div>

                    {/* Column 4: Progress */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Progress (%)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number" min="0" max="100" placeholder="Min"
                                value={filter.progressMin}
                                onChange={e => onFilterChange({ ...filter, progressMin: e.target.value })}
                                className="w-20 p-2 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white text-gray-900"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number" min="0" max="100" placeholder="Max"
                                value={filter.progressMax}
                                onChange={e => onFilterChange({ ...filter, progressMax: e.target.value })}
                                className="w-20 p-2 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Column 5: Date Ranges */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start Date</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={filter.dateRangeStart.from}
                                    onChange={e => onFilterChange({ ...filter, dateRangeStart: { ...filter.dateRangeStart, from: e.target.value } })}
                                    className={`${inputClass} [color-scheme:light]`}
                                />
                                <span className="text-gray-300 self-center">-</span>
                                <input
                                    type="date"
                                    value={filter.dateRangeStart.to}
                                    onChange={e => onFilterChange({ ...filter, dateRangeStart: { ...filter.dateRangeStart, to: e.target.value } })}
                                    className={`${inputClass} [color-scheme:light]`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End Date</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={filter.dateRangeEnd.from}
                                    onChange={e => onFilterChange({ ...filter, dateRangeEnd: { ...filter.dateRangeEnd, from: e.target.value } })}
                                    className={`${inputClass} [color-scheme:light]`}
                                />
                                <span className="text-gray-300 self-center">-</span>
                                <input
                                    type="date"
                                    value={filter.dateRangeEnd.to}
                                    onChange={e => onFilterChange({ ...filter, dateRangeEnd: { ...filter.dateRangeEnd, to: e.target.value } })}
                                    className={`${inputClass} [color-scheme:light]`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;