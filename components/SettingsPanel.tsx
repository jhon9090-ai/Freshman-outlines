
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import Modal from './ui/Modal';
import PaletteIcon from './icons/PaletteIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import WandIcon from './icons/WandIcon';
import LinkIcon from './icons/LinkIcon';
import DatabaseIcon from './icons/DatabaseIcon';

const themes = [
    { name: 'purple', color: 'bg-purple-500' },
    { name: 'blue', color: 'bg-blue-500' },
    { name: 'green', color: 'bg-green-500' },
    { name: 'rose', color: 'bg-rose-500' },
];

const backgroundStyles = [
    { name: 'gridline', label: 'Line Grid'},
    { name: 'griddot', label: 'Dot Grid'},
]

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
    <details className="settings-accordion" open={isOpen} onToggle={(e) => { e.preventDefault(); onToggle(); }}>
        <summary>
            <span className="summary-title">{icon} {title}</span>
            <ChevronRightIcon className="summary-chevron w-5 h-5 text-slate-400" />
        </summary>
        <div className="accordion-content">
            <div className="accordion-content-inner">
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
            return savedState ? JSON.parse(savedState) : {};
        } catch {
            return {};
        }
    });
    
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-2">
                <SettingsSection 
                    title="Appearance" 
                    icon={<PaletteIcon className="w-5 h-5 text-slate-400"/>}
                    isOpen={!!openSections['appearance']}
                    onToggle={() => handleToggleSection('appearance')}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-300">Theme Color</label>
                            <div className="grid grid-cols-4 gap-3">
                                {themes.map(theme => (
                                    <button
                                        key={theme.name}
                                        onClick={() => handleSettingsChange('theme', theme.name)}
                                        className={`w-full aspect-square rounded-lg transition-all duration-200 ${theme.color}
                                            ${appSettings.theme === theme.name ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : 'scale-90 opacity-70 hover:opacity-100 hover:scale-100'}`
                                        }
                                        title={`Set ${theme.name} theme`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-300">Background Style</label>
                            <div className="flex bg-slate-800/60 p-1 rounded-lg">
                               {backgroundStyles.map(style => (
                                    <button
                                        key={style.name}
                                        onClick={() => handleSettingsChange('backgroundStyle', style.name)}
                                        className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${appSettings.backgroundStyle === style.name ? 'bg-[rgba(var(--primary-rgb),1)] text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-white/10'}`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsSection>
                
                <SettingsSection 
                    title="AI Provider" 
                    icon={<WandIcon className="w-5 h-5 text-slate-400"/>}
                    isOpen={!!openSections['aiProvider']}
                    onToggle={() => handleToggleSection('aiProvider')}
                >
                    <div className="flex bg-slate-800/60 p-1 rounded-lg mb-3">
                        {aiProviders.map(provider => (
                            <button
                                key={provider.id}
                                onClick={() => handleCustomAiChange('provider', provider.id)}
                                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${appSettings.customAiConfig.provider === provider.id ? 'bg-[rgba(var(--primary-rgb),1)] text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-white/10'}`}
                            >
                                {provider.label}
                            </button>
                        ))}
                    </div>

                    {appSettings.customAiConfig.provider === 'custom' && (
                        <div className="space-y-3 mt-3 p-3 bg-slate-800/60 rounded-lg">
                            <p className="text-xs text-slate-400">Provide details for a Gemini API-compatible model.</p>
                            <div>
                               <label className="block mb-1 text-xs font-semibold text-slate-300">Model Name</label>
                               <input type="text" placeholder="e.g., gemini-2.5-flash" value={appSettings.customAiConfig.customModelName} onChange={(e) => handleCustomAiChange('customModelName', e.target.value)} className="w-full text-sm p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"/>
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold text-slate-300">API Key</label>
                                <input type="password" placeholder="Enter your API key" value={appSettings.customAiConfig.customApiKey} onChange={(e) => handleCustomAiChange('customApiKey', e.target.value)} className="w-full text-sm p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"/>
                            </div>
                        </div>
                    )}
                     {appSettings.customAiConfig.provider === 'deepseek' && (
                        <div className="p-3 bg-slate-800/60 rounded-lg">
                            <p className="text-xs text-slate-400">Using the pre-configured DeepSeek provider. No extra configuration needed.</p>
                        </div>
                     )}
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
                            className="w-full text-sm p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"
                        />
                        <p className="text-xs text-slate-400 mt-1">Found at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-[rgba(var(--primary-rgb),1)] underline">notion.so/my-integrations</a>.</p>
                    </div>
                    <div className="mt-4">
                        <label className="block mb-2 text-sm font-semibold text-slate-300">Notion Export Format</label>
                         <div className="flex bg-slate-800/60 p-1 rounded-lg">
                           {notionFormats.map(format => (
                                <button
                                    key={format.id}
                                    onClick={() => handleSettingsChange('notionExportFormat', format.id)}
                                    disabled={format.id !== 'Normal'}
                                    className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${appSettings.notionExportFormat === format.id ? 'bg-[rgba(var(--primary-rgb),1)] text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
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
                            <p className="text-sm text-red-300 mb-3">Are you sure? This will permanently delete all your outlines from this browser.</p>
                            <div className="flex gap-2">
                                <button onClick={() => { onClearAllData(); setIsConfirmingClear(false); }} className="flex-1 py-2 px-4 text-sm rounded-md text-white bg-red-600 hover:bg-red-700">Yes, delete everything</button>
                                <button onClick={() => setIsConfirmingClear(false)} className="py-2 px-4 text-sm rounded-md text-white bg-white/10 hover:bg-white/20">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsConfirmingClear(true)}
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
