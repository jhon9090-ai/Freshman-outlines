import React, { useState } from 'react';
import { KanbanColumnData, MainTopic } from '../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnData;
  topics: MainTopic[];
  onCardClick: (topicId: string) => void;
  selectedTopicId: string | null;
  onDragStart: (topicId: string, columnId: string) => void;
  onDrop: (columnId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, topics, onCardClick, selectedTopicId, onDragStart, onDrop }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(column.id);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col glass-panel rounded-2xl p-4 transition-all duration-300 ${isOver ? 'bg-sky-500/10 border-sky-500' : ''}`}
        >
            <h3 className="font-bold text-xl px-2 pb-4 text-white sticky top-0 bg-transparent z-10">{column.title} <span className="text-base font-normal text-slate-400">{topics.length}</span></h3>
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-1">
                {topics.map((topic) => (
                    <KanbanCard 
                        key={topic.id} 
                        topic={topic}
                        onClick={() => onCardClick(topic.id)}
                        isSelected={selectedTopicId === topic.id}
                        onDragStart={() => onDragStart(topic.id, column.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default KanbanColumn;