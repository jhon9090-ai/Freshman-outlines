import React from 'react';
import TextIcon from '../icons/TextIcon';

interface DefinitionCalloutProps {
    term: string;
    definition: string;
}

const DefinitionCallout: React.FC<DefinitionCalloutProps> = ({ term, definition }) => {
    return (
        <div className="relative bg-[rgba(var(--primary-rgb),0.1)] p-5 rounded-lg overflow-hidden border border-[rgba(var(--primary-rgb),0.2)]">
            <TextIcon className="absolute -right-2 -bottom-2 w-24 h-24 text-[rgba(var(--primary-rgb),0.1)]" />
            <div className="flex items-center gap-2 mb-3">
                <TextIcon className="w-5 h-5 text-[rgba(var(--primary-rgb),0.8)]" />
                <span className="font-semibold text-[rgba(var(--primary-rgb),0.8)]">Definition</span>
            </div>
            <h4 className="font-heading text-3xl text-white mb-2">{term}</h4>
            <p className="text-slate-300 text-base font-medium">{definition}</p>
        </div>
    );
};

export default DefinitionCallout;