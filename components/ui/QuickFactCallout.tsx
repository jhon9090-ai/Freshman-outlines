import React from 'react';
import InfoIcon from '../icons/InfoIcon';

interface QuickFactCalloutProps {
    term: string;
    fact: string;
}

const QuickFactCallout: React.FC<QuickFactCalloutProps> = ({ term, fact }) => {
    return (
        <div className="bg-sky-500/10 p-6 rounded-2xl border border-sky-500/20">
            <div className="flex items-center gap-2 mb-3">
                <InfoIcon className="w-5 h-5 text-sky-400" />
                <span className="font-semibold text-sky-400">Quick Fact</span>
            </div>
            <p className="text-slate-200 text-lg">
                <strong className="text-white">{term}:</strong> {fact}
            </p>
        </div>
    );
};

export default QuickFactCallout;