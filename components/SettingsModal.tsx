import React, { useState } from 'react';
import { ProjectSettings, Holiday } from '../types';
import { X, Settings, Calendar as CalendarIcon, Trash2, Plus, FileText, Briefcase, Folder } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  onSave: (newSettings: ProjectSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(settings);
  
  // Holiday Form State
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayStart, setNewHolidayStart] = useState('');
  const [newHolidayEnd, setNewHolidayEnd] = useState('');

  // Make-up Day Form State
  const [newMakeUpDay, setNewMakeUpDay] = useState('');

  if (!isOpen) return null;

  const showPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
        if (e.currentTarget && typeof e.currentTarget.showPicker === 'function') {
            e.currentTarget.showPicker();
        }
    } catch (err) {
        // Fallback
    }
  };

  const handleAddHoliday = () => {
      if (newHolidayName && newHolidayStart && newHolidayEnd) {
          const newHol: Holiday = {
              id: Math.random().toString(36).substr(2,9),
              name: newHolidayName,
              start: newHolidayStart,
              end: newHolidayEnd
          };
          setLocalSettings(prev => ({
              ...prev,
              holidays: [...(prev.holidays || []), newHol].sort((a,b) => a.start.localeCompare(b.start))
          }));
          setNewHolidayName('');
          setNewHolidayStart('');
          setNewHolidayEnd('');
      }
  };

  const handleRemoveHoliday = (id: string) => {
      setLocalSettings(prev => ({
          ...prev,
          holidays: (prev.holidays || []).filter(h => h.id !== id)
      }));
  };

  const handleAddMakeUpDay = () => {
      if (newMakeUpDay && !localSettings.makeUpDays?.includes(newMakeUpDay)) {
          setLocalSettings(prev => ({
              ...prev,
              makeUpDays: [...(prev.makeUpDays || []), newMakeUpDay].sort()
          }));
          setNewMakeUpDay('');
      }
  };

  const handleRemoveMakeUpDay = (date: string) => {
      setLocalSettings(prev => ({
          ...prev,
          makeUpDays: (prev.makeUpDays || []).filter(d => d !== date)
      }));
  };

  const handleSave = () => {
      onSave(localSettings);
      onClose();
  };

  // Common classes for inputs to ensure light theme visibility and no dark backgrounds
  const inputClass = "w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 bg-white text-gray-900";
  const dateInputClass = `${inputClass} [color-scheme:light] cursor-pointer`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
             <div className="bg-gray-100 p-2 rounded-lg text-gray-700"><Settings size={20}/></div>
             <h2 className="text-xl font-bold text-slate-800">Project Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Section: File */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center">
                    <FileText size={14} className="mr-2"/> Project File Settings
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                     <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Project Filename</label>
                        <input 
                            type="text" 
                            value={localSettings.projectFilename || ''}
                            onChange={e => setLocalSettings({...localSettings, projectFilename: e.target.value})}
                            className={inputClass}
                            placeholder="e.g. MyProject_v1"
                        />
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Local Save Path (Metadata)</label>
                        <div className="flex items-center border border-gray-300 rounded bg-white">
                            <div className="p-2 text-gray-400 border-r border-gray-300 bg-gray-50"><Folder size={14}/></div>
                            <input 
                                type="text" 
                                value={localSettings.projectSavePath || ''}
                                onChange={e => setLocalSettings({...localSettings, projectSavePath: e.target.value})}
                                className="w-full p-2 text-sm outline-none bg-white text-gray-900"
                                placeholder="e.g. C:/Users/Admin/Projects"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 italic">Note: Browser security restricts automatic saving to specific paths. This path is stored for your reference.</p>
                     </div>
                </div>
            </div>

            {/* Section: Duration Config */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Duration Calculation</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Show Dependency Lines</span>
                    <input 
                        type="checkbox" 
                        checked={localSettings.showDependencies}
                        onChange={e => setLocalSettings({...localSettings, showDependencies: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-white border-gray-300"
                    />
                </div>
                <div className="space-y-2">
                    <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors">
                        <input 
                            type="radio" name="weekendMode"
                            checked={localSettings.includeWeekends}
                            onChange={() => setLocalSettings({...localSettings, includeWeekends: true})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 bg-white border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700"><strong>Calendar Days</strong> (Include Weekends)</span>
                    </label>
                    <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors">
                        <input 
                            type="radio" name="weekendMode"
                            checked={!localSettings.includeWeekends}
                            onChange={() => setLocalSettings({...localSettings, includeWeekends: false})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 bg-white border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700"><strong>Working Days</strong> (Exclude Sat/Sun)</span>
                    </label>
                </div>
            </div>

            {/* Section: Holidays */}
            {!localSettings.includeWeekends && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <hr className="border-gray-100"/>
                    
                    {/* Holidays List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center">
                            <CalendarIcon size={14} className="mr-2"/> Holidays
                        </h3>
                        
                        {/* Add Holiday Form */}
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                            <input 
                                type="text" placeholder="Holiday Name (e.g. National Day)"
                                value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)}
                                className={inputClass}
                            />
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 uppercase">Start</label>
                                    <input 
                                        type="date" 
                                        value={newHolidayStart} 
                                        onChange={e => setNewHolidayStart(e.target.value)} 
                                        onClick={showPicker}
                                        className={dateInputClass}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 uppercase">End</label>
                                    <input 
                                        type="date" 
                                        value={newHolidayEnd} 
                                        onChange={e => setNewHolidayEnd(e.target.value)} 
                                        onClick={showPicker}
                                        className={dateInputClass}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={handleAddHoliday} disabled={!newHolidayName || !newHolidayStart || !newHolidayEnd}
                                        className="h-[38px] px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Plus size={18}/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
                            {(localSettings.holidays || []).length === 0 && <div className="p-4 text-center text-xs text-gray-400">No holidays configured</div>}
                            {(localSettings.holidays || []).map(h => (
                                <div key={h.id} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{h.name}</div>
                                        <div className="text-xs text-gray-500">{h.start} to {h.end}</div>
                                    </div>
                                    <button onClick={() => handleRemoveHoliday(h.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Make-up Days */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center">
                            <Briefcase size={14} className="mr-2"/> Make-Up Days (Working Weekends)
                        </h3>
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={newMakeUpDay} 
                                onChange={e => setNewMakeUpDay(e.target.value)}
                                onClick={showPicker}
                                className={`${dateInputClass} flex-1`}
                            />
                            <button 
                                onClick={handleAddMakeUpDay} disabled={!newMakeUpDay}
                                className="px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                <Plus size={18}/>
                            </button>
                        </div>
                         <div className="flex flex-wrap gap-2">
                            {(localSettings.makeUpDays || []).map(d => (
                                <div key={d} className="flex items-center bg-green-50 border border-green-200 px-2 py-1 rounded text-sm text-green-800">
                                    {d}
                                    <button onClick={() => handleRemoveMakeUpDay(d)} className="ml-2 text-green-600 hover:text-red-600"><X size={12}/></button>
                                </div>
                            ))}
                             {(localSettings.makeUpDays || []).length === 0 && <span className="text-xs text-gray-400">No make-up days added.</span>}
                        </div>
                    </div>
                </div>
            )}

        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Apply Settings</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;