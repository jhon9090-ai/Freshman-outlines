



import React from 'react';
import { MainTopic, LearningObjective } from '../types';
import Checkbox from './ui/Checkbox';

interface SubtopicAccordionProps {
  title: string;
  objectives: LearningObjective[];
  completedObjectives: string[];
  onToggleObjective: (objectiveId: string, isCompleted: boolean) => void;
}

const SubtopicAccordion: React.FC<SubtopicAccordionProps> = ({ title, objectives, completedObjectives, onToggleObjective }) => (
    <details className="glass-panel rounded-lg border border-slate-700/50 open:bg-[rgba(var(--primary-rgb),0.1)] open:border-[rgba(var(--primary-rgb),0.5)] transition-colors duration-300">
        <summary className="p-4 font-semibold text-lg text-slate-100 cursor-pointer list-none flex justify-between items-center">
            {title}
            <svg className="w-5 h-5 transition-transform duration-300 ease-out transform-gpu details-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            <style>{`.details-arrow { transform: rotate(0); } details[open] .details-arrow { transform: rotate(180deg); }`}</style>
        </summary>
        <div className="accordion-content">
            <div className="accordion-content-inner px-4 pb-4 border-t border-slate-700">
                <h4 className="font-semibold text-[rgba(var(--primary-rgb),1)] mt-4 mb-3">Learning Objectives</h4>
                <div className="space-y-3">
                    {objectives.map((item) => {
                        const isCompleted = completedObjectives.includes(item.id);
                        return (
                            <Checkbox 
                                key={item.id} 
                                label={item.text}
                                isChecked={isCompleted}
                                onToggle={() => onToggleObjective(item.id, !isCompleted)}
                            />
                        );
                    })}
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
}

const MainTopicCard: React.FC<MainTopicCardProps> = ({ mainTopic, completedObjectives, onToggleObjective, isEmbedded = false, animationClass = '' }) => {
  
  const content = (
    <>
        {!isEmbedded && <h2 className="font-heading text-3xl md:text-4xl text-white text-center mb-6 flex-shrink-0">{mainTopic.title}</h2>}
        <div className={`${isEmbedded ? '' : 'flex-1 space-y-4 overflow-y-auto pr-2'}`}>
            <h3 className="text-xl font-bold text-[rgba(var(--primary-rgb),1)] mb-2">{isEmbedded ? mainTopic.title : 'Subtopics to Cover'}</h3>
            {mainTopic.subtopics.map(subtopic => (
                <SubtopicAccordion 
                    key={subtopic.id} 
                    title={subtopic.title} 
                    objectives={subtopic.learningObjectives}
                    completedObjectives={completedObjectives}
                    onToggleObjective={onToggleObjective}
                />
            ))}
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