
import React, { useState } from 'react';
import { Member } from '../types';
import { X, Plus, Trash2, User } from 'lucide-react';

interface MemberManagerProps {
    members: Member[];
    isOpen: boolean;
    onClose: () => void;
    onUpdateMembers: (members: Member[]) => void;
    onShowNotification: (message: string, type?: 'success' | 'error') => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const MemberManager: React.FC<MemberManagerProps> = ({ members, isOpen, onClose, onUpdateMembers, onShowNotification }) => {
    const [newMember, setNewMember] = useState<Partial<Member>>({ color: COLORS[0] });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newMember.name) return;
        const member: Member = {
            id: Math.random().toString(36).substr(2, 9),
            name: newMember.name,
            role: newMember.role || 'Member',
            email: newMember.email || '',
            phone: newMember.phone || '',
            color: newMember.color || COLORS[0]
        };
        onUpdateMembers([...members, member]);
        setNewMember({ name: '', role: '', email: '', phone: '', color: COLORS[0] });
    };

    const confirmDelete = (id: string) => {
        onUpdateMembers(members.filter(m => m.id !== id));
        setDeleteConfirmId(null);
    };

    const updateField = (id: string, field: keyof Member, value: string) => {
        onUpdateMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const inputClass = "w-full text-sm outline-none bg-white text-gray-900 placeholder-gray-400";
    const wrapperClass = "flex items-center bg-white border border-gray-300 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><User size={20} /></div>
                        <h2 className="text-xl font-bold text-slate-800">Project Members</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={async () => {
                                const headers = ['ID', 'Name', 'Role', 'Email', 'Phone', 'Color'];
                                const rows = members.map(m => [m.id, m.name, m.role, m.email || '', m.phone || '', m.color || '']);
                                const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

                                if (window.electronAPI?.isElectron) {
                                    const result = await window.electronAPI.exportCSV('members_export.csv', csvContent);
                                    if (result.success) {
                                        onShowNotification('Members exported successfully', 'success');
                                    }
                                } else {
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement('a');
                                    link.href = URL.createObjectURL(blob);
                                    link.download = `members_export.csv`;
                                    link.click();
                                    onShowNotification('Members exported successfully', 'success');
                                }
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                        >
                            Export CSV
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">

                    {/* Add New */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Add New Member</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                            <div className="md:col-span-1">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Name</label>
                                <div className={wrapperClass}>
                                    <input
                                        type="text" placeholder="Name" className={inputClass}
                                        value={newMember.name || ''} onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Role</label>
                                <div className={wrapperClass}>
                                    <input
                                        type="text" placeholder="Role" className={inputClass}
                                        value={newMember.role || ''} onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                                <div className={wrapperClass}>
                                    <input
                                        type="text" placeholder="Email" className={inputClass}
                                        value={newMember.email || ''} onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                                <div className={wrapperClass}>
                                    <input
                                        type="text" placeholder="Phone" className={inputClass}
                                        value={newMember.phone || ''} onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={!newMember.name}
                                className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors h-[34px]"
                            >
                                <Plus size={16} className="mr-1" /> Add
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                                <tr>
                                    <th className="px-4 py-3 w-14 text-center">Color</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3 w-20 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {members.map(m => (
                                    <tr key={m.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-2 text-center">
                                            <div className="relative group inline-block">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-sm border-2 border-white" style={{ backgroundColor: m.color }}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="absolute top-0 left-0 hidden group-hover:flex flex-wrap bg-white p-1 shadow-lg border rounded-md w-32 z-10">
                                                    {COLORS.map(c => (
                                                        <div key={c} onClick={() => updateField(m.id, 'color', c)} className="w-6 h-6 m-0.5 cursor-pointer rounded hover:scale-110 border border-gray-100" style={{ background: c }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text" value={m.name}
                                                onChange={e => updateField(m.id, 'name', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none py-1 text-gray-800 font-medium"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text" value={m.role}
                                                onChange={e => updateField(m.id, 'role', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none py-1 text-sm text-gray-600"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text" value={m.email || ''}
                                                onChange={e => updateField(m.id, 'email', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none py-1 text-sm text-gray-600"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text" value={m.phone || ''}
                                                onChange={e => updateField(m.id, 'phone', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none py-1 text-sm text-gray-600"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {deleteConfirmId === m.id ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); confirmDelete(m.id); }}
                                                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 shadow-sm"
                                                    >
                                                        Sure?
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                                        className="text-gray-400 hover:bg-gray-200 p-1 rounded"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(m.id); }}
                                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {members.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">No members found. Add one above.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">Done</button>
                </div>
            </div>
        </div>
    );
};

export default MemberManager;
