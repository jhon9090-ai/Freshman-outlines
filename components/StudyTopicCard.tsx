
import React from 'react';
import { MainTopic, LearningObjective, SubTopic } from '../types';
import { ItemPath } from '../App';
import Checkbox from './ui/Checkbox';
import EditableText from './ui/EditableText';
import PlusCircleIcon from './icons/PlusCircleIcon';
import TrashIcon from './icons/TrashIcon';
import TimerIcon from './icons/TimerIcon';

interface SubtopicAccordionProps {
  subtopic: SubTopic;
  mainTopicId: string;
  completedObjectives: string[];
  onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
  onUpdateItem: (path: ItemPath, newText: string) => void;
  onAddItem: (type: 'objective', path: ItemPath) => void;
  onDeleteItem: (path: ItemPath) => void;
  isEditing: boolean;
}

const SubtopicAccordion: React.FC<SubtopicAccordionProps> = ({ subtopic, mainTopicId, completedObjectives, onToggleObjective, onUpdateItem, onAddItem, onDeleteItem, isEditing }) => (
    <details className="glass-panel rounded-xl border border-slate-800/80 open:bg-sky-500/5 open:border-sky-500/30 transition-colors duration-300 group/subtopic">
        <summary className="p-5 font-semibold text-xl text-slate-100 cursor-pointer list-none flex justify-between items-center">
            <div className="flex-1 flex items-center gap-2">
                <EditableText 
                    initialValue={subtopic.title}
                    onSave={(newText) => onUpdateItem({ mainTopicId, subtopicId: subtopic.id }, newText)}
                    Tag="span"
                    isEditable={isEditing}
                    className="flex-1"
                    inputClassName="text-xl font-semibold"
                />
                 {isEditing && (
                    <button 
                        onClick={(e) => { 
                            e.preventDefault();
                            onDeleteItem({ mainTopicId, subtopicId: subtopic.id });
                        }}
                        className="p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover/subtopic:opacity-100 transition-opacity"
                        title="Delete subtopic"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            <svg className="w-6 h-6 transition-transform duration-300 ease-out transform-gpu details-arrow text-slate-400 group-hover:text-white ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            <style>{`.details-arrow { transform: rotate(0); } details[open] .details-arrow { transform: rotate(180deg); }`}</style>
        </summary>
        <div className="accordion-content">
            <div className="accordion-content-inner animated-inner px-5 pb-5 border-t border-slate-800/80">
                <h4 className="font-semibold text-sky-400 mt-4 mb-3">Learning Objectives</h4>
                <div className="space-y-4">
                    {subtopic.learningObjectives.map((item) => {
                        const isCompleted = completedObjectives.includes(item.id);
                        return (
                            <Checkbox 
                                key={item.id} 
                                label={item.text}
                                isChecked={isCompleted}
                                onToggle={() => onToggleObjective(item.id, !isCompleted)}
                                onLabelSave={(newText) => onUpdateItem({ mainTopicId, subtopicId: subtopic.id, objectiveId: item.id }, newText)}
                                onDelete={() => onDeleteItem({ mainTopicId, subtopicId: subtopic.id, objectiveId: item.id })}
                                isEditable={isEditing}
                            />
                        );
                    })}
                    {isEditing && (
                        <button 
                            onClick={() => onAddItem('objective', { mainTopicId, subtopicId: subtopic.id })}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors"
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                            Add Learning Objective
                        </button>
                    )}
                </div>
            </div>
        </div>
    </details>
)

interface MainTopicCardProps {
  mainTopic: MainTopic;
  completedObjectives: string[];
  onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
  isEmbedded?: boolean;
  animationClass?: string;
  onUpdateItem: (path: ItemPath, newText: string) => void;
  onAddItem: (type: 'mainTopic' | 'subtopic' | 'objective', path: ItemPath) => void;
  onDeleteItem: (path: ItemPath) => void;
  isEditing: boolean;
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

const MainTopicCard: React.FC<MainTopicCardProps> = ({ mainTopic, completedObjectives, onToggleObjective, isEmbedded = false, animationClass = '', onUpdateItem, onAddItem, onDeleteItem, isEditing, onOpenTimerModal }) => {
  
  const content = (
    <>
        {!isEmbedded && 
            <div className="relative group/main mb-8 flex-shrink-0 text-center">
                <div className="flex justify-center items-center gap-3">
                    <EditableText 
                        Tag="h2"
                        initialValue={mainTopic.title}
                        onSave={(newText) => onUpdateItem({ mainTopicId: mainTopic.id }, newText)}
                        isEditable={isEditing}
                        className="text-4xl md:text-5xl font-bold text-white"
                        inputClassName="text-4xl md:text-5xl font-bold text-center"
                    />
                    {isEditing && (
                        <button
                            onClick={() => onDeleteItem({ mainTopicId: mainTopic.id })}
                            className="p-2 text-slate-500 hover:text-red-500 opacity-0 group-hover/main:opacity-100 transition-opacity"
                            title="Delete main topic"
                        >
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <button
                        onClick={() => onOpenTimerModal(mainTopic)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors px-3 py-1 rounded-full hover:bg-sky-500/10"
                        title="Set study duration"
                    >
                        <TimerIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {mainTopic.studyDuration ? formatDuration(mainTopic.studyDuration) : null}
                        </span>
                    </button>
                </div>
            </div>
        }
        <div className={`${isEmbedded ? '' : 'flex-1 space-y-4 overflow-y-auto overscroll-y-contain pr-2'}`}>
            <h3 className="text-2xl font-bold text-sky-400 mb-4">{isEmbedded ? mainTopic.title : 'Subtopics to Cover'}</h3>
            {mainTopic.subtopics.map(subtopic => (
                <SubtopicAccordion 
                    key={subtopic.id} 
                    subtopic={subtopic}
                    mainTopicId={mainTopic.id}
                    completedObjectives={completedObjectives}
                    onToggleObjective={onToggleObjective}
                    onUpdateItem={onUpdateItem}
                    onAddItem={onAddItem}
                    onDeleteItem={onDeleteItem}
                    isEditing={isEditing}
                />
            ))}
            {isEditing && (
                <button 
                    onClick={() => onAddItem('subtopic', { mainTopicId: mainTopic.id })}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-base text-sky-400 hover:text-white transition-colors rounded-lg border-2 border-dashed border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Add Subtopic
                </button>
            )}
        </div>
    </>
  );

  if (isEmbedded) {
    return <div className="mb-6">{content}</div>
  }

  return (
    <div className={`w-full max-w-5xl h-full flex flex-col glass-panel rounded-2xl p-6 md:p-8 shadow-2xl mx-auto ${animationClass}`}>
        {content}
    </div>
  );
};

export default MainTopicCard;
