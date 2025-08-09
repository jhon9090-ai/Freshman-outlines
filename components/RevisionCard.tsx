

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
            className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)] flex flex-col items-center justify-center text-center">
            {children}
        </button>
    );

    return (
        <div className={`w-full max-w-2xl glass-panel rounded-xl p-8 shadow-2xl mx-auto ${animationClass}`}>
            <h2 className="font-heading text-3xl text-[rgba(var(--accent-rgb),1)] text-center mb-2">Revision Assistant</h2>
            <p className="text-center text-slate-400 mb-8">Ready to test your knowledge?</p>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <RevisionButton section="focus">Focus Areas</RevisionButton>
                <RevisionButton section="questions">Exam Questions</RevisionButton>
                <RevisionButton section="definitions">Key Definitions</RevisionButton>
                <RevisionButton section="quick-facts">Quick Facts</RevisionButton>
            </div>
        </div>
    );
};

export default RevisionCard;