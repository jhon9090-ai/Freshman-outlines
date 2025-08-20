import React from 'react';
import { MainTopic } from '../types';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface KanbanCardProps {
  topic: MainTopic;
  onClick: () => void;
  isSelected: boolean;
  onDragStart: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ topic, onClick, isSelected, onDragStart }) => {

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };
  
  const isRevision = topic.id === 'revision-assistant';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`
        p-4 rounded-xl cursor-pointer transition-all duration-200
        border
        ${isSelected ? 'bg-sky-500/20 border-sky-400 shadow-lg scale-105' : 'bg-slate-900/50 border-slate-700 hover:bg-sky-500/10 hover:border-sky-500/50'}
        ${isRevision ? 'border-amber-400/50 bg-amber-500/10' : ''}
      `}
    >
      <div className="flex justify-between items-center">
        <h4 className={`font-semibold text-lg ${isRevision ? 'text-amber-300' : 'text-slate-100'}`}>{topic.title}</h4>
        <ChevronRightIcon className={`w-5 h-5 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
      </div>
    </div>
  );
};

export default KanbanCard;