

import React, { useCallback, useRef } from 'react';
import { MainTopic, RevisionAssistant, LearningObjective } from '../types';
import XIcon from './icons/XIcon';

interface SidePeekPanelProps {
  topic: MainTopic | null;
  onClose: () => void;
  width: number;
  setWidth: (width: number) => void;
  revisionData?: RevisionAssistant | null;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold mb-3 text-sky-400">{title}</h3>
    {children}
  </div>
);

const SidePeekPanel: React.FC<SidePeekPanelProps> = ({ topic, onClose, width, setWidth, revisionData }) => {
  const isResizing = useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 350 && newWidth < window.innerWidth - 450) { // ensure it doesn't overlap input panel
      setWidth(newWidth);
    }
  }, [setWidth]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const isVisible = topic !== null;
  const isRevisionTopic = topic?.id === 'revision-assistant';

  const allLearningObjectives: LearningObjective[] = topic?.subtopics?.flatMap(st => st.learningObjectives) || [];

  return (
    <div
      style={{ width: isVisible ? `${width}px` : '0px', minWidth: isVisible ? '350px' : '0px' }}
      className="flex-shrink-0 relative transition-all duration-300 ease-in-out"
    >
      <div className={`
        absolute inset-0 flex
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-300
        `}>
        <div 
          onMouseDown={handleMouseDown}
          className="w-2 h-full cursor-col-resize flex-shrink-0 group"
        >
          <div className="w-0.5 h-full bg-transparent group-hover:bg-sky-500/50 transition-colors mx-auto"></div>
        </div>
        <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col overflow-hidden">
          {topic && (
            <>
              <div className="flex justify-between items-start mb-6">
                <h2 className={`text-3xl font-bold ${isRevisionTopic ? 'text-amber-300' : 'text-white'}`}>{topic.title}</h2>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {isRevisionTopic && revisionData ? (
                  <>
                    <Section title="Focus Areas">
                      <ul className="list-disc list-inside space-y-2 text-slate-300">
                          {revisionData.focusAreas.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </Section>
                    <Section title="Exam-Style Questions">
                      <ul className="list-disc list-inside space-y-2 text-slate-300">
                          {revisionData.examQuestions.map((item, i) => <li key={i}>{item.question}</li>)}
                      </ul>
                    </Section>
                    <Section title="Key Definitions">
                      <div className="space-y-3 text-slate-300">
                          {revisionData.keyDefinitions.map((def, i) => (
                              <div key={i}>
                                  <strong className="text-white">{def.term}:</strong> {def.definition}
                              </div>
                          ))}
                      </div>
                    </Section>
                  </>
                ) : !isRevisionTopic && topic ? (
                  <>
                    {topic.subtopics?.length > 0 && (
                        <Section title="Subtopics">
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {topic.subtopics.map((item, i) => <li key={i}>{item.title}</li>)}
                            </ul>
                        </Section>
                    )}
                    {allLearningObjectives.length > 0 && (
                        <Section title="Learning Objectives">
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {allLearningObjectives.map((item) => <li key={item.id}>{item.text}</li>)}
                            </ul>
                        </Section>
                    )}
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidePeekPanel;