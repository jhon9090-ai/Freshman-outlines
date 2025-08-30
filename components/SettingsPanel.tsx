

import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import Modal from './ui/Modal';
import ChevronRightIcon from './icons/ChevronRightIcon';
import WandIcon from './icons/WandIcon';
import LinkIcon from './icons/LinkIcon';
import DatabaseIcon from './icons/DatabaseIcon';
import MusicIcon from './icons/MusicIcon';

type AiProvider = AppSettings['customAiConfig']['provider'];
const aiProviders: { id: AiProvider; label: string }[] = [
    { id: 'gemini', label: 'Built-in Gemini' },
    { id: 'deepseek', label: 'DeepSeek' },
    { id: 'custom', label: 'Custom' },
];

type NotionExportFormat = AppSettings['notionExportFormat'];
const notionFormats: { id: NotionExportFormat, label: string }[] = [
    { id: 'Normal', label: 'Normal Page' },
    { id: 'Kanban', label: 'Kanban Board' },
    { id: 'Database', label: 'Database' },
]

const SETTINGS_ACCORDION_STATE_KEY = 'settings-accordion-state';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, children, isOpen, onToggle }) => (
    <details className="settings-accordion p-2 rounded-lg hover:bg-white/5" open={isOpen}>
        <summary onClick={(e) => { e.preventDefault(); onToggle(); }}>
            <span className="summary-title">{icon} {title}</span>
            <ChevronRightIcon className="summary-chevron w-5 h-5 text-slate-400" />
        </summary>
        <div className="accordion-content">
            <div className="accordion-content-inner pt-4 pl-1 pr-1">
                {children}
            </div>
        </div>
    </details>
);

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    appSettings: AppSettings;
    onAppSettingsChange: (settings: AppSettings) => void;
    onClearAllData: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    onClose,
    appSettings,
    onAppSettingsChange,
    onClearAllData,
}) => {
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
        try {
            const savedState = localStorage.getItem(SETTINGS_ACCORDION_STATE_KEY);
            return savedState ? JSON.parse(savedState) : { aiProvider: true };
        } catch {
            return { aiProvider: true };
        }
    });
    const audioFileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_ACCORDION_STATE_KEY, JSON.stringify(openSections));
        } catch (error) {
            console.error("Could not save settings accordion state:", error);
        }
    }, [openSections]);

    const handleToggleSection = (sectionId: string) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleSettingsChange = (field: keyof AppSettings, value: any) => {
        onAppSettingsChange({ ...appSettings, [field]: value });
    };
    
    const handleCustomAiChange = <K extends keyof AppSettings['customAiConfig']>(key: K, value: AppSettings['customAiConfig'][K]) => {
        onAppSettingsChange({
            ...appSettings,
            customAiConfig: { ...appSettings.customAiConfig, [key]: value },
        });
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("File is too large. Please select a sound file under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            onAppSettingsChange({
                ...appSettings,
                customAlarmSound: dataUrl,
                customAlarmSoundName: file.name,
            });
        };
        reader.onerror = () => {
            alert("Failed to read the audio file.");
        };
        reader.readAsDataURL(file);

        if(e.target) e.target.value = '';
    };

    const handleRemoveCustomSound = () => {
        onAppSettingsChange({
            ...appSettings,
            customAlarmSound: undefined,
            customAlarmSoundName: undefined,
        });
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-2">
                <SettingsSection 
                    title="AI Provider" 
                    icon={<WandIcon className="w-5 h-5 text-slate-400"/>}
                    isOpen={!!openSections['aiProvider']}
                    onToggle={() => handleToggleSection('aiProvider')}
                >
                    <div className="flex bg-slate-800/80 p-1 rounded-lg mb-3 border border-slate-700">
                        {aiProviders.map(provider => (
                            <button
                                key={provider.id}
                                onClick={() => handleCustomAiChange('provider', provider.id)}
                                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${appSettings.customAiConfig.provider === provider.id ? 'bg-sky-500 text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-slate-700/50'}`}
                            >
                                {provider.label}
                            </button>
                        ))}
                    </div>

                    {appSettings.customAiConfig.provider === 'custom' && (
                        <div className="space-y-3 mt-3 p-4 bg-slate-800/80 rounded-lg border border-slate-700">
                            <p className="text-xs text-slate-400">Provide details for a Gemini API-compatible model.</p>
                            <div>
                               <label className="block mb-1 text-xs font-semibold text-slate-300">Model Name</label>
                               <input type="text" placeholder="e.g., gemini-2.5-flash" value={appSettings.customAiConfig.customModelName} onChange={(e) => handleCustomAiChange('customModelName', e.target.value)} className="w-full text-sm p-2 bg-slate-900 border border-slate-700 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold text-slate-300">API Key</label>
                                <input type="password" placeholder="Enter your API key" value={appSettings.customAiConfig.customApiKey} onChange={(e) => handleCustomAiChange('customApiKey', e.target.value)} className="w-full text-sm p-2 bg-slate-900 border border-slate-700 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
                            </div>
                        </div>
                    )}
                     {appSettings.customAiConfig.provider === 'deepseek' && (
                        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400">Using the pre-configured DeepSeek provider. No extra configuration needed.</p>
                        </div>
                     )}
                </SettingsSection>
                
                <SettingsSection 
                    title="Audio" 
                    icon={<MusicIcon className="w-5 h-5 text-slate-400"/>}
                    isOpen={!!openSections['audio']}
                    onToggle={() => handleToggleSection('audio')}
                >
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-300">Custom Alarm Sound</label>
                        {appSettings.customAlarmSoundName ? (
                            <div className="flex items-center justify-between p-2 pl-3 bg-slate-800 rounded-md border border-slate-700">
                                <p className="text-sm text-slate-200 truncate pr-2">{appSettings.customAlarmSoundName}</p>
                                <button onClick={handleRemoveCustomSound} className="text-xs text-red-400 hover:underline flex-shrink-0">Remove</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => audioFileInputRef.current?.click()}
                                className="w-full text-center p-3 bg-slate-800/80 rounded-lg text-white hover:bg-sky-500/10 transition-all duration-200 border border-slate-700 hover:border-sky-500/50"
                            >
                                Upload Sound File
                            </button>
                        )}
                        <input 
                            type="file" 
                            ref={audioFileInputRef} 
                            onChange={handleAudioFileChange}
                            className="hidden" 
                            accept="audio/mpeg, audio/wav, audio/ogg"
                        />
                        <p className="text-xs text-slate-400 mt-1">Upload a short sound file (.mp3, .wav, .ogg) for the Pomodoro alarm.</p>
                    </div>
                </SettingsSection>

                <SettingsSection 
                    title="Integrations" 
                    icon={<LinkIcon className="w-5 h-5 text-slate-400"/>}
                    isOpen={!!openSections['integrations']}
                    onToggle={() => handleToggleSection('integrations')}
                >
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-300">Notion Integration Token</label>
                        <input 
                            type="password" 
                            placeholder="secret_..." 
                            value={appSettings.notionApiKey} 
                            onChange={(e) => handleSettingsChange('notionApiKey', e.target.value)} 
                            className="w-full text-sm p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Found at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">notion.so/my-integrations</a>.</p>
                    </div>
                    <div className="mt-4">
                        <label className="block mb-2 text-sm font-semibold text-slate-300">Notion Export Format</label>
                         <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                           {notionFormats.map(format => (
                                <button
                                    key={format.id}
                                    onClick={() => handleSettingsChange('notionExportFormat', format.id)}
                                    disabled={format.id !== 'Normal'}
                                    className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${appSettings.notionExportFormat === format.id ? 'bg-sky-500 text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-slate-700/50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={format.id !== 'Normal' ? 'Coming Soon!' : ''}
                                >
                                    {format.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </SettingsSection>
                
                <SettingsSection 
                    title="Data Management" 
                    icon={<DatabaseIcon className="w-5 h-5 text-slate-400"/>}
                    isOpen={!!openSections['dataManagement']}
                    onToggle={() => handleToggleSection('dataManagement')}
                >
                    {isConfirmingClear ? (
                        <div>
                            <p className="text-sm text-red-400 mb-3">Are you sure? This will permanently delete all your outlines from this browser.</p>
                            <div className="flex gap-2">
                                <button onClick={() => { onClearAllData(); setIsConfirmingClear(false); }} className="flex-1 py-2 px-4 text-sm rounded-md font-semibold text-white bg-red-500 hover:bg-red-600">Yes, delete everything</button>
                                <button onClick={() => setIsConfirmingClear(false)} className="py-2 px-4 text-sm rounded-md font-semibold text-white bg-slate-700 hover:bg-slate-600">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsConfirmingClear(true)}
                            className="w-full text-left p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-semibold"
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