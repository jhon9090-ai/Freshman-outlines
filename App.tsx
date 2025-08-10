


import React, { useState, useEffect, useCallback } from 'react';
import { StudyOutline, AppStatus, AppView, AdvancedSettings, AppSettings, CurriculumSource } from './types';
import { generateStudyOutline } from './services/geminiService';
import InputPanel from './components/InputPanel';
import StudyView from './components/StudyView';
import Spinner from './components/ui/Spinner';
import CurriculumView from './components/CurriculumView';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import SettingsIcon from './components/icons/SettingsIcon';

const SETTINGS_STORAGE_KEY = 'app-settings';
const OUTLINES_STORAGE_KEY = 'app-outlines';

const defaultSettings: AppSettings = {
  theme: 'purple',
  backgroundStyle: 'gridline',
  customAiConfig: {
    provider: 'gemini',
    customModelName: '',
    customApiKey: '',
  },
  advSettings: {
    outlineDepth: 'Standard',
    learningGoals: '',
    studyPace: 'Moderate',
    subjectEmphasis: '',
    intention: 'Default',
  },
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
  
  const [outlines, setOutlines] = useState<StudyOutline[]>(() => {
    try {
      const savedOutlines = localStorage.getItem(OUTLINES_STORAGE_KEY);
      return savedOutlines ? JSON.parse(savedOutlines) : [];
    } catch (e) {
      console.error("Failed to load outlines from storage", e);
      return [];
    }
  });

  const [activeOutline, setActiveOutline] = useState<StudyOutline | null>(null);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      try {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          // Merge saved settings with defaults to avoid errors if new settings are added
          return {
            ...defaultSettings,
            ...parsed,
            advSettings: {
              ...defaultSettings.advSettings,
              ...(parsed.advSettings || {})
            },
            customAiConfig: {
              ...defaultSettings.customAiConfig,
              ...(parsed.customAiConfig || {})
            }
          };
        }
      } catch (e) {
        console.error("Failed to load settings from storage", e);
      }
      return defaultSettings;
  });

  // Effect to persist outlines to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(OUTLINES_STORAGE_KEY, JSON.stringify(outlines));
    } catch (e) {
      console.error("Failed to save outlines to storage", e);
    }
  }, [outlines]);
  
  // Effect to apply and persist settings
  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add('dark', `theme-${appSettings.theme}`);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
    } catch (e) {
      console.error("Failed to save settings to storage", e);
    }
  }, [appSettings]);
  
  // Effect to keep active outline in sync with the main list
  useEffect(() => {
    if (activeOutline) {
        const freshOutline = outlines.find(o => o.id === activeOutline.id);
        if (freshOutline && JSON.stringify(freshOutline) !== JSON.stringify(activeOutline)) {
            setActiveOutline(freshOutline);
        } else if (!freshOutline) {
          // If active outline was deleted, go back
          handleBackToTabs();
        }
    }
  }, [outlines, activeOutline]);

  const handleGenerate = useCallback(async (generationInput: string, title: string, advancedSettings: AdvancedSettings, isTheme: boolean = false, curriculumSource?: CurriculumSource) => {
    setPreviousView(view);
    setStatus('loading');
    setError(null);
    try {
      // Use the *current* appSettings, but with the specific advanced settings for this one generation
      const settingsForGeneration = { ...appSettings, advSettings: advancedSettings };
      const result = await generateStudyOutline(generationInput, settingsForGeneration, isTheme);
      
      const newOutline: StudyOutline = {
        ...result,
        id: `outline-${Date.now()}`,
        title: title,
        createdAt: new Date().toISOString(),
        ...(curriculumSource && { curriculumSource }),
      };
      
      setOutlines(prev => [...prev, newOutline]);
      setActiveOutline(newOutline);
      setView('study');
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStatus('error');
    }
  }, [view, appSettings]);
  
  const handleUpdateDefaultAdvancedSettings = (newDefaults: AdvancedSettings) => {
      setAppSettings(prev => ({
          ...prev,
          advSettings: newDefaults,
      }));
  };

  const handleSelectOutline = (outlineId: string) => {
    const outlineToOpen = outlines.find(o => o.id === outlineId);
    if (outlineToOpen) {
      setPreviousView(view);
      setActiveOutline(outlineToOpen);
      setView('study');
    }
  };

  const handleDeleteOutline = (outlineId: string) => {
    setOutlines(prev => prev.filter(o => o.id !== outlineId));
  };
  
  const handleDeleteAllOutlines = () => {
    setOutlines([]);
    setIsSettingsOpen(false);
  }

  const handleDeleteOutlineBySource = (source: CurriculumSource) => {
    setOutlines(prev => prev.filter(o => {
        if (!o.curriculumSource) return true;
        return !(
            o.curriculumSource.subjectKey === source.subjectKey &&
            o.curriculumSource.theme === source.theme &&
            o.curriculumSource.unit === source.unit
        );
    }));
  };

  const handleRenameOutline = (outlineId: string, newTitle: string) => {
    setOutlines(prev => prev.map(o => o.id === outlineId ? { ...o, title: newTitle } : o));
  };

  const handleUpdateProgress = (objectiveId: string, isComplete: boolean) => {
    if (!activeOutline) return;
    
    setOutlines(prevOutlines => prevOutlines.map(o => {
        if (o.id === activeOutline.id) {
            const completed = new Set(o.completedObjectives);
            if (isComplete) {
                completed.add(objectiveId);
            } else {
                completed.delete(objectiveId);
            }
            return { ...o, completedObjectives: Array.from(completed) };
        }
        return o;
    }));
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
          appSettings={appSettings}
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

                <>
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
                              defaultSettings={appSettings.advSettings}
                              onUpdateDefaultSettings={handleUpdateDefaultAdvancedSettings}
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
                              defaultSettings={appSettings.advSettings}
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
                </>
            </div>
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center h-screen w-screen text-slate-200 font-sans antialiased bg-${appSettings.backgroundStyle}`}>
        <Spinner className="h-12 w-12 text-[rgba(var(--primary-rgb),1)]" />
        <p className="mt-4 text-lg text-slate-300 animate-pulse">Generating your study outline...</p>
        <p className="text-sm text-slate-400">The AI is thinking. This may take a moment.</p>
      </div>
    );
  }
  
  return (
    <div className={`h-screen w-screen text-slate-200 font-sans antialiased bg-${appSettings.backgroundStyle} overflow-hidden`}>
        {renderContent()}
        <SettingsPanel 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            appSettings={appSettings}
            onAppSettingsChange={setAppSettings}
            onClearAllData={handleDeleteAllOutlines}
        />
    </div>
  );
}