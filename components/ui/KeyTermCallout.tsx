
import React from 'react';
import InfoIcon from '../icons/InfoIcon';

interface KeyTermCalloutProps {
    term: string;
    definition: string;
}

const KeyTermCallout: React.FC<KeyTermCalloutProps> = ({ term, definition }) => {
    return (
        <div className="bg-slate-900/70 border-l-4 border-pink-500 p-4 rounded-r-lg flex gap-4">
            <div className="flex-shrink-0 mt-1">
                <InfoIcon className="w-5 h-5 text-pink-400" />
            </div>
            <div>
                <h4 className="font-bold text-white">{term}</h4>
                <p className="text-slate-300">{definition}</p>
            </div>
        </div>
    );
};

export default KeyTermCallout;