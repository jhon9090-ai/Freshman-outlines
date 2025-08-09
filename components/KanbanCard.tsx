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
        p-4 rounded-lg cursor-pointer transition-all duration-200
        border
        ${isSelected ? 'bg-[rgba(var(--primary-rgb),0.25)] border-[rgba(var(--primary-rgb),0.8)] shadow-lg scale-105' : 'bg-white/5 border-white/10 hover:bg-[rgba(var(--primary-rgb),0.1)] hover:border-[rgba(var(--primary-rgb),0.3)]'}
        ${isRevision ? 'border-amber-400/50 bg-amber-500/10' : ''}
      `}
    >
      <div className="flex justify-between items-center">
        <h4 className={`font-semibold ${isRevision ? 'text-amber-300' : 'text-slate-100'}`}>{topic.title}</h4>
        <ChevronRightIcon className={`w-5 h-5 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
      </div>
    </div>
  );
};

export default KanbanCard;