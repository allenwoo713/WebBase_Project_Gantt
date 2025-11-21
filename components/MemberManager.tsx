
import React, { useState } from 'react';
import { Member } from '../types';
import { X, Plus, Trash2, User, Mail, Phone, Briefcase, Palette } from 'lucide-react';

interface MemberManagerProps {
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateMembers: (members: Member[]) => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const MemberManager: React.FC<MemberManagerProps> = ({ members, isOpen, onClose, onUpdateMembers }) => {
  const [newMember, setNewMember] = useState<Partial<Member>>({ color: COLORS[0] });

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

  const handleDelete = (id: string) => {
    if(confirm('Delete this member?')) {
        onUpdateMembers(members.filter(m => m.id !== id));
    }
  };

  const updateField = (id: string, field: keyof Member, value: string) => {
      onUpdateMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
             <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><User size={20}/></div>
             <h2 className="text-xl font-bold text-slate-800">Project Members</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            
            {/* Add New */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Add New Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-1">
                        <label className="text-xs text-gray-500 block mb-1">Name</label>
                        <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1.5">
                            <input 
                                type="text" placeholder="Name" className="w-full text-sm outline-none"
                                value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs text-gray-500 block mb-1">Role</label>
                        <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1.5">
                            <input 
                                type="text" placeholder="Role" className="w-full text-sm outline-none"
                                value={newMember.role || ''} onChange={e => setNewMember({...newMember, role: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs text-gray-500 block mb-1">Email</label>
                        <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1.5">
                            <input 
                                type="text" placeholder="Email" className="w-full text-sm outline-none"
                                value={newMember.email || ''} onChange={e => setNewMember({...newMember, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs text-gray-500 block mb-1">Phone</label>
                         <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1.5">
                            <input 
                                type="text" placeholder="Phone" className="w-full text-sm outline-none"
                                value={newMember.phone || ''} onChange={e => setNewMember({...newMember, phone: e.target.value})}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleAdd}
                        disabled={!newMember.name}
                        className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        <Plus size={16} className="mr-1"/> Add
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-4 py-3 w-10">Color</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3 w-16">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {members.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2">
                                    <div className="relative group">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-sm" style={{ backgroundColor: m.color }}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute top-0 left-0 hidden group-hover:flex flex-wrap bg-white p-1 shadow-lg border rounded-md w-32 z-10">
                                            {COLORS.map(c => (
                                                <div key={c} onClick={() => updateField(m.id, 'color', c)} className="w-6 h-6 m-0.5 cursor-pointer rounded hover:scale-110" style={{background: c}}/>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <input 
                                        type="text" value={m.name} 
                                        onChange={e => updateField(m.id, 'name', e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none py-1"
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
                                    <button onClick={() => handleDelete(m.id)} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors">
                                        <Trash2 size={16} />
                                    </button>
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
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Done</button>
        </div>
      </div>
    </div>
  );
};

export default MemberManager;
