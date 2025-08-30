import React, { useState } from 'react';
import { StudyOutline, MainTopic, SubTopic, RevisionSection, LearningObjective } from '../types';
import { ItemPath } from '../App';
import Checkbox from './ui/Checkbox';
import LevelNodeIcon from './icons/LevelNodeIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import EditableText from './ui/EditableText';
import PlusCircleIcon from './icons/PlusCircleIcon';
import GripVerticalIcon from './icons/GripVerticalIcon';
import TrashIcon from './icons/TrashIcon';
import TimerIcon from './icons/TimerIcon';
import PlayIcon from './icons/PlayIcon';

type DraggedItem = {
    path: ItemPath;
    index: number;
    type: 'mainTopic' | 'subtopic' | 'objective';
}

type DropIndicatorInfo = {
    parentPath: ItemPath;
    index: number;
    type: 'mainTopic' | 'subtopic' | 'objective';
};

// Define handleGenericDragOver function type to pass as prop if needed, though closure is used here.
type HandleGenericDragOver = (
    e: React.DragEvent, 
    parentPath: ItemPath, 
    index: number, 
    type: 'mainTopic' | 'subtopic' | 'objective'
) => void;


interface SubtopicNodeProps {
  subtopic: SubTopic;
  isLast: boolean;
  mainTopicId: string;
  subtopicIndex: number;
  completedObjectives: string[];
  onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
  onUpdateItem: (path: ItemPath, newText: string) => void;
  onAddItem: (type: 'objective', path: ItemPath) => void;
  onDeleteItem: (path: ItemPath) => void;
  isEditing: boolean;
  handleDragStart: (e: React.DragEvent, item: DraggedItem) => void;
  handleGenericDragOver: HandleGenericDragOver;
  draggedItem: DraggedItem | null;
  dropIndicator: DropIndicatorInfo | null;
}

const SubtopicNode: React.FC<SubtopicNodeProps> = ({ subtopic, isLast, mainTopicId, subtopicIndex, completedObjectives, onToggleObjective, onUpdateItem, onAddItem, onDeleteItem, isEditing, handleDragStart, handleGenericDragOver, draggedItem, dropIndicator }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const totalObjectives = subtopic.learningObjectives.length;
    const completedCount = subtopic.learningObjectives.filter(obj => completedObjectives.includes(obj.id)).length;
    const isComplete = totalObjectives > 0 && completedCount === totalObjectives;
    const path = { mainTopicId, subtopicId: subtopic.id };

    const isDraggingThis = draggedItem?.type === 'subtopic' && draggedItem?.path.subtopicId === subtopic.id;

    return (
        <li className="relative pl-12 pb-10">
            {!isLast && <div className="absolute left-[18px] top-5 h-full w-px bg-gradient-to-b from-transparent via-sky-500/30 to-transparent"></div>}
            
            <div 
                className={`transition-opacity ${isDraggingThis ? 'opacity-30' : 'opacity-100'}`}
                draggable={isEditing}
                onDragStart={(e) => handleDragStart(e, { path, index: subtopicIndex, type: 'subtopic' })}
                onDragOver={(e) => handleGenericDragOver(e, { mainTopicId }, subtopicIndex, 'subtopic')}
            >
                <div className="absolute left-0 top-0">
                    <LevelNodeIcon isComplete={isComplete} />
                </div>

                <div className="relative group/subtopic">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-0" >
                            {isEditing && <GripVerticalIcon className="w-5 h-5 text-slate-600 cursor-grab flex-shrink-0" />}
                            <div className="flex-1 min-w-0" onClick={() => !isEditing && setIsExpanded(!isExpanded)}>
                                <EditableText 
                                    initialValue={subtopic.title}
                                    onSave={(newText) => onUpdateItem(path, newText)}
                                    Tag="h4"
                                    isEditable={isEditing}
                                    className={`font-semibold text-xl ${isEditing ? '' : 'cursor-pointer'} ${isComplete ? 'text-sky-400' : 'text-slate-100'}`}
                                    inputClassName="font-semibold text-xl"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {isEditing && (
                                <button onClick={() => onDeleteItem(path)} className="p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover/subtopic:opacity-100 transition-opacity">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            )}
                            <button onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? 'Collapse subtopic' : 'Expand subtopic'}>
                                <ChevronRightIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                        </div>
                    </div>
                    {totalObjectives > 0 && (
                        <p className="text-sm text-slate-500 pl-7">{completedCount} / {totalObjectives} objectives</p>
                    )}
                </div>
            </div>
            
            <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="accordion-content-inner">
                    <div className="mt-4 space-y-1 glass-panel p-5 rounded-xl">
                        <h5 className="font-semibold text-sky-400 mb-3">Learning Objectives</h5>
                        {subtopic.learningObjectives.map((obj, objIndex) => {
                             const isDraggingObjective = draggedItem?.type === 'objective' && draggedItem?.path.objectiveId === obj.id;
                             const objectivePath = { ...path, objectiveId: obj.id };
                             return (
                                <React.Fragment key={obj.id}>
                                    {dropIndicator && dropIndicator.type === 'objective' && dropIndicator.parentPath.subtopicId === subtopic.id && dropIndicator.index === objIndex && (
                                        <div className="h-1 my-1 ml-7 rounded-full bg-sky-500/80 animate-quickFadeIn" />
                                    )}
                                    <div 
                                        className={`flex items-center gap-2 transition-opacity py-1 rounded-md ${isDraggingObjective ? 'opacity-30' : 'opacity-100'}`}
                                        draggable={isEditing}
                                        onDragStart={(e) => handleDragStart(e, { path: objectivePath, index: objIndex, type: 'objective' })}
                                        onDragOver={(e) => handleGenericDragOver(e, { mainTopicId, subtopicId: subtopic.id }, objIndex, 'objective')}
                                    >
                                        {isEditing && <GripVerticalIcon className="w-5 h-5 text-slate-600 cursor-grab" />}
                                        <div className="flex-1">
                                            <Checkbox 
                                                label={obj.text}
                                                isChecked={completedObjectives.includes(obj.id)}
                                                onToggle={() => onToggleObjective(obj.id, !completedObjectives.includes(obj.id))}
                                                onLabelSave={(newText) => onUpdateItem(objectivePath, newText)}
                                                onDelete={() => onDeleteItem(objectivePath)}
                                                isEditable={isEditing}
                                            />
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        {dropIndicator && dropIndicator.type === 'objective' && dropIndicator.parentPath.subtopicId === subtopic.id && dropIndicator.index === subtopic.learningObjectives.length && (
                             <div className="h-1 my-1 ml-7 rounded-full bg-sky-500/80 animate-quickFadeIn" />
                        )}
                        {isEditing && (
                            <button 
                                onClick={() => onAddItem('objective', path)}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors pt-2 ml-7"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Add Learning Objective
                            </button>
                        )}
                        {subtopic.learningObjectives.length === 0 && !isEditing && <p className="text-sm text-slate-400">No specific objectives for this subtopic.</p>}
                    </div>
                </div>
            </div>
        </li>
    );
}

interface LevelProps {
    mainTopic: MainTopic;
    level: number;
    mainTopicIndex: number;
    completedObjectives: string[];
    onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
    onUpdateItem: (path: ItemPath, newText: string) => void;
    onAddItem: (type: 'subtopic' | 'objective', path: ItemPath) => void;
    onDeleteItem: (path: ItemPath) => void;
    isEditing: boolean;
    handleDragStart: (e: React.DragEvent, item: DraggedItem) => void;
    handleGenericDragOver: HandleGenericDragOver;
    draggedItem: DraggedItem | null;
    dropIndicator: DropIndicatorInfo | null;
    onStartSession: (topicId: string, duration: number, title: string) => void;
    onOpenTimerModal: (topic: MainTopic) => void;
}

const formatDuration = (totalMinutes: number) => {
    if (!totalMinutes || totalMinutes <= 0) return '';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    return result.trim();
};

const Level: React.FC<LevelProps> = ({ mainTopic, level, mainTopicIndex, completedObjectives, onToggleObjective, onUpdateItem, onAddItem, onDeleteItem, isEditing, handleDragStart, handleGenericDragOver, draggedItem, dropIndicator, onStartSession, onOpenTimerModal }) => {
    
    const path = { mainTopicId: mainTopic.id };
    const isDraggingThis = draggedItem?.type === 'mainTopic' && draggedItem?.path.mainTopicId === mainTopic.id;
    
    return (
        <div 
            className={`mb-10 transition-opacity ${isDraggingThis ? 'opacity-30' : 'opacity-100'}`}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(e, { path, index: mainTopicIndex, type: 'mainTopic' })}
            onDragOver={(e) => handleGenericDragOver(e, {}, mainTopicIndex, 'mainTopic')}
        >
            <div className="mb-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl group/level relative">
                <div className="flex items-center gap-2">
                    {isEditing && <GripVerticalIcon className="w-6 h-6 text-slate-600 cursor-grab" />}
                    <div>
                        <span className="text-sm font-bold text-sky-400">LEVEL {level}</span>
                        <EditableText 
                            initialValue={mainTopic.title}
                            onSave={(newText) => onUpdateItem(path, newText)}
                            Tag="h3"
                            isEditable={isEditing}
                            className="text-3xl font-bold text-white mt-1"
                            inputClassName="text-3xl font-bold"
                        />
                    </div>
                </div>
                 {isEditing && (
                    <button onClick={() => onDeleteItem(path)} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover/level:opacity-100 transition-opacity">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={() => onOpenTimerModal(mainTopic)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors px-3 py-1 rounded-full hover:bg-sky-500/10"
                        title="Set study duration"
                    >
                        <TimerIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {mainTopic.studyDuration ? formatDuration(mainTopic.studyDuration) : 'Set Time'}
                        </span>
                    </button>
                    {mainTopic.studyDuration && mainTopic.studyDuration > 0 && !isEditing && (
                        <button
                            onClick={() => onStartSession(mainTopic.id, mainTopic.studyDuration, mainTopic.title)}
                            className="flex items-center gap-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                        >
                            <PlayIcon className="w-4 h-4" />
                            Start
                        </button>
                    )}
                </div>
            </div>
            <ul>
                {mainTopic.subtopics.map((subtopic, index) => (
                    <React.Fragment key={subtopic.id}>
                        {dropIndicator && dropIndicator.type === 'subtopic' && dropIndicator.parentPath.mainTopicId === mainTopic.id && dropIndicator.index === index && (
                             <div className="h-1.5 my-2 ml-12 rounded-full bg-sky-500/80 animate-quickFadeIn" />
                        )}
                        <SubtopicNode 
                            subtopic={subtopic} 
                            isLast={index === mainTopic.subtopics.length - 1}
                            mainTopicId={mainTopic.id}
                            subtopicIndex={index}
                            completedObjectives={completedObjectives}
                            onToggleObjective={onToggleObjective}
                            onUpdateItem={onUpdateItem}
                            onAddItem={onAddItem as any}
                            onDeleteItem={onDeleteItem}
                            isEditing={isEditing}
                            handleDragStart={handleDragStart}
                            handleGenericDragOver={handleGenericDragOver}
                            draggedItem={draggedItem}
                            dropIndicator={dropIndicator}
                        />
                    </React.Fragment>
                ))}
                 {dropIndicator && dropIndicator.type === 'subtopic' && dropIndicator.parentPath.mainTopicId === mainTopic.id && dropIndicator.index === mainTopic.subtopics.length && (
                    <div className="h-1.5 my-2 ml-12 rounded-full bg-sky-500/80 animate-quickFadeIn" />
                )}
            </ul>
             {isEditing && (
                <div className="pl-12">
                    <button 
                        onClick={() => onAddItem('subtopic', path)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors"
                    >
                        <PlusCircleIcon className="w-4 h-4" />
                        Add Subtopic
                    </button>
                </div>
             )}
        </div>
    );
};

interface GamifiedStudyViewProps {
  outline: StudyOutline;
  completedObjectives: string[];
  onUpdateProgress: (objectiveId: string, isComplete: boolean) => void;
  onRevisionSelect: (section: RevisionSection) => void;
  onUpdateItem: (path: ItemPath, newText: string) => void;
  onAddItem: (type: 'mainTopic' | 'subtopic' | 'objective', path: ItemPath) => void;
  onDeleteItem: (path: ItemPath) => void;
  onReorderItem: (source: { index: number; parentPath: ItemPath, type: string }, destination: { index: number; parentPath: ItemPath, type: string }) => void;
  isEditing: boolean;
  onStartSession: (topicId: string, duration: number, title: string) => void;
  onOpenTimerModal: (topic: MainTopic) => void;
}

const GamifiedStudyView: React.FC<GamifiedStudyViewProps> = ({ outline, completedObjectives, onUpdateProgress, onRevisionSelect, onUpdateItem, onAddItem, onDeleteItem, onReorderItem, isEditing, onStartSession, onOpenTimerModal }) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorInfo | null>(null);

  const deriveParentPath = (path: ItemPath, type: string): ItemPath => {
      if (type === 'objective') {
          return { mainTopicId: path.mainTopicId, subtopicId: path.subtopicId };
      }
      if (type === 'subtopic') {
          return { mainTopicId: path.mainTopicId };
      }
      return {};
  };

  const handleDragStart = (e: React.DragEvent, item: DraggedItem) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      setDraggedItem(item);
  };

  const handleDragEnd = () => {
      setDraggedItem(null);
      setDropIndicator(null);
  };
  
  const handleGenericDragOver = (e: React.DragEvent, parentPath: ItemPath, index: number, type: 'mainTopic' | 'subtopic' | 'objective') => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedItem || draggedItem.type !== type) {
            setDropIndicator(null);
            return;
        }
        
        const sourceParentPath = deriveParentPath(draggedItem.path, draggedItem.type);
        if (JSON.stringify(sourceParentPath) !== JSON.stringify(parentPath)) {
            setDropIndicator(null);
            return;
        }
        
        const overElement = e.currentTarget as HTMLElement;
        const rect = overElement.getBoundingClientRect();
        const isAfter = e.clientY > rect.top + rect.height / 2;
        
        const dropIndex = isAfter ? index + 1 : index;

        if (dropIndex === draggedItem.index || (isAfter && dropIndex === draggedItem.index + 1)) {
            setDropIndicator(null);
        } else {
             setDropIndicator({ parentPath, index: dropIndex, type });
        }
  }

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!dropIndicator || !draggedItem) {
          handleDragEnd();
          return;
      };

      const sourceParentPath = deriveParentPath(draggedItem.path, draggedItem.type);

      let finalDropIndex = dropIndicator.index;
      if (JSON.stringify(sourceParentPath) === JSON.stringify(dropIndicator.parentPath) && draggedItem.index < dropIndicator.index) {
          finalDropIndex = dropIndicator.index - 1;
      }
      
      if (draggedItem.index === finalDropIndex && JSON.stringify(sourceParentPath) === JSON.stringify(dropIndicator.parentPath)) {
        handleDragEnd();
        return;
      }

      onReorderItem(
          { index: draggedItem.index, parentPath: sourceParentPath, type: draggedItem.type },
          { index: finalDropIndex, parentPath: dropIndicator.parentPath, type: dropIndicator.type }
      );

      handleDragEnd();
  };
  
  const mainTopics = outline.mainTopics || [];
  
  return (
    <div 
        className="w-full h-full max-w-3xl mx-auto overflow-y-auto pr-4" 
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => e.preventDefault()}
    >
        <div>
            {mainTopics.map((topic, index) => (
                <React.Fragment key={topic.id}>
                    {dropIndicator && dropIndicator.type === 'mainTopic' && JSON.stringify(dropIndicator.parentPath) === '{}' && dropIndicator.index === index && (
                         <div className="h-2 my-2 mx-1 rounded-full bg-sky-500/80 animate-quickFadeIn" />
                    )}
                    <Level 
                        mainTopic={topic}
                        level={index + 1}
                        mainTopicIndex={index}
                        completedObjectives={completedObjectives}
                        onToggleObjective={onUpdateProgress}
                        onUpdateItem={onUpdateItem}
                        onAddItem={onAddItem as any}
                        onDeleteItem={onDeleteItem}
                        isEditing={isEditing}
                        handleDragStart={handleDragStart}
                        handleGenericDragOver={handleGenericDragOver}
                        draggedItem={draggedItem}
                        dropIndicator={dropIndicator}
                        onStartSession={onStartSession}
                        onOpenTimerModal={onOpenTimerModal}
                    />
                </React.Fragment>
            ))}
            {dropIndicator && dropIndicator.type === 'mainTopic' && JSON.stringify(dropIndicator.parentPath) === '{}' && dropIndicator.index === mainTopics.length && (
                <div className="h-2 my-2 mx-1 rounded-full bg-sky-500/80 animate-quickFadeIn" />
            )}
        </div>
        {isEditing && (
            <button 
                onClick={() => onAddItem('mainTopic', {})}
                className="w-full flex items-center justify-center gap-2 py-3 my-4 text-base text-sky-400 hover:text-white transition-colors rounded-lg border-2 border-dashed border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10"
            >
                <PlusCircleIcon className="w-5 h-5" />
                Add New Level (Main Topic)
            </button>
        )}
        {/* Revision Assistant as final level */}
        {outline.revisionAssistant && !isEditing && (
            <div className="mb-8">
                <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <span className="text-sm font-bold text-amber-400">FINAL LEVEL</span>
                    <h3 className="text-3xl font-bold text-white mt-1">Revision Assistant</h3>
                </div>
                <div className="relative pl-12">
                    <div className="absolute left-0 top-0">
                        <LevelNodeIcon isComplete={false} isBoss />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onRevisionSelect('focus')} className="p-4 bg-slate-800 rounded-lg text-white font-semibold hover:bg-slate-700 transition-colors border border-slate-700 hover:border-sky-500">Focus Areas</button>
                        <button onClick={() => onRevisionSelect('questions')} className="p-4 bg-slate-800 rounded-lg text-white font-semibold hover:bg-slate-700 transition-colors border border-slate-700 hover:border-sky-500">Exam Questions</button>
                        <button onClick={() => onRevisionSelect('definitions')} className="p-4 bg-slate-800 rounded-lg text-white font-semibold hover:bg-slate-700 transition-colors border border-slate-700 hover:border-sky-500">Key Definitions</button>
                        <button onClick={() => onRevisionSelect('quick-facts')} className="p-4 bg-slate-800 rounded-lg text-white font-semibold hover:bg-slate-700 transition-colors border border-slate-700 hover:border-sky-500">Quick Facts</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default GamifiedStudyView;