


import React, { useState } from 'react';
import { StudyOutline, MainTopic, SubTopic, RevisionSection, LearningObjective } from '../types';
import Checkbox from './ui/Checkbox';
import LevelNodeIcon from './icons/LevelNodeIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface SubtopicNodeProps {
  subtopic: SubTopic;
  isLast: boolean;
  completedObjectives: string[];
  onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
}

const SubtopicNode: React.FC<SubtopicNodeProps> = ({ subtopic, isLast, completedObjectives, onToggleObjective }) => {
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
                    <h4 className={`font-semibold text-lg ${isComplete ? 'text-[rgba(var(--primary-rgb),1)]' : 'text-slate-200'}`}>{subtopic.title}</h4>
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
                            />
                        ))}
                        {subtopic.learningObjectives.length === 0 && <p className="text-sm text-slate-400">No specific objectives for this subtopic.</p>}
                    </div>
                </div>
            </div>
        </li>
    );
}

const Level: React.FC<{mainTopic: MainTopic, level: number, completedObjectives: string[], onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;}> = ({ mainTopic, level, completedObjectives, onToggleObjective }) => {
    return (
        <div className="mb-8">
            <div className="mb-6">
                <span className="text-sm font-bold text-blue-400">LEVEL {level}</span>
                <h3 className="font-heading text-3xl text-white mt-1 p-4 bg-white/5 border border-slate-700 rounded-lg">{mainTopic.title}</h3>
            </div>
            <ul>
                {mainTopic.subtopics.map((subtopic, index) => (
                    <SubtopicNode 
                        key={subtopic.id} 
                        subtopic={subtopic} 
                        isLast={index === mainTopic.subtopics.length - 1}
                        completedObjectives={completedObjectives}
                        onToggleObjective={onToggleObjective}
                    />
                ))}
            </ul>
        </div>
    );
};

interface GamifiedStudyViewProps {
  outline: StudyOutline;
  onUpdateProgress: (objectiveId: string, isComplete: boolean) => void;
  onRevisionSelect: (section: RevisionSection) => void;
}

const GamifiedStudyView: React.FC<GamifiedStudyViewProps> = ({ outline, onUpdateProgress, onRevisionSelect }) => {
  return (
    <div className="w-full h-full max-w-3xl mx-auto overflow-y-auto pr-4">
        {(outline.mainTopics || []).map((topic, index) => (
            <Level 
                key={topic.id}
                mainTopic={topic}
                level={index + 1}
                completedObjectives={outline.completedObjectives}
                onToggleObjective={onUpdateProgress}
            />
        ))}
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