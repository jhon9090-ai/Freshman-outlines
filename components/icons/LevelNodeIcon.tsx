
import React from 'react';

interface LevelNodeIconProps {
    isComplete: boolean;
    isBoss?: boolean;
}

const LevelNodeIcon: React.FC<LevelNodeIconProps> = ({ isComplete, isBoss }) => {
    const colorClass = isBoss ? 'text-[rgba(var(--accent-rgb),1)]' : isComplete ? 'text-[rgba(var(--primary-rgb),1)]' : 'text-slate-600';

    return (
        <div className={`relative w-[38px] h-[38px] flex items-center justify-center ${colorClass}`}>
            {isComplete && <div className="absolute w-full h-full rounded-full bg-current opacity-20 animate-pulse"></div>}
            <div className="absolute w-full h-full rounded-full bg-current opacity-10"></div>
            <div className="relative w-3 h-3 rounded-full bg-current"></div>
        </div>
    );
};

export default LevelNodeIcon;
