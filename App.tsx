
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudyOutline, AppStatus, AppView, AdvancedSettings, AppSettings, CurriculumSource, MainTopic, SubTopic, LearningObjective, UnitOutline, PartialStudyOutline } from './types';
import { generateStudyOutline } from './services/geminiService';
import InputPanel from './components/InputPanel';
import StudyView from './components/StudyView';
import Spinner from './components/ui/Spinner';
import CurriculumView from './components/CurriculumView';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import SettingsIcon from './components/icons/SettingsIcon';
import BookOpenIcon from './components/icons/BookOpenIcon';
import ZapIcon from './components/icons/ZapIcon';
import StarIcon from './components/icons/StarIcon';
import BookmarkIcon from './components/icons/BookmarkIcon';

const SETTINGS_STORAGE_KEY = 'app-settings';
const OUTLINES_STORAGE_KEY = 'app-outlines';

export interface ItemPath {
  unitId?: string;
  mainTopicId?: string;
  subtopicId?: string;
  objectiveId?: string;
}

const defaultSettings: AppSettings = {
  notionApiKey: '',
  notionExportFormat: 'Normal',
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

const NavButton: React.FC<{
  viewId: AppView;
  currentView: AppView;
  onClick: (viewId: AppView) => void;
  icon: React.ReactNode;
}> = ({ viewId, currentView, onClick, icon }) => (
  <button
    onClick={() => onClick(viewId)}
    className={`relative flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 ease-in-out
      ${currentView === viewId ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
  >
    {icon}
  </button>
);


const BottomNavBar: React.FC<{
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onSettingsClick: () => void;
}> = ({ currentView, onViewChange, onSettingsClick }) => {
  return (
    <div className="glass-panel rounded-full p-2 flex items-center gap-2 shadow-2xl">
      <NavButton viewId="curriculum" currentView={currentView} onClick={onViewChange} icon={<BookOpenIcon className="w-6 h-6" />} />
      <NavButton viewId="create" currentView={currentView} onClick={onViewChange} icon={<ZapIcon className="w-6 h-6" />} />
      <NavButton viewId="outlines" currentView={currentView} onClick={onViewChange} icon={<BookmarkIcon className="w-6 h-6" />} />
      <div className="w-px h-8 bg-white/10 mx-2"></div>
      <button
        onClick={onSettingsClick}
        className="relative flex items-center justify-center h-12 w-12 rounded-full transition-all text-slate-400 hover:text-white"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>
    </div>
  );
};


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

  const [isNavBarVisible, setIsNavBarVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Effect to persist outlines to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(OUTLINES_STORAGE_KEY, JSON.stringify(outlines));
    } catch (e) {
      console.error("Failed to save outlines to storage", e);
    }
  }, [outlines]);
  
  // Effect to persist settings
  useEffect(() => {
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

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    
    const currentScrollY = target.scrollTop;
    const scrollThreshold = 100;

    // Show if scrolling up OR if scrolled back to top
    if (currentScrollY < lastScrollY.current || currentScrollY <= scrollThreshold) {
        setIsNavBarVisible(true);
    }
    // Hide if scrolling down AND past the threshold
    else if (currentScrollY > lastScrollY.current && currentScrollY > scrollThreshold) {
        setIsNavBarVisible(false);
    }
    
    lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
  }, []);

  useEffect(() => {
    if (view === 'study') {
      return; // The nav bar is always hidden in study view, no listener needed.
    }

    const scrollContainer = document.querySelector('.view-is-active .overflow-y-auto');
    
    if (scrollContainer) {
        lastScrollY.current = scrollContainer.scrollTop;
        setIsNavBarVisible(true); // Always show on view change
        
        scrollContainer.addEventListener('scroll', handleScroll);
        
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }
  }, [view, handleScroll]);

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
        sourceMaterial: generationInput,
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

  const handleUpdateOutlineItem = useCallback((
    outlineId: string,
    path: ItemPath,
    newText: string
  ) => {
    setOutlines(prev =>
      prev.map(outline => {
        if (outline.id !== outlineId) return outline;
  
        const newOutline = { ...outline }; 
  
        const findAndUpdate = (topics: MainTopic[]): MainTopic[] => {
            return topics.map(mt => {
                if (mt.id !== path.mainTopicId) return mt;

                if (!path.subtopicId && path.mainTopicId) {
                    return { ...mt, title: newText };
                }

                const newSubtopics = mt.subtopics.map(st => {
                    if (st.id !== path.subtopicId) return st;

                    if (!path.objectiveId) {
                        return { ...st, title: newText };
                    }

                    const newObjectives = st.learningObjectives.map(obj => {
                        if (obj.id !== path.objectiveId) return obj;
                        return { ...obj, text: newText };
                    });
                    return { ...st, learningObjectives: newObjectives };
                });
                return { ...mt, subtopics: newSubtopics };
            });
        };

        if (newOutline.isThemeOutline && path.unitId) {
            newOutline.units = (newOutline.units || []).map(unit => {
                if (unit.id !== path.unitId) return unit;
                const newMainTopics = findAndUpdate(unit.mainTopics);
                return { ...unit, mainTopics: newMainTopics };
            });
        } else if (!newOutline.isThemeOutline && path.mainTopicId) {
            newOutline.mainTopics = findAndUpdate(newOutline.mainTopics || []);
        } else if (!path.mainTopicId && !path.unitId) { // Editing main outline title
            return { ...newOutline, title: newText };
        }

        return newOutline;
      })
    );
  }, []);

  const handleAddOutlineItem = useCallback((
      outlineId: string,
      type: 'mainTopic' | 'subtopic' | 'objective',
      path: ItemPath,
      options?: { afterId?: string }
  ) => {
      setOutlines(prev => prev.map(outline => {
          if (outline.id !== outlineId) return outline;

          const newOutline = JSON.parse(JSON.stringify(outline)); // Deep copy

          const newMainTopic: MainTopic = { id: `main-${Date.now()}`, title: 'New Main Topic', subtopics: [] };
          const newSubTopic: SubTopic = { id: `sub-${Date.now()}`, title: 'New Subtopic', learningObjectives: [] };
          const newObjective: LearningObjective = { id: `obj-${Date.now()}`, text: 'New Learning Objective' };

          let targetMainTopics: MainTopic[] | undefined;
          if (newOutline.isThemeOutline && path.unitId) {
              const unit = (newOutline.units as UnitOutline[] | undefined)?.find(u => u.id === path.unitId);
              targetMainTopics = unit?.mainTopics;
          } else {
              targetMainTopics = newOutline.mainTopics;
          }

          if (!targetMainTopics) return outline; // Should not happen

          switch (type) {
              case 'mainTopic':
                  if (options?.afterId) {
                      const index = targetMainTopics.findIndex(mt => mt.id === options.afterId);
                      if (index > -1) {
                          targetMainTopics.splice(index + 1, 0, newMainTopic);
                      } else {
                          targetMainTopics.push(newMainTopic);
                      }
                  } else {
                      targetMainTopics.push(newMainTopic);
                  }
                  break;
              
              case 'subtopic':
                  if (path.mainTopicId) {
                      const mainTopic = targetMainTopics.find(mt => mt.id === path.mainTopicId);
                      if (mainTopic) mainTopic.subtopics.push(newSubTopic);
                  }
                  break;
              
              case 'objective':
                  if (path.mainTopicId && path.subtopicId) {
                      const mainTopic = targetMainTopics.find(mt => mt.id === path.mainTopicId);
                      const subTopic = mainTopic?.subtopics.find(st => st.id === path.subtopicId);
                      if (subTopic) subTopic.learningObjectives.push(newObjective);
                  }
                  break;
          }
          
          return newOutline;
      }));
  }, []);
  
  const handleDeleteOutlineItem = useCallback((outlineId: string, path: ItemPath) => {
    setOutlines(prev => prev.map(outline => {
        if (outline.id !== outlineId) return outline;
        
        const newOutline = JSON.parse(JSON.stringify(outline));

        let topicsList: MainTopic[] | undefined;
        if (newOutline.isThemeOutline && path.unitId) {
            const unit = (newOutline.units as UnitOutline[] | undefined)?.find(u => u.id === path.unitId);
            topicsList = unit?.mainTopics;
        } else {
            topicsList = newOutline.mainTopics;
        }

        if (!topicsList) return outline;

        if (path.mainTopicId && !path.subtopicId) { // Delete Main Topic
            const newTopics = topicsList.filter(mt => mt.id !== path.mainTopicId);
            if (newOutline.isThemeOutline && path.unitId) {
                const unit = (newOutline.units as UnitOutline[]).find(u => u.id === path.unitId)!;
                unit.mainTopics = newTopics;
            } else {
                newOutline.mainTopics = newTopics;
            }
            return newOutline;
        }

        const mainTopic = topicsList.find(mt => mt.id === path.mainTopicId);
        if (!mainTopic) return outline;

        if (path.subtopicId && !path.objectiveId) { // Delete Subtopic
            mainTopic.subtopics = mainTopic.subtopics.filter(st => st.id !== path.subtopicId);
            return newOutline;
        }

        if (path.objectiveId) { // Delete Objective
            const subTopic = mainTopic.subtopics.find(st => st.id === path.subtopicId);
            if (subTopic) {
                subTopic.learningObjectives = subTopic.learningObjectives.filter(obj => obj.id !== path.objectiveId);
            }
            return newOutline;
        }
        
        return outline; // Fallback
    }));
  }, []);

  const handleReorderOutlineItem = useCallback((
    outlineId: string,
    source: { index: number; parentPath: ItemPath, type: string },
    destination: { index: number; parentPath: ItemPath, type: string }
  ) => {
    // Only support reordering within the same parent list
    if (JSON.stringify(source.parentPath) !== JSON.stringify(destination.parentPath)) return;

    setOutlines(prev => prev.map(outline => {
        if (outline.id !== outlineId) return outline;

        const newOutline = JSON.parse(JSON.stringify(outline));
        let list: any[] | undefined;
        
        let topicsList = newOutline.mainTopics || [];
        if (newOutline.isThemeOutline && source.parentPath.unitId) {
            const unit = (newOutline.units as UnitOutline[])?.find(u => u.id === source.parentPath.unitId);
            topicsList = unit?.mainTopics || [];
        }

        if (source.type === 'objective') {
            const mainTopic = topicsList.find(mt => mt.id === source.parentPath.mainTopicId);
            const subTopic = mainTopic?.subtopics.find(st => st.id === source.parentPath.subtopicId);
            list = subTopic?.learningObjectives;
        } else if (source.type === 'subtopic') {
            const mainTopic = topicsList.find(mt => mt.id === source.parentPath.mainTopicId);
            list = mainTopic?.subtopics;
        } else if (source.type === 'mainTopic') {
            list = topicsList;
        }

        if (list) {
            const [removed] = list.splice(source.index, 1);
            list.splice(destination.index, 0, removed);
        }
        
        return newOutline;
    }));
  }, []);

  const handleUpdateOutline = useCallback((
    outlineId: string,
    newOutlineData: Partial<StudyOutline>
  ) => {
    setOutlines(prev =>
      prev.map(o => {
        if (o.id === outlineId) {
          // Merge new data, but preserve critical client-side state
          return {
            ...o,
            ...newOutlineData,
            id: o.id,
            createdAt: o.createdAt,
            completedObjectives: o.completedObjectives,
            curriculumSource: o.curriculumSource,
            sourceMaterial: o.sourceMaterial,
          };
        }
        return o;
      })
    );
  }, []);

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
  
  const handleNavChange = (newView: AppView) => {
    if (newView !== 'curriculum') {
      setSelectedSubjectKey(null);
    }
    setView(newView);
  }

  const renderContent = () => {
    if (view === 'study' && activeOutline) {
      return (
        <div className="h-full w-full view-container-animate">
            <StudyView
              outline={activeOutline}
              appSettings={appSettings}
              onBack={handleBackToTabs}
              onUpdateProgress={handleUpdateProgress}
              onUpdateItem={handleUpdateOutlineItem}
              onAddItem={handleAddOutlineItem}
              onDeleteItem={handleDeleteOutlineItem}
              onReorderItem={handleReorderOutlineItem}
              onUpdateOutline={handleUpdateOutline}
            />
        </div>
      );
    }
    
    const viewOrder: AppView[] = ['curriculum', 'create', 'outlines'];
    const activeIndex = viewOrder.indexOf(view);

    const viewComponents: Record<AppView, React.ReactNode> = {
        curriculum: (
            <CurriculumView
                onGenerate={handleGenerate}
                outlines={outlines}
                onSelectOutline={handleSelectOutline}
                onDeleteOutlineBySource={handleDeleteOutlineBySource}
                selectedSubjectKey={selectedSubjectKey}
                setSelectedSubjectKey={setSelectedSubjectKey}
                defaultSettings={appSettings.advSettings}
            />
        ),
        create: (
            <InputPanel
                onGenerate={handleGenerate}
                status={status}
                error={error}
                onClearError={() => setError(null)}
                defaultSettings={appSettings.advSettings}
                onUpdateDefaultSettings={handleUpdateDefaultAdvancedSettings}
            />
        ),
        outlines: (
            <Dashboard 
                outlines={outlines}
                onSelectOutline={handleSelectOutline}
                onDeleteOutline={handleDeleteOutline}
                onRenameOutline={handleRenameOutline}
                appSettings={appSettings}
            />
        ),
        study: null, // 'study' is handled separately
    };

    return (
        <div className="flex flex-col items-center justify-start w-full h-full p-4 md:p-8 overflow-x-hidden">
            <div className={`w-full max-w-5xl h-full flex flex-col transition-all duration-300 ${selectedSubjectKey && view === 'curriculum' ? 'max-w-full' : ''}`}>
                 <header className={`transition-all duration-500 ease-in-out overflow-hidden ${view === 'study' ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
                    <div className="w-full text-center mb-4 md:mb-12">
                        <h1 className="text-4xl lg:text-5xl font-bold text-white bg-gradient-to-b from-white to-slate-400 text-transparent bg-clip-text">
                          Intelligent Outlines
                        </h1>
                    </div>
                </header>

                <div className="flex-1 relative overflow-hidden">
                    {viewOrder.map((viewId, index) => {
                        let viewClass = '';
                        if (index === activeIndex) {
                            viewClass = 'view-is-active';
                        } else if (index < activeIndex) {
                            viewClass = 'view-is-before';
                        } else {
                            viewClass = 'view-is-after';
                        }

                        return (
                            <div key={viewId} className={`view-container ${viewClass}`}>
                                <div className="h-full w-full overflow-y-auto overflow-x-hidden pr-2">
                                    {viewComponents[viewId]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center h-screen w-screen text-slate-200 antialiased`}>
        <Spinner className="h-12 w-12 text-sky-500" />
        <p className="mt-4 text-lg text-slate-300 animate-pulse">Generating your study outline...</p>
        <p className="text-sm text-slate-400">The AI is thinking. This may take a moment.</p>
      </div>
    );
  }
  
  const isNavBarHidden = view === 'study' || !isNavBarVisible;

  return (
    <div className={`h-screen w-screen text-slate-300 antialiased overflow-hidden`}>
        {renderContent()}
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-in-out ${isNavBarHidden ? 'opacity-0 translate-y-24 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <BottomNavBar
            currentView={view}
            onViewChange={handleNavChange}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
        </div>
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
