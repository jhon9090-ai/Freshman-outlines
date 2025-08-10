
import React, { useState } from 'react';
import type { User } from '../services/dataService';
import { AdvancedSettings, FirebaseConfig } from '../types';
import { signInWithGoogle, signOutUser } from '../services/dataService';
import Modal from './ui/Modal';
import GoogleIcon from './icons/GoogleIcon'; // New icon for Google login

const themes = [
    { name: 'purple', color: 'bg-purple-500' },
    { name: 'blue', color: 'bg-blue-500' },
    { name: 'green', color: 'bg-green-500' },
    { name: 'rose', color: 'bg-rose-500' },
];

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    appSettings: {
        theme: string;
        advSettings: AdvancedSettings;
        geminiApiKey: string;
        firebaseConfig: FirebaseConfig;
    };
    onAppSettingsChange: (settings: any) => void;
    onClearAllData: () => void;
    user: User | null;
    firebaseInitialized: boolean;
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
    appSettings,
    onAppSettingsChange,
    onClearAllData,
    user,
    firebaseInitialized
}) => {
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    const handleSettingsChange = (field: string, value: any) => {
        onAppSettingsChange({ ...appSettings, [field]: value });
    };

    const handleAdvancedSettingsChange = <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => {
        handleSettingsChange('advSettings', { ...appSettings.advSettings, [key]: value });
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
                 <SettingsSection title="Cloud Sync & Account">
                    {firebaseInitialized ? (
                        user ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <img src={user.photoURL || undefined} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full"/>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{user.displayName}</p>
                                        <p className="text-xs text-slate-400">{user.email}</p>
                                    </div>
                                </div>
                                <button onClick={signOutUser} className="py-2 px-4 text-sm rounded-md text-white bg-white/10 hover:bg-white/20">Logout</button>
                            </div>
                        ) : (
                            <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-white text-black font-semibold hover:bg-slate-200 transition-colors">
                                <GoogleIcon className="w-5 h-5" />
                                Sign In with Google
                            </button>
                        )
                    ) : (
                        <p className="text-sm text-amber-300">Firebase has not been configured correctly. Cloud features are disabled.</p>
                    )}
                 </SettingsSection>
                 
                 <SettingsSection title="API Keys">
                    <div className="space-y-2">
                         <label className="block text-sm font-medium text-slate-300">Google Gemini API Key</label>
                         <input 
                            type="password"
                            value={appSettings.geminiApiKey}
                            onChange={(e) => handleSettingsChange('geminiApiKey', e.target.value)}
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
                                onClick={() => handleSettingsChange('theme', theme.name)}
                                className={`w-full aspect-square rounded-lg transition-all duration-200 ${theme.color}
                                    ${appSettings.theme === theme.name ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : 'scale-90 opacity-70 hover:opacity-100 hover:scale-100'}`
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
                        <select value={appSettings.advSettings.outlineDepth} onChange={(e) => handleAdvancedSettingsChange('outlineDepth', e.target.value as any)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]">
                          <option>Concise</option>
                          <option>Standard</option>
                          <option>Detailed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold text-slate-300">Study Pace</label>
                        <select value={appSettings.advSettings.studyPace} onChange={(e) => handleAdvancedSettingsChange('studyPace', e.target.value as any)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]">
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
                            <p className="text-sm text-red-300 mb-3">Are you sure? This will permanently delete all your outlines from the cloud.</p>
                            <div className="flex gap-2">
                                <button onClick={confirmClear} className="flex-1 py-2 px-4 text-sm rounded-md text-white bg-red-600 hover:bg-red-700">Yes, delete everything</button>
                                <button onClick={cancelClear} className="py-2 px-4 text-sm rounded-md text-white bg-white/10 hover:bg-white/20">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleClearClick}
                            disabled={!user}
                            className="w-full text-left p-3 bg-red-900/50 text-red-300 rounded-lg hover:bg-red-900/80 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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