
import React, { useState } from 'react';
import { StudyOutline, MainTopic, SubTopic, RevisionSection, LearningObjective } from '../types';
import { ItemPath } from '../App';
import Checkbox from './ui/Checkbox';
import LevelNodeIcon from './icons/LevelNodeIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import EditableText from './ui/EditableText';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface SubtopicNodeProps {
  subtopic: SubTopic;
  isLast: boolean;
  mainTopicId: string;
  completedObjectives: string[];
  onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
  onUpdateItem: (path: ItemPath, newText: string) => void;
  onAddItem: (type: 'objective', path: ItemPath) => void;
  isEditing: boolean;
}

const SubtopicNode: React.FC<SubtopicNodeProps> = ({ subtopic, isLast, mainTopicId, completedObjectives, onToggleObjective, onUpdateItem, onAddItem, isEditing }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const totalObjectives = subtopic.learningObjectives.length;
    const completedCount = subtopic.learningObjectives.filter(obj => completedObjectives.includes(obj.id)).length;
    const isComplete = totalObjectives > 0 && completedCount === totalObjectives;

    return (
        <li className="relative pl-12 pb-8">
            {!isLast && <div className="absolute left-[18px] top-5 h-full w-px bg-gradient-to-b from-transparent via-[rgba(var(--primary-rgb),0.4)] to-transparent"></div>}
            
            <div className="absolute left-0 top-0">
                <LevelNodeIcon isComplete={isComplete} />
            </div>

            <div className="relative">
                <div 
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <EditableText 
                        initialValue={subtopic.title}
                        onSave={(newText) => onUpdateItem({ mainTopicId, subtopicId: subtopic.id }, newText)}
                        Tag="h4"
                        isEditable={isEditing}
                        className={`font-semibold text-lg flex-1 ${isComplete ? 'text-[rgba(var(--primary-rgb),1)]' : 'text-slate-200'}`}
                        inputClassName="font-semibold text-lg"
                    />
                    <ChevronRightIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {totalObjectives > 0 && (
                     <p className="text-xs text-slate-500">{completedCount} / {totalObjectives} objectives</p>
                )}
            </div>
            
            <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="accordion-content-inner">
                    <div className="mt-4 space-y-3 glass-panel p-4 rounded-lg">
                        <h5 className="font-semibold text-[rgba(var(--primary-rgb),1)]">Learning Objectives</h5>
                        {subtopic.learningObjectives.map(obj => (
                            <Checkbox 
                                key={obj.id} 
                                label={obj.text}
                                isChecked={completedObjectives.includes(obj.id)}
                                onToggle={() => onToggleObjective(obj.id, !completedObjectives.includes(obj.id))}
                                onLabelSave={(newText) => onUpdateItem({ mainTopicId, subtopicId: subtopic.id, objectiveId: obj.id }, newText)}
                                isEditable={isEditing}
                            />
                        ))}
                        {isEditing && (
                            <button 
                                onClick={() => onAddItem('objective', { mainTopicId, subtopicId: subtopic.id })}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-[rgba(var(--primary-rgb),1)] transition-colors pt-2"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Add Learning Objective
                            </button>
                        )}
                        {subtopic.learningObjectives.length === 0 && <p className="text-sm text-slate-400">No specific objectives for this subtopic.</p>}
                    </div>
                </div>
            </div>
        </li>
    );
}

const Level: React.FC<{
    mainTopic: MainTopic;
    level: number;
    completedObjectives: string[];
    onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
    onUpdateItem: (path: ItemPath, newText: string) => void;
    onAddItem: (type: 'subtopic', path: ItemPath) => void;
    isEditing: boolean;
}> = ({ mainTopic, level, completedObjectives, onToggleObjective, onUpdateItem, onAddItem, isEditing }) => {
    return (
        <div className="mb-8">
            <div className="mb-6 p-4 bg-white/5 border border-slate-700 rounded-lg">
                <span className="text-sm font-bold text-blue-400">LEVEL {level}</span>
                 <EditableText 
                    initialValue={mainTopic.title}
                    onSave={(newText) => onUpdateItem({ mainTopicId: mainTopic.id }, newText)}
                    Tag="h3"
                    isEditable={isEditing}
                    className="font-heading text-3xl text-white mt-1"
                    inputClassName="font-heading text-3xl"
                />
            </div>
            <ul>
                {mainTopic.subtopics.map((subtopic, index) => (
                    <SubtopicNode 
                        key={subtopic.id} 
                        subtopic={subtopic} 
                        isLast={index === mainTopic.subtopics.length - 1}
                        mainTopicId={mainTopic.id}
                        completedObjectives={completedObjectives}
                        onToggleObjective={onToggleObjective}
                        onUpdateItem={onUpdateItem}
                        onAddItem={onAddItem as any} // Cast because it will only be called for objectives
                        isEditing={isEditing}
                    />
                ))}
            </ul>
             {isEditing && (
                <div className="pl-12">
                    <button 
                        onClick={() => onAddItem('subtopic', { mainTopicId: mainTopic.id })}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-[rgba(var(--primary-rgb),1)] transition-colors"
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
  isEditing: boolean;
}

const GamifiedStudyView: React.FC<GamifiedStudyViewProps> = ({ outline, completedObjectives, onUpdateProgress, onRevisionSelect, onUpdateItem, onAddItem, isEditing }) => {
  return (
    <div className="w-full h-full max-w-3xl mx-auto overflow-y-auto pr-4">
        {(outline.mainTopics || []).map((topic, index) => (
            <Level 
                key={topic.id}
                mainTopic={topic}
                level={index + 1}
                completedObjectives={completedObjectives}
                onToggleObjective={onUpdateProgress}
                onUpdateItem={onUpdateItem}
                onAddItem={onAddItem as any}
                isEditing={isEditing}
            />
        ))}
        {isEditing && (
            <button 
                onClick={() => onAddItem('mainTopic', {})}
                className="w-full flex items-center justify-center gap-2 py-2 my-4 text-sm text-[rgba(var(--primary-rgb),1)] hover:text-white transition-colors rounded-lg border-2 border-dashed border-slate-700 hover:border-[rgba(var(--primary-rgb),0.5)] hover:bg-white/5"
            >
                <PlusCircleIcon className="w-5 h-5" />
                Add New Level (Main Topic)
            </button>
        )}
        {/* Revision Assistant as final level */}
        {outline.revisionAssistant && (
            <div className="mb-8">
                <div className="mb-6">
                    <span className="text-sm font-bold text-amber-400">FINAL LEVEL</span>
                    <h3 className="font-heading text-3xl text-white mt-1 p-4 bg-white/5 border border-slate-700 rounded-lg">Revision Assistant</h3>
                </div>
                <div className="relative pl-12">
                    <div className="absolute left-0 top-0">
                        <LevelNodeIcon isComplete={false} isBoss />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onRevisionSelect('focus')} className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)]">Focus Areas</button>
                        <button onClick={() => onRevisionSelect('questions')} className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)]">Exam Questions</button>
                        <button onClick={() => onRevisionSelect('definitions')} className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)]">Key Definitions</button>
                        <button onClick={() => onRevisionSelect('quick-facts')} className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)]">Quick Facts</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default GamifiedStudyView;
