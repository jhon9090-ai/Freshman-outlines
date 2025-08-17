import React from 'react';
import { MainTopic, LearningObjective, SubTopic } from '../types';
import { ItemPath } from '../App';
import Checkbox from './ui/Checkbox';
import EditableText from './ui/EditableText';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface SubtopicAccordionProps {
  subtopic: SubTopic;
  mainTopicId: string;
  completedObjectives: string[];
  onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
  onUpdateItem: (path: ItemPath, newText: string) => void;
  onAddItem: (type: 'objective', path: ItemPath) => void;
  isEditing: boolean;
}

const SubtopicAccordion: React.FC<SubtopicAccordionProps> = ({ subtopic, mainTopicId, completedObjectives, onToggleObjective, onUpdateItem, onAddItem, isEditing }) => (
    <details className="glass-panel rounded-lg border border-slate-700/50 open:bg-[rgba(var(--primary-rgb),0.1)] open:border-[rgba(var(--primary-rgb),0.5)] transition-colors duration-300">
        <summary className="p-4 font-semibold text-lg text-slate-100 cursor-pointer list-none flex justify-between items-center group">
            <EditableText 
                initialValue={subtopic.title}
                onSave={(newText) => onUpdateItem({ mainTopicId, subtopicId: subtopic.id }, newText)}
                Tag="span"
                isEditable={isEditing}
                className="flex-1"
                inputClassName="text-lg font-semibold"
            />
            <svg className="w-5 h-5 transition-transform duration-300 ease-out transform-gpu details-arrow group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            <style>{`.details-arrow { transform: rotate(0); } details[open] .details-arrow { transform: rotate(180deg); }`}</style>
        </summary>
        <div className="accordion-content">
            <div className="accordion-content-inner animated-inner px-4 pb-4 border-t border-slate-700">
                <h4 className="font-semibold text-[rgba(var(--primary-rgb),1)] mt-4 mb-3">Learning Objectives</h4>
                <div className="space-y-3">
                    {subtopic.learningObjectives.map((item) => {
                        const isCompleted = completedObjectives.includes(item.id);
                        return (
                            <Checkbox 
                                key={item.id} 
                                label={item.text}
                                isChecked={isCompleted}
                                onToggle={() => onToggleObjective(item.id, !isCompleted)}
                                onLabelSave={(newText) => onUpdateItem({ mainTopicId, subtopicId: subtopic.id, objectiveId: item.id }, newText)}
                                isEditable={isEditing}
                            />
                        );
                    })}
                    {isEditing && (
                        <button 
                            onClick={() => onAddItem('objective', { mainTopicId, subtopicId: subtopic.id })}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-[rgba(var(--primary-rgb),1)] transition-colors"
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
  isEditing: boolean;
}

const MainTopicCard: React.FC<MainTopicCardProps> = ({ mainTopic, completedObjectives, onToggleObjective, isEmbedded = false, animationClass = '', onUpdateItem, onAddItem, isEditing }) => {
  
  const content = (
    <>
        {!isEmbedded && 
            <EditableText 
                Tag="h2"
                initialValue={mainTopic.title}
                onSave={(newText) => onUpdateItem({ mainTopicId: mainTopic.id }, newText)}
                isEditable={isEditing}
                className="font-heading text-3xl md:text-4xl text-white text-center mb-6 flex-shrink-0"
                inputClassName="font-heading text-3xl md:text-4xl text-center"
            />
        }
        <div className={`${isEmbedded ? '' : 'flex-1 space-y-4 overflow-y-auto pr-2'}`}>
            <h3 className="text-xl font-bold text-[rgba(var(--primary-rgb),1)] mb-2">{isEmbedded ? mainTopic.title : 'Subtopics to Cover'}</h3>
            {mainTopic.subtopics.map(subtopic => (
                <SubtopicAccordion 
                    key={subtopic.id} 
                    subtopic={subtopic}
                    mainTopicId={mainTopic.id}
                    completedObjectives={completedObjectives}
                    onToggleObjective={onToggleObjective}
                    onUpdateItem={onUpdateItem}
                    onAddItem={onAddItem}
                    isEditing={isEditing}
                />
            ))}
            {isEditing && (
                <button 
                    onClick={() => onAddItem('subtopic', { mainTopicId: mainTopic.id })}
                    className="w-full flex items-center justify-center gap-2 py-2 mt-4 text-sm text-[rgba(var(--primary-rgb),1)] hover:text-white transition-colors rounded-lg border-2 border-dashed border-slate-700 hover:border-[rgba(var(--primary-rgb),0.5)] hover:bg-white/5"
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
    <div className={`w-full max-w-4xl h-full flex flex-col glass-panel rounded-xl p-6 md:p-8 shadow-2xl mx-auto ${animationClass}`}>
        {content}
    </div>
  );
};

export default MainTopicCard;