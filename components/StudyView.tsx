import React, { useState, useMemo, useEffect } from 'react';
import { StudyOutline, MainTopic, RevisionSection, UnitOutline, AppSettings, PartialStudyOutline } from '../types';
import { ItemPath } from '../App';
import { restructureOutline } from '../services/geminiService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import MainTopicCard from './StudyTopicCard';
import RevisionCard from './RevisionCard';
import RevisionFullScreenView from './RevisionFullScreenView';
import CompletionModal from './CompletionModal';
import GamifiedStudyView from './GamifiedStudyView';
import CardViewIcon from './icons/CardViewIcon';
import PathIcon from './icons/PathIcon';
import LevelNodeIcon from './icons/LevelNodeIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import EditableText from './ui/EditableText';
import EditIcon from './icons/EditIcon';
import AiEditPanel from './AiEditPanel';

interface StudyViewProps {
  outline: StudyOutline;
  onBack: () => void;
  onUpdateProgress: (objectiveId: string, isComplete: boolean) => void;
  appSettings: AppSettings;
  onUpdateItem: (outlineId: string, path: ItemPath, newText: string) => void;
  onAddItem: (outlineId: string, type: 'mainTopic' | 'subtopic' | 'objective', path: ItemPath, options?: { afterId?: string }) => void;
  onDeleteItem: (outlineId: string, path: ItemPath) => void;
  onReorderItem: (outlineId: string, source: { index: number; parentPath: ItemPath; type: string; }, destination: { index: number; parentPath: ItemPath, type: string }) => void;
  onUpdateOutline: (outlineId: string, newOutlineData: PartialStudyOutline) => void;
}

type StudyCard = { type: 'maintopic'; data: MainTopic } | { type: 'revision'; data: StudyOutline['revisionAssistant'] };
type ViewMode = 'card' | 'gamified';

const UnitLevelNode: React.FC<{
  unit: UnitOutline;
  isComplete: boolean;
  isLast: boolean;
  onClick: () => void;
}> = ({ unit, isComplete, isLast, onClick }) => {
    return (
        <li className="relative pl-12 pb-12">
            {!isLast && <div className="absolute left-[18px] top-5 h-full w-px bg-gradient-to-b from-transparent via-sky-500/30 to-transparent"></div>}
            
            <div className="absolute left-0 top-0">
                <LevelNodeIcon isComplete={isComplete} />
            </div>

            <button onClick={onClick} className="w-full text-left group transition-transform duration-200 hover:scale-[1.02]">
                <h4 className={`font-semibold text-2xl group-hover:text-sky-400 transition-colors ${isComplete ? 'text-sky-500' : 'text-slate-100'}`}>{unit.unitTitle}</h4>
                <p className="text-base text-slate-400 mt-1">{unit.mainTopics.length} main topics</p>
            </button>
        </li>
    );
};


const StudyView: React.FC<StudyViewProps> = ({ outline, onBack, onUpdateProgress, appSettings, onUpdateItem, onAddItem, onDeleteItem, onReorderItem, onUpdateOutline }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revisionScreen, setRevisionScreen] = useState<RevisionSection | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedUnit, setSelectedUnit] = useState<UnitOutline | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [cardAnimation, setCardAnimation] = useState('view-container-animate');
  const [viewAnimationKey, setViewAnimationKey] = useState(0);


  const activeStudyData = useMemo(() => {
    if (outline.isThemeOutline && selectedUnit) {
      // Create a temporary, partial outline object for the unit view
      return {
        ...outline,
        id: selectedUnit.id, // Use unit's ID for keys
        title: selectedUnit.unitTitle,
        mainTopics: selectedUnit.mainTopics,
        isThemeOutline: false, // Treat it as a standard outline for rendering
        units: undefined,
        revisionAssistant: selectedUnit.revisionAssistant || outline.revisionAssistant,
      };
    }
    return outline;
  }, [outline, selectedUnit]);

  // Check for overall theme completion
  useEffect(() => {
    if (outline.isThemeOutline) {
      const allObjectives = outline.units?.flatMap(u => u.mainTopics.flatMap(t => t.subtopics.flatMap(s => s.learningObjectives))).map(o => o.id) || [];
      const allCompleted = allObjectives.length > 0 && allObjectives.every(id => outline.completedObjectives.includes(id));
      if (allCompleted) {
        setShowCompletionModal(true);
      }
    }
  }, [outline.completedObjectives, outline.isThemeOutline, outline.units]);
  
  // Handle keyboard shortcut for AI panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'x') {
            event.preventDefault();
            setIsAiPanelOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // No dependencies


  const studyCards: StudyCard[] = useMemo(() => {
    const mainTopics = activeStudyData.mainTopics || [];
    const flattened: StudyCard[] = mainTopics.map(mainTopic => ({
      type: 'maintopic' as const,
      data: mainTopic,
    }));
    
    // For a single unit, the revision assistant is part of its own data.
    const revisionAssistant = selectedUnit 
        ? selectedUnit.revisionAssistant 
        : activeStudyData.isThemeOutline ? null : activeStudyData.revisionAssistant;

    if (revisionAssistant) {
       flattened.push({ type: 'revision', data: revisionAssistant });
    }
    
    return flattened;
  }, [activeStudyData, selectedUnit]);

  const totalCards = studyCards.length;
  const progressPercentage = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const handleNext = () => {
    if (currentIndex >= totalCards - 1) {
        setShowCompletionModal(true);
        return;
    }
    setCardAnimation('animate-quickFadeOut');
    setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setCardAnimation('animate-quickFadeIn');
    }, 300);
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    setCardAnimation('animate-quickFadeOut');
    setTimeout(() => {
        setCurrentIndex(i => i - 1);
        setCardAnimation('animate-quickFadeIn');
    }, 300);
  };

  const handleRevisionSelect = (section: RevisionSection) => {
      setRevisionScreen(section);
  }

  const handleAiCommand = async (command: string, fileContent?: string) => {
    try {
        const updatedOutlineData = await restructureOutline(outline, command, appSettings, fileContent, outline.sourceMaterial);
        onUpdateOutline(outline.id, updatedOutlineData);
    } catch (err) {
        console.error("AI edit failed:", err);
        // Re-throw so the AiEditPanel can handle displaying the error
        throw err;
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
      if (mode === viewMode) return;
      setViewMode(mode);
      setViewAnimationKey(k => k + 1);
  };

  const renderCardView = () => {
    if (!currentCard) return null;

    if (currentCard.type === 'maintopic') {
      return (
        <MainTopicCard 
          key={currentCard.data.id}
          mainTopic={currentCard.data}
          completedObjectives={outline.completedObjectives}
          onToggleObjective={onUpdateProgress}
          animationClass={cardAnimation}
          onUpdateItem={(path, newText) => onUpdateItem(outline.id, { unitId: selectedUnit?.id, ...path }, newText)}
          onAddItem={(type, path) => onAddItem(outline.id, type, { unitId: selectedUnit?.id, ...path })}
          onDeleteItem={(path) => onDeleteItem(outline.id, { unitId: selectedUnit?.id, ...path })}
          isEditing={isEditing}
        />
      );
    }
    if (currentCard.type === 'revision') {
      return <RevisionCard 
        key={currentIndex}
        revisionData={currentCard.data}
        onSectionSelect={handleRevisionSelect}
        animationClass={cardAnimation}
      />;
    }
    return null;
  }
  
  const handleBackAction = () => {
    if (selectedUnit) {
      setSelectedUnit(null);
      setCurrentIndex(0);
      setIsEditing(false); // Turn off edit mode when switching views
    } else {
      onBack();
    }
  }
  
  const handleAddMainTopic = () => {
    const currentCard = studyCards[currentIndex];
    let afterId: string | undefined = undefined;

    if (currentCard?.type === 'maintopic') {
        afterId = currentCard.data.id;
    }
    
    onAddItem(outline.id, 'mainTopic', { unitId: selectedUnit?.id }, { afterId });
  };


  if(showCompletionModal) {
    return <CompletionModal 
        outline={activeStudyData} 
        onClose={() => { setShowCompletionModal(false); handleBackAction(); }}
        appSettings={appSettings}
    />
  }
  
  if (revisionScreen) {
      // For a selected unit, use its specific revision assistant. For the theme overview, use the main one.
      const revisionData = selectedUnit?.revisionAssistant || outline.revisionAssistant;
      return (
        <RevisionFullScreenView 
            view={revisionScreen}
            data={revisionData}
            onClose={() => setRevisionScreen(null)}
            outlineTitle={selectedUnit?.unitTitle || outline.title}
            appSettings={appSettings}
        />
      )
  }
  
  const ViewToggleButton: React.FC<{mode: ViewMode, icon: React.ReactNode}> = ({mode, icon}) => (
      <button onClick={() => handleViewModeChange(mode)} className={`p-2 rounded-lg transition-all duration-200 ${viewMode === mode ? 'bg-sky-500 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}>
          {icon}
      </button>
  );
  
  const renderUnitSelectionView = () => (
    <div key="unit-selection" className="flex flex-col h-full w-full p-4 sm:p-6 md:p-8 animate-fadeInUp">
        <header className="flex-shrink-0 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between items-start">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" /> Back to Main
            </button>
            <div className="text-left sm:text-right w-full sm:w-2/3">
              <EditableText 
                  Tag="h1"
                  initialValue={outline.title}
                  onSave={(newText) => onUpdateItem(outline.id, {}, newText)}
                  isEditable={false} // Title not editable in this view
                  className="text-3xl md:text-4xl font-bold text-white truncate"
                  inputClassName="text-3xl md:text-4xl font-bold"
              />
              <p className="text-slate-400 text-lg">{outline.subject}</p>
            </div>
          </div>
        </header>
        <main className="w-full h-full max-w-4xl mx-auto overflow-y-auto pr-4">
           <h2 className="text-3xl font-bold text-center mb-12">Theme Progression</h2>
            <ul>
              {(outline.units || []).map((unit, index, arr) => {
                const allUnitObjectives = unit.mainTopics.flatMap(t => t.subtopics.flatMap(s => s.learningObjectives)).map(o => o.id);
                const completedUnitObjectives = allUnitObjectives.filter(id => outline.completedObjectives.includes(id));
                const isComplete = allUnitObjectives.length > 0 && completedUnitObjectives.length === allUnitObjectives.length;
                return (
                  <UnitLevelNode
                    key={unit.id}
                    unit={unit}
                    isComplete={isComplete}
                    isLast={index === arr.length - 1}
                    onClick={() => setSelectedUnit(unit)}
                  />
                );
              })}

              {/* Theme Revision Assistant as final level */}
              <li className="relative pl-12 pb-8">
                <div className="absolute left-0 top-0">
                    <LevelNodeIcon isComplete={false} isBoss />
                </div>
                <button onClick={() => handleRevisionSelect('focus')} className="w-full text-left group transition-transform duration-200 hover:scale-[1.02]">
                    <h4 className="font-semibold text-2xl text-amber-300 group-hover:text-amber-200 transition-colors">Theme Revision Assistant</h4>
                    <p className="text-base text-slate-400 mt-1">Review the entire theme</p>
                </button>
              </li>
            </ul>
        </main>
    </div>
  );

  const currentCard = studyCards[currentIndex];

  const renderStudyContentView = () => (
    <div key={selectedUnit ? selectedUnit.id : 'main-outline'} className="flex flex-col h-full w-full p-4 sm:p-6 md:p-8 animate-fadeIn relative">
      <header className="flex-shrink-0 mb-4 relative">
        <div className="flex flex-wrap items-center justify-between gap-y-4">
          <button onClick={handleBackAction} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors order-1">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{selectedUnit ? `Back to Theme` : 'Back to Main'}</span>
          </button>
          
          <div className="order-3 sm:order-2 w-full sm:w-auto flex justify-center">
            <div className="flex items-center gap-2 bg-slate-900/70 p-1.5 rounded-xl border border-slate-700">
                <ViewToggleButton mode="card" icon={<CardViewIcon className="w-5 h-5"/>} />
                <ViewToggleButton mode="gamified" icon={<PathIcon className="w-5 h-5"/>} />
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button 
                  onClick={() => setIsEditing(prev => !prev)}
                  className={`p-2 rounded-lg transition-all duration-200 ${isEditing ? 'bg-sky-500 text-white ring-2 ring-offset-2 ring-offset-slate-950 ring-sky-500' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
                  title={isEditing ? "Finish Editing" : "Edit Outline"}
                >
                  <EditIcon className="w-5 h-5"/>
                </button>
            </div>
          </div>

          <div className="text-right order-2 sm:order-3">
            <EditableText 
                Tag="h1"
                initialValue={activeStudyData.title}
                onSave={(newText) => onUpdateItem(outline.id, {}, newText)}
                isEditable={isEditing}
                className="text-2xl font-bold text-white truncate"
                inputClassName="text-2xl font-bold"
            />
            <p className="text-slate-400">{activeStudyData.subject}</p>
          </div>
        </div>
        {viewMode === 'card' && (
            <div className="w-full bg-slate-800 rounded-full h-2 mt-6">
            <div 
                className="bg-sky-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
            ></div>
            </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center pt-4 md:pt-8 overflow-hidden">
        <div key={viewAnimationKey} className="w-full h-full view-container-animate">
          {viewMode === 'card' ? renderCardView() : (
            <GamifiedStudyView 
              outline={activeStudyData} 
              completedObjectives={outline.completedObjectives}
              onUpdateProgress={onUpdateProgress} 
              onRevisionSelect={handleRevisionSelect} 
              onUpdateItem={(path, newText) => onUpdateItem(outline.id, { unitId: selectedUnit?.id, ...path }, newText)}
              onAddItem={(type, path) => onAddItem(outline.id, type, { unitId: selectedUnit?.id, ...path })}
              onDeleteItem={(path) => onDeleteItem(outline.id, { unitId: selectedUnit?.id, ...path })}
              onReorderItem={(source, dest) => onReorderItem(outline.id, { ...source, parentPath: { unitId: selectedUnit?.id, ...source.parentPath }}, { ...dest, parentPath: { unitId: selectedUnit?.id, ...dest.parentPath }})}
              isEditing={isEditing}
            />
          )}
        </div>
      </main>

      <div className={`transition-all duration-500 ease-in-out ${isAiPanelOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
          <AiEditPanel onCommand={handleAiCommand} />
      </div>


      {viewMode === 'card' && (
        <footer className="flex-shrink-0 flex flex-col items-center pt-6 w-full max-w-4xl mx-auto">
            {isEditing && (
                <button 
                    onClick={handleAddMainTopic}
                    className="w-full flex items-center justify-center gap-2 py-3 mb-4 text-base text-sky-400 hover:text-white transition-colors rounded-lg border-2 border-dashed border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Add Main Topic
                </button>
            )}
            <div className="flex justify-between items-center w-full">
                <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0}
                className="bg-slate-800 text-white font-semibold py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                Previous
                </button>
                <span className="text-slate-300 font-medium">
                {totalCards > 0 ? `Topic ${currentIndex + 1} / ${totalCards}` : '0 / 0'}
                </span>
                <button 
                onClick={handleNext} 
                className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                >
                {currentIndex >= totalCards - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </footer>
      )}
    </div>
  );
  
  if (outline.isThemeOutline && !selectedUnit) {
      return renderUnitSelectionView();
  }

  return renderStudyContentView();
};

export default StudyView;