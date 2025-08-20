import React from 'react';
import TextIcon from '../icons/TextIcon';

interface DefinitionCalloutProps {
    term: string;
    definition: string;
}

const DefinitionCallout: React.FC<DefinitionCalloutProps> = ({ term, definition }) => {
    return (
        <div className="relative bg-pink-500/10 p-6 rounded-2xl overflow-hidden border border-pink-500/20">
            <TextIcon className="absolute -right-4 -bottom-4 w-28 h-28 text-pink-500/10" />
            <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                    <TextIcon className="w-5 h-5 text-pink-400" />
                    <span className="font-semibold text-pink-400">Definition</span>
                </div>
                <h4 className="text-3xl font-bold text-white mb-2">{term}</h4>
                <p className="text-slate-300 text-lg">{definition}</p>
            </div>
        </div>
    );
};

export default DefinitionCallout;