
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
        <li className="relative pl-12 pb-10">
            {!isLast && <div className="absolute left-[18px] top-5 h-full w-px bg-gradient-to-b from-transparent via-sky-500/30 to-transparent"></div>}
            
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
                        className={`font-semibold text-xl flex-1 ${isComplete ? 'text-sky-400' : 'text-slate-100'}`}
                        inputClassName="font-semibold text-xl"
                    />
                    <ChevronRightIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {totalObjectives > 0 && (
                     <p className="text-sm text-slate-500">{completedCount} / {totalObjectives} objectives</p>
                )}
            </div>
            
            <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="accordion-content-inner">
                    <div className="mt-4 space-y-4 glass-panel p-5 rounded-xl">
                        <h5 className="font-semibold text-sky-400">Learning Objectives</h5>
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
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors pt-2"
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
        <div className="mb-10">
            <div className="mb-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                <span className="text-sm font-bold text-sky-400">LEVEL {level}</span>
                 <EditableText 
                    initialValue={mainTopic.title}
                    onSave={(newText) => onUpdateItem({ mainTopicId: mainTopic.id }, newText)}
                    Tag="h3"
                    isEditable={isEditing}
                    className="text-3xl font-bold text-white mt-1"
                    inputClassName="text-3xl font-bold"
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
                className="w-full flex items-center justify-center gap-2 py-3 my-4 text-base text-sky-400 hover:text-white transition-colors rounded-lg border-2 border-dashed border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10"
            >
                <PlusCircleIcon className="w-5 h-5" />
                Add New Level (Main Topic)
            </button>
        )}
        {/* Revision Assistant as final level */}
        {outline.revisionAssistant && (
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