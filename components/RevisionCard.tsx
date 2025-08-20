

import React from 'react';
import { RevisionAssistant, RevisionSection } from '../types';

interface RevisionCardProps {
    revisionData: RevisionAssistant;
    onSectionSelect: (section: RevisionSection) => void;
    animationClass?: string;
}

const RevisionCard: React.FC<RevisionCardProps> = ({ revisionData, onSectionSelect, animationClass = '' }) => {
    
    const hasContent = (view: RevisionSection) => {
        switch(view) {
            case 'focus': return revisionData.focusAreas.length > 0;
            case 'questions': return revisionData.examQuestions.length > 0;
            case 'definitions': return revisionData.keyDefinitions.length > 0;
            case 'quick-facts': return revisionData.quickFacts.length > 0;
            default: return false;
        }
    }

    const RevisionButton: React.FC<{section: RevisionSection, children: React.ReactNode}> = ({ section, children }) => (
        <button 
            onClick={() => onSectionSelect(section)}
            disabled={!hasContent(section)}
            className="p-6 bg-slate-800/80 rounded-xl text-white font-semibold text-lg hover:bg-slate-700/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-sky-500/50 flex flex-col items-center justify-center text-center active:scale-95">
            {children}
        </button>
    );

    return (
        <div className={`w-full max-w-3xl glass-panel rounded-2xl p-8 shadow-2xl mx-auto ${animationClass}`}>
            <h2 className="text-4xl font-bold text-amber-400 text-center mb-2">Revision Assistant</h2>
            <p className="text-center text-slate-400 mb-8 text-lg">Ready to test your knowledge?</p>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <RevisionButton section="focus">Focus Areas</RevisionButton>
                <RevisionButton section="questions">Exam Questions</RevisionButton>
                <RevisionButton section="definitions">Key Definitions</RevisionButton>
                <RevisionButton section="quick-facts">Quick Facts</RevisionButton>
            </div>
        </div>
    );
};

export default RevisionCard;