import React, { useState, useEffect } from 'react';
import { AISettings } from '../types';
import { X, Save, AlertTriangle } from 'lucide-react';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: AISettings) => void;
    currentSettings: AISettings;
}

const PROVIDERS: { value: AISettings['provider']; label: string }[] = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'zhipu', label: 'Z AI (Zhipu)' }
];

const DEFAULT_SETTINGS: Record<AISettings['provider'], Omit<AISettings, 'provider'>> = {
    openai: { apiKey: '', model: 'gpt-3.5-turbo', baseUrl: '' },
    anthropic: { apiKey: '', model: 'claude-3-opus-20240229', baseUrl: '' },
    gemini: { apiKey: '', model: 'gemini-pro', baseUrl: '' },
    zhipu: { apiKey: '', model: 'glm-4.6', baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4' }
};

const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
    // Map of provider -> settings for that provider
    const [settingsMap, setSettingsMap] = useState<Record<AISettings['provider'], Omit<AISettings, 'provider'>>>(DEFAULT_SETTINGS);
    const [selectedProvider, setSelectedProvider] = useState<AISettings['provider']>('openai');

    // Load initial settings
    useEffect(() => {
        if (isOpen) {
            // Load from electron settings if available, otherwise localStorage logic is handled by parent but we initialize local state here
            // We use the currentSettings passed from App as the "active" one, but we ideally wanna load ALL settings
            // For now, let's sync the passed currentSettings into the map
            setSettingsMap(prev => ({
                ...prev,
                [currentSettings.provider]: {
                    apiKey: currentSettings.apiKey,
                    model: currentSettings.model,
                    baseUrl: currentSettings.baseUrl
                }
            }));
            setSelectedProvider(currentSettings.provider);

            // Attempt to load full settings from map if persisted
            const loadMultiSettings = async () => {
                if (window.electronAPI) {
                    const result = await window.electronAPI.loadSettings();
                    if (result.success && result.data && result.data.aiSettingsMap) {
                        setSettingsMap(result.data.aiSettingsMap);
                    }
                } else {
                    const local = localStorage.getItem('progantt-ai-settings-map');
                    if (local) {
                        try {
                            setSettingsMap(JSON.parse(local));
                        } catch (e) {
                            console.error("Failed to parse local settings map");
                        }
                    }
                }
            };
            loadMultiSettings();
        }
    }, [isOpen, currentSettings]);

    const handleSave = async () => {
        const activeConfig = settingsMap[selectedProvider];
        const finalSettings: AISettings = {
            provider: selectedProvider,
            ...activeConfig
        };

        // Persist the entire map
        if (window.electronAPI) {
            await window.electronAPI.saveSettings({ aiSettingsMap: settingsMap, activeProvider: selectedProvider });
        } else {
            localStorage.setItem('progantt-ai-settings-map', JSON.stringify(settingsMap));
        }

        onSave(finalSettings);
        onClose();
    };

    const updateCurrentSetting = (key: keyof Omit<AISettings, 'provider'>, value: string) => {
        setSettingsMap(prev => ({
            ...prev,
            [selectedProvider]: {
                ...prev[selectedProvider],
                [key]: value
            }
        }));
    };

    if (!isOpen) return null;

    const currentConfig = settingsMap[selectedProvider];
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-purple-600 text-white">
                    <h2 className="text-lg font-bold flex items-center">
                        <span className="mr-2">⚡</span> AI Settings
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Provider Selection (Dropdown) */}
                    <div>
                        <label className={labelClass}>AI Provider</label>
                        <select
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value as AISettings['provider'])}
                            className={inputClass}
                        >
                            {PROVIDERS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className={labelClass}>API Key</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={currentConfig.apiKey || ''}
                                onChange={(e) => updateCurrentSetting('apiKey', e.target.value)}
                                placeholder={`Enter ${PROVIDERS.find(p => p.value === selectedProvider)?.label} Key`}
                                className={inputClass}
                            />
                            <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                                <span className="text-xs">🔑</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Keys are stored locally in your browser/app.</p>
                    </div>

                    {/* Model Name */}
                    <div>
                        <label className={labelClass}>Model Name</label>
                        <input
                            type="text"
                            value={currentConfig.model || ''}
                            onChange={(e) => updateCurrentSetting('model', e.target.value)}
                            placeholder="e.g., gpt-4, claude-3-opus"
                            className={inputClass}
                        />
                    </div>

                    {/* Base URL */}
                    <div>
                        <label className={labelClass}>Base URL (Optional)</label>
                        <input
                            type="text"
                            value={currentConfig.baseUrl || ''}
                            onChange={(e) => updateCurrentSetting('baseUrl', e.target.value)}
                            placeholder="https://api.example.com/v1"
                            className={inputClass}
                        />
                        {selectedProvider === 'zhipu' && !currentConfig.baseUrl && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center">
                                <AlertTriangle size={12} className="mr-1" />
                                Default: https://open.bigmodel.cn/api/coding/paas/v4
                            </p>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-600/30 transition-all active:scale-95 font-medium"
                    >
                        <Save size={18} className="mr-2" />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AISettingsModal;
