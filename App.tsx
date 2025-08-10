
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from './services/dataService';
import { StudyOutline, AppStatus, AppView, AdvancedSettings, CurriculumSource, FirebaseConfig } from './types';
import { generateStudyOutline } from './services/geminiService';
import { initializeFirebase, onAuthChange, addOutline, updateOutline, deleteOutline, deleteOutlineBySource, onOutlinesUpdate } from './services/dataService';
import InputPanel from './components/InputPanel';
import StudyView from './components/StudyView';
import Spinner from './components/ui/Spinner';
import CurriculumView from './components/CurriculumView';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import SettingsIcon from './components/icons/SettingsIcon';
import LoginPrompt from './components/LoginPrompt';

const SETTINGS_STORAGE_KEY = 'app-settings';

interface AppSettings {
  theme: string;
  advSettings: AdvancedSettings;
  geminiApiKey: string;
  firebaseConfig: FirebaseConfig;
}

const defaultSettings: AppSettings = {
  theme: 'purple',
  advSettings: {
    outlineDepth: 'Standard',
    learningGoals: '',
    studyPace: 'Moderate',
    subjectEmphasis: '',
  },
  geminiApiKey: '',
  firebaseConfig: {
    apiKey: "AIzaSyDT0p9EYECuFJqT5C26Q7J_PD5r265f_hU",
    authDomain: "intelligent-study-outlines.firebaseapp.com",
    projectId: "intelligent-study-outlines",
    storageBucket: "intelligent-study-outlines.appspot.com",
    messagingSenderId: "637509822315",
    appId: "1:637509822315:web:cb2babf49e88c8824f8e2e",
  }
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
  
  // Auth and Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);


  // Load settings from localStorage on initial mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        // Merge saved settings with defaults to avoid breakages if shape changes
        const parsed = JSON.parse(savedSettings);
        setAppSettings(prev => ({ ...prev, ...parsed, firebaseConfig: defaultSettings.firebaseConfig })); // always use hardcoded firebase config
      }
    } catch (e) {
      console.error("Failed to load settings from storage", e);
    }
  }, []);
  
  // Apply theme and save settings when they change
  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add('dark', `theme-${appSettings.theme}`);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));

    // Initialize Firebase when config changes
    const services = initializeFirebase(appSettings.firebaseConfig);
    setFirebaseInitialized(!!services);
  }, [appSettings]);


  // Listen to auth changes and fetch data
  useEffect(() => {
    if (!firebaseInitialized) return;

    const authUnsubscribe = onAuthChange(newUser => {
        setUser(newUser);
        if (!newUser) {
            setOutlines([]); // Clear data on logout
        }
    });
    
    let outlinesUnsubscribe: () => void = () => {};
    if (user) {
        outlinesUnsubscribe = onOutlinesUpdate(user.uid, setOutlines, (err) => {
            console.error(err);
            setError("Could not sync your outlines. Check your connection or Firestore rules.");
        });
    }

    return () => {
        authUnsubscribe();
        outlinesUnsubscribe();
    }
  }, [user, firebaseInitialized]);

  useEffect(() => {
    if (activeOutline) {
        const freshOutline = outlines.find(o => o.id === activeOutline.id);
        if (freshOutline && JSON.stringify(freshOutline) !== JSON.stringify(activeOutline)) {
            setActiveOutline(freshOutline);
        }
    }
  }, [outlines, activeOutline]);

  const handleGenerate = useCallback(async (generationInput: string, title: string, advancedSettings: AdvancedSettings, isTheme: boolean = false, curriculumSource?: CurriculumSource) => {
    if (!user) {
        setError("You must be logged in to generate outlines.");
        return;
    }
    setPreviousView(view);
    setStatus('loading');
    setError(null);
    try {
      const result = await generateStudyOutline(generationInput, advancedSettings, isTheme);
      const newOutline: Omit<StudyOutline, 'id'> = {
        ...result,
        title: title,
        createdAt: new Date().toISOString(),
        curriculumSource: curriculumSource,
      };
      
      const addedOutline = await addOutline(user.uid, newOutline);
      setActiveOutline(addedOutline);
      setView('study');
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStatus('error');
    }
  }, [outlines, view, user]);

  const handleSelectOutline = (outlineId: string) => {
    const outlineToOpen = outlines.find(o => o.id === outlineId);
    if (outlineToOpen) {
      setPreviousView(view);
      setActiveOutline(outlineToOpen);
      setView('study');
    }
  };

  const handleDeleteOutline = (outlineId: string) => {
    if (!user) return;
    deleteOutline(user.uid, outlineId);
  };
  
  const handleDeleteAllOutlines = () => {
    if(!user) return;
    outlines.forEach(outline => deleteOutline(user.uid, outline.id));
    setIsSettingsOpen(false); // Close panel after action
  }

  const handleDeleteOutlineBySource = (source: CurriculumSource) => {
    if (!user) return;
    deleteOutlineBySource(user.uid, source);
  };

  const handleRenameOutline = (outlineId: string, newTitle: string) => {
    if (!user) return;
    updateOutline(user.uid, outlineId, { title: newTitle });
  };

  const handleUpdateProgress = (objectiveId: string, isComplete: boolean) => {
    if (!activeOutline || !user) return;
    
    const completed = new Set(activeOutline.completedObjectives);
    if (isComplete) {
        completed.add(objectiveId);
    } else {
        completed.delete(objectiveId);
    }
    updateOutline(user.uid, activeOutline.id, { completedObjectives: Array.from(completed) });
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

                {!user && firebaseInitialized && <LoginPrompt onOpenSettings={() => setIsSettingsOpen(true)}/>}

                {user && (
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
                )}
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
            appSettings={appSettings}
            onAppSettingsChange={setAppSettings}
            onClearAllData={handleDeleteAllOutlines}
            user={user}
            firebaseInitialized={firebaseInitialized}
        />
    </div>
  );
}