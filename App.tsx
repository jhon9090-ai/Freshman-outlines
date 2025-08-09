

import React, { useState, useEffect, useCallback } from 'react';
import { StudyOutline, AppStatus, AppView, AdvancedSettings, CurriculumSource } from './types';
import { generateStudyOutline } from './services/geminiService';
import InputPanel from './components/InputPanel';
import StudyView from './components/StudyView';
import Spinner from './components/ui/Spinner';
import CurriculumView from './components/CurriculumView';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import SettingsIcon from './components/icons/SettingsIcon';

const STORAGE_KEY = 'studyOutlines';
const SETTINGS_STORAGE_KEY = 'app-settings';

const defaultSettings: AdvancedSettings = {
  outlineDepth: 'Standard',
  learningGoals: '',
  studyPace: 'Moderate',
  subjectEmphasis: '',
};

const TabButton: React.FC<{
  tabId: AppView,
  currentTab: AppView,
  onClick: (tabId: AppView) => void,
  children: React.ReactNode
}> = ({ tabId, currentTab, onClick, children }) => (
  <button 
    onClick={() => onClick(tabId)}
    className={`px-4 py-2 text-lg font-semibold transition-all duration-200 rounded-t-lg relative group
      ${currentTab === tabId ? 'text-white' : 'text-slate-400 hover:text-white'}`}
  >
      {children}
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[rgba(var(--primary-rgb),1)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out
        ${currentTab === tabId ? 'scale-x-100' : ''}`}
      />
  </button>
);

export default function App(): React.ReactNode {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('curriculum');
  const [previousView, setPreviousView] = useState<AppView>('curriculum');
  const [outlines, setOutlines] = useState<StudyOutline[]>([]);
  const [activeOutline, setActiveOutline] = useState<StudyOutline | null>(null);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('purple');
  const [advSettings, setAdvSettings] = useState<AdvancedSettings>(defaultSettings);
  const [apiKey, setApiKey] = useState('');


  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const savedOutlines = localStorage.getItem(STORAGE_KEY);
      if (savedOutlines) setOutlines(JSON.parse(savedOutlines));
      
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const { theme, advancedSettings, apiKey } = JSON.parse(savedSettings);
        if (theme) setTheme(theme);
        if (advancedSettings) setAdvSettings(advancedSettings);
        if (apiKey) setApiKey(apiKey);
      }
    } catch (e) {
      console.error("Failed to load data from storage", e);
      setOutlines([]);
    }
  }, []);
  
  // Apply and save settings when they change
  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add('dark', `theme-${theme}`);
    const settingsToSave = JSON.stringify({ theme, advancedSettings: advSettings, apiKey });
    localStorage.setItem(SETTINGS_STORAGE_KEY, settingsToSave);
  }, [theme, advSettings, apiKey]);

  const saveOutlines = (updatedOutlines: StudyOutline[]) => {
    setOutlines(updatedOutlines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOutlines));
  };

  useEffect(() => {
    if (activeOutline) {
        const freshOutline = outlines.find(o => o.id === activeOutline.id);
        if (freshOutline && JSON.stringify(freshOutline) !== JSON.stringify(activeOutline)) {
            setActiveOutline(freshOutline);
        }
    }
  }, [outlines, activeOutline]);

  const handleGenerate = useCallback(async (generationInput: string, title: string, advancedSettings: AdvancedSettings, isTheme: boolean = false, curriculumSource?: CurriculumSource) => {
    setPreviousView(view);
    setStatus('loading');
    setError(null);
    try {
      const result = await generateStudyOutline(generationInput, advancedSettings, isTheme);
      const newOutline: StudyOutline = {
        ...result,
        id: `outline-${Date.now()}`,
        title: title,
        createdAt: new Date().toISOString(),
        curriculumSource: curriculumSource,
      };
      
      const updatedOutlines = [...outlines, newOutline];
      saveOutlines(updatedOutlines);
      setActiveOutline(newOutline);
      setView('study');
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStatus('error');
    }
  }, [outlines, view]);

  const handleSelectOutline = (outlineId: string) => {
    const outlineToOpen = outlines.find(o => o.id === outlineId);
    if (outlineToOpen) {
      setPreviousView(view);
      setActiveOutline(outlineToOpen);
      setView('study');
    }
  };

  const handleDeleteOutline = (outlineId: string) => {
    const updatedOutlines = outlines.filter(o => o.id !== outlineId);
    saveOutlines(updatedOutlines);
  };
  
  const handleDeleteAllOutlines = () => {
    saveOutlines([]);
    setIsSettingsOpen(false); // Close panel after action
  }

  const handleDeleteOutlineBySource = (source: CurriculumSource) => {
    const updatedOutlines = outlines.filter(o => 
      !(o.curriculumSource?.subjectKey === source.subjectKey &&
        o.curriculumSource?.theme === source.theme &&
        o.curriculumSource?.unit === source.unit)
    );
    saveOutlines(updatedOutlines);
  };

  const handleRenameOutline = (outlineId: string, newTitle: string) => {
    const updatedOutlines = outlines.map(o => o.id === outlineId ? {...o, title: newTitle} : o);
    saveOutlines(updatedOutlines);
  };

  const handleUpdateProgress = (objectiveId: string, isComplete: boolean) => {
    if (!activeOutline) return;
    
    const updatedOutlines = outlines.map(outline => {
      if (outline.id === activeOutline.id) {
        const completed = new Set(outline.completedObjectives);
        if (isComplete) {
          completed.add(objectiveId);
        } else {
          completed.delete(objectiveId);
        }
        return { ...outline, completedObjectives: Array.from(completed) };
      }
      return outline;
    });
    saveOutlines(updatedOutlines);
  };
  
  const handleBackToTabs = () => {
    if (previousView === 'curriculum' && activeOutline?.curriculumSource) {
      setSelectedSubjectKey(activeOutline.curriculumSource.subjectKey);
    } else {
      setSelectedSubjectKey(null);
    }
    
    setView(previousView);
    setActiveOutline(null);
    setStatus('idle');
  }

  const renderContent = () => {
    if (view === 'study' && activeOutline) {
      return (
        <StudyView
          outline={activeOutline}
          onBack={handleBackToTabs}
          onUpdateProgress={handleUpdateProgress}
        />
      );
    }
    
    const tabView = view === 'study' ? 'create' : view;

    return (
        <div className="flex flex-col items-center justify-start w-full h-full p-4 md:p-8">
            <div className={`w-full max-w-4xl h-full flex flex-col ${selectedSubjectKey && tabView === 'curriculum' ? 'max-w-full' : ''}`}>
                <div className="w-full text-left mb-4 flex justify-between items-start">
                    <h1 className="font-heading text-3xl text-white">
                      Intelligent Outlines
                    </h1>
                     <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-100"
                        title="Settings"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex justify-center border-b border-white/10 mb-6">
                    <TabButton tabId="curriculum" currentTab={tabView} onClick={(tab) => setView(tab)}>Curriculum</TabButton>
                    <TabButton tabId="create" currentTab={tabView} onClick={(tab) => { setView(tab); setSelectedSubjectKey(null); }}>Create New</TabButton>
                    <TabButton tabId="outlines" currentTab={tabView} onClick={(tab) => { setView(tab); setSelectedSubjectKey(null); }}>My Outlines</TabButton>
                </div>

                <div key={tabView} className="flex-1 overflow-y-auto pr-2 animate-fadeInSlideUp">
                    {tabView === 'create' && (
                        <InputPanel
                            onGenerate={handleGenerate}
                            status={status}
                            error={error}
                            onClearError={() => setError(null)}
                            defaultSettings={advSettings}
                        />
                    )}
                    {tabView === 'curriculum' && (
                        <CurriculumView
                            onGenerate={handleGenerate}
                            outlines={outlines}
                            onSelectOutline={handleSelectOutline}
                            onDeleteOutlineBySource={handleDeleteOutlineBySource}
                            selectedSubjectKey={selectedSubjectKey}
                            setSelectedSubjectKey={setSelectedSubjectKey}
                            defaultSettings={advSettings}
                        />
                    )}
                    {tabView === 'outlines' && (
                        <Dashboard 
                            outlines={outlines}
                            onSelectOutline={handleSelectOutline}
                            onDeleteOutline={handleDeleteOutline}
                            onRenameOutline={handleRenameOutline}
                        />
                    )}
                </div>
            </div>
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen text-slate-200 font-sans antialiased bg-grid">
        <Spinner className="h-12 w-12 text-[rgba(var(--primary-rgb),1)]" />
        <p className="mt-4 text-lg text-slate-300 animate-pulse">Generating your study outline...</p>
        <p className="text-sm text-slate-400">The AI is thinking. This may take a moment.</p>
      </div>
    );
  }
  
  return (
    <div className="h-screen w-screen text-slate-200 font-sans antialiased bg-grid overflow-hidden">
        {renderContent()}
        <SettingsPanel 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentTheme={theme}
            onThemeChange={setTheme}
            advancedSettings={advSettings}
            onAdvancedSettingsChange={setAdvSettings}
            onClearAllData={handleDeleteAllOutlines}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
        />
    </div>
  );
}