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
  onAddItem: (outlineId: string, type: 'mainTopic' | 'subtopic' | 'objective', path: ItemPath) => void;
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
        <li className="relative pl-12 pb-10">
            {!isLast && <div className="absolute left-[18px] top-5 h-full w-px bg-gradient-to-b from-transparent via-[rgba(var(--primary-rgb),0.4)] to-transparent"></div>}
            
            <div className="absolute left-0 top-0">
                <LevelNodeIcon isComplete={isComplete} />
            </div>

            <button onClick={onClick} className="w-full text-left group transition-transform duration-200 hover:scale-[1.02]">
                <h4 className={`font-semibold text-xl group-hover:text-[rgba(var(--primary-rgb),0.8)] transition-colors ${isComplete ? 'text-[rgba(var(--primary-rgb),1)]' : 'text-slate-200'}`}>{unit.unitTitle}</h4>
                <p className="text-sm text-slate-400 mt-1">{unit.mainTopics.length} main topics</p>
            </button>
        </li>
    );
};


const StudyView: React.FC<StudyViewProps> = ({ outline, onBack, onUpdateProgress, appSettings, onUpdateItem, onAddItem, onUpdateOutline }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revisionScreen, setRevisionScreen] = useState<RevisionSection | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedUnit, setSelectedUnit] = useState<UnitOutline | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

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
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowCompletionModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
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

  const renderCardView = () => {
    if (!currentCard) return null;

    if (currentCard.type === 'maintopic') {
      return (
        <MainTopicCard 
          key={currentCard.data.id}
          mainTopic={currentCard.data}
          completedObjectives={outline.completedObjectives}
          onToggleObjective={onUpdateProgress}
          animationClass="animate-fadeInUp"
          onUpdateItem={(path, newText) => onUpdateItem(outline.id, { unitId: selectedUnit?.id, ...path }, newText)}
          onAddItem={(type, path) => onAddItem(outline.id, type, { unitId: selectedUnit?.id, ...path })}
          isEditing={isEditing}
        />
      );
    }
    if (currentCard.type === 'revision') {
      return <RevisionCard 
        key={currentIndex}
        revisionData={currentCard.data}
        onSectionSelect={handleRevisionSelect}
        animationClass="animate-fadeInUp"
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
    onAddItem(outline.id, 'mainTopic', { unitId: selectedUnit?.id });
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
      <button onClick={() => setViewMode(mode)} className={`p-2 rounded-md transition-all duration-200 hover:scale-110 active:scale-100 ${viewMode === mode ? 'bg-[rgba(var(--primary-rgb),1)] text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
          {icon}
      </button>
  );
  
  const renderUnitSelectionView = () => (
    <div key="unit-selection" className="flex flex-col h-full w-full p-6 animate-fadeInUp">
        <header className="flex-shrink-0 mb-4">
          <div className="flex justify-between items-start">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" /> Back to Main
            </button>
            <div className="text-right w-2/3">
              <EditableText 
                  Tag="h1"
                  initialValue={outline.title}
                  onSave={(newText) => onUpdateItem(outline.id, {}, newText)}
                  isEditable={false} // Title not editable in this view
                  className="text-2xl font-bold text-white truncate"
                  inputClassName="text-2xl font-bold"
              />
              <p className="text-slate-400">{outline.subject}</p>
            </div>
          </div>
        </header>
        <main className="w-full h-full max-w-3xl mx-auto overflow-y-auto pr-4">
           <h2 className="font-heading text-3xl text-center mb-8">Theme Progression</h2>
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
                    <h4 className="font-semibold text-xl text-amber-300 group-hover:text-amber-200 transition-colors">Theme Revision Assistant</h4>
                    <p className="text-sm text-slate-400 mt-1">Review the entire theme</p>
                </button>
              </li>
            </ul>
        </main>
    </div>
  );

  const currentCard = studyCards[currentIndex];

  const renderStudyContentView = () => (
    <div key={selectedUnit ? selectedUnit.id : 'main-outline'} className="flex flex-col h-full w-full p-6 animate-fadeIn">
      <header className="flex-shrink-0 mb-4 relative">
        <div className="flex justify-between items-center">
          <button onClick={handleBackAction} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors z-10">
            <ArrowLeftIcon className="w-5 h-5" /> {selectedUnit ? `Back to Theme` : 'Back to Main'}
          </button>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-white/10">
              <ViewToggleButton mode="card" icon={<CardViewIcon className="w-5 h-5"/>} />
              <ViewToggleButton mode="gamified" icon={<PathIcon className="w-5 h-5"/>} />
              <div className="w-px h-5 bg-white/20 mx-1"></div>
              <button 
                onClick={() => setIsEditing(prev => !prev)}
                className={`p-2 rounded-md transition-all duration-200 ${isEditing ? 'bg-[rgba(var(--primary-rgb),1)] text-white ring-2 ring-offset-2 ring-offset-slate-900 ring-[rgba(var(--primary-rgb),1)]' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                title={isEditing ? "Finish Editing" : "Edit Outline"}
              >
                <EditIcon className="w-5 h-5"/>
              </button>
          </div>

          <div className="text-right w-1/3 z-10">
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
            <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
            <div 
                className="bg-gradient-to-r from-[rgba(var(--primary-rgb),0.7)] to-[rgba(var(--primary-rgb),1)] h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
            ></div>
            </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center overflow-hidden">
        {viewMode === 'card' ? renderCardView() : (
          <div key="gamified-view" className="w-full h-full animate-fadeInUp">
            <GamifiedStudyView 
              outline={activeStudyData} 
              completedObjectives={outline.completedObjectives}
              onUpdateProgress={onUpdateProgress} 
              onRevisionSelect={handleRevisionSelect} 
              onUpdateItem={(path, newText) => onUpdateItem(outline.id, { unitId: selectedUnit?.id, ...path }, newText)}
              onAddItem={(type, path) => onAddItem(outline.id, type, { unitId: selectedUnit?.id, ...path })}
              isEditing={isEditing}
            />
          </div>
        )}
      </main>

      {isAiPanelOpen && <AiEditPanel onCommand={handleAiCommand} />}

      {viewMode === 'card' && (
        <footer className="flex-shrink-0 flex flex-col items-center mt-4 w-full max-w-4xl mx-auto">
            {isEditing && (
                <button 
                    onClick={handleAddMainTopic}
                    className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-sm text-[rgba(var(--primary-rgb),1)] hover:text-white transition-colors rounded-lg border-2 border-dashed border-slate-700 hover:border-[rgba(var(--primary-rgb),0.5)] hover:bg-white/5"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Add Main Topic
                </button>
            )}
            <div className="flex justify-between items-center w-full">
                <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0}
                className="bg-white/10 text-white font-semibold py-2 px-6 rounded-md hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                Previous
                </button>
                <span className="text-slate-300 font-medium">
                {totalCards > 0 ? `Topic ${currentIndex + 1} / ${totalCards}` : '0 / 0'}
                </span>
                <button 
                onClick={handleNext} 
                className="bg-gradient-to-r from-[rgba(var(--primary-rgb),0.8)] to-[rgba(var(--primary-rgb),1)] text-white font-bold py-2 px-6 rounded-lg hover:from-[rgba(var(--primary-rgb),1)] hover:to-[rgba(var(--primary-rgb),0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
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
