
import React, { useState } from 'react';
import { AdvancedSettings } from '../types';
import Modal from './ui/Modal';

const themes = [
    { name: 'purple', color: 'bg-purple-500' },
    { name: 'blue', color: 'bg-blue-500' },
    { name: 'green', color: 'bg-green-500' },
    { name: 'rose', color: 'bg-rose-500' },
];

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    advancedSettings: AdvancedSettings;
    onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
    onClearAllData: () => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}

const SettingsSection: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="pt-4 mt-4 border-t border-white/10 first:mt-0 first:pt-0 first:border-t-0">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">{title}</h3>
        {children}
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    onClose,
    currentTheme,
    onThemeChange,
    advancedSettings,
    onAdvancedSettingsChange,
    onClearAllData,
    apiKey,
    onApiKeyChange
}) => {
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    const handleSettingsChange = <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => {
        onAdvancedSettingsChange({ ...advancedSettings, [key]: value });
    };

    const handleClearClick = () => {
        setIsConfirmingClear(true);
    };

    const confirmClear = () => {
        onClearAllData();
        setIsConfirmingClear(false);
    };

    const cancelClear = () => {
        setIsConfirmingClear(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-4">
                 <SettingsSection title="API Key">
                    <div className="space-y-2">
                         <p className="text-sm text-slate-400">
                            Your Google Gemini API key is stored in your browser and is required for all AI features.
                         </p>
                         <input 
                            type="password"
                            value={apiKey}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            placeholder="Enter your Gemini API Key"
                            className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"
                        />
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-[rgba(var(--primary-rgb),1)] underline hover:text-[rgba(var(--primary-rgb),0.8)]">
                            Get your API Key from Google AI Studio
                        </a>
                    </div>
                </SettingsSection>
                
                <SettingsSection title="Theme">
                    <div className="grid grid-cols-4 gap-3">
                        {themes.map(theme => (
                             <button
                                key={theme.name}
                                onClick={() => onThemeChange(theme.name)}
                                className={`w-full aspect-square rounded-lg transition-all duration-200 ${theme.color}
                                    ${currentTheme === theme.name ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : 'scale-90 opacity-70 hover:opacity-100 hover:scale-100'}`
                                }
                                title={`Set ${theme.name} theme`}
                             />
                        ))}
                    </div>
                </SettingsSection>
                
                <SettingsSection title="Default Generation Settings">
                   <div className="space-y-4 text-sm">
                      <div>
                        <label className="block mb-1 font-semibold text-slate-300">Outline Depth</label>
                        <select value={advancedSettings.outlineDepth} onChange={(e) => handleSettingsChange('outlineDepth', e.target.value as any)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]">
                          <option>Concise</option>
                          <option>Standard</option>
                          <option>Detailed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-300">Study Pace</label>
                        <select value={advancedSettings.studyPace} onChange={(e) => handleSettingsChange('studyPace', e.target.value as any)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]">
                          <option>Casual</option>
                          <option>Moderate</option>
                          <option>Intensive</option>
                        </select>
                      </div>
                    </div>
                </SettingsSection>
                
                <SettingsSection title="Data Management">
                    {isConfirmingClear ? (
                        <div>
                            <p className="text-sm text-red-300 mb-3">Are you sure? This will permanently delete all your outlines.</p>
                            <div className="flex gap-2">
                                <button onClick={confirmClear} className="flex-1 py-2 px-4 text-sm rounded-md text-white bg-red-600 hover:bg-red-700">Yes, delete everything</button>
                                <button onClick={cancelClear} className="py-2 px-4 text-sm rounded-md text-white bg-white/10 hover:bg-white/20">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleClearClick}
                            className="w-full text-left p-3 bg-red-900/50 text-red-300 rounded-lg hover:bg-red-900/80 transition-colors text-sm font-semibold"
                        >
                            Clear All Saved Outlines...
                        </button>
                    )}
                </SettingsSection>
            </div>
        </Modal>
    );
};

export default SettingsPanel;