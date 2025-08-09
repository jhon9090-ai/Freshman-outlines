import React, { useState } from 'react';
import { KanbanState, MainTopic } from '../types';
import { KANBAN_COLUMNS_ORDER } from '../constants';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  kanbanState: KanbanState;
  topics: MainTopic[];
  onDragEnd: (draggedTopicId: string, sourceColumnId: string, destColumnId:string) => void;
  onCardClick: (topicId: string) => void;
  selectedTopicId: string | null;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ kanbanState, topics, onDragEnd, onCardClick, selectedTopicId }) => {
    const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
    const [sourceColumnId, setSourceColumnId] = useState<string | null>(null);

    const handleDragStart = (topicId: string, columnId: string) => {
        setDraggedTopicId(topicId);
        setSourceColumnId(columnId);
    };

    const handleDrop = (destColumnId: string) => {
        if (draggedTopicId && sourceColumnId) {
            onDragEnd(draggedTopicId, sourceColumnId, destColumnId);
        }
        setDraggedTopicId(null);
        setSourceColumnId(null);
    };

    const topicsMap = new Map(topics.map(topic => [topic.id, topic]));

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {KANBAN_COLUMNS_ORDER.map((columnId) => {
        const column = kanbanState[columnId];
        const columnTopics = column.topicIds.map(id => topicsMap.get(id)).filter(Boolean) as MainTopic[];
        
        return (
          <KanbanColumn
            key={column.id}
            column={column}
            topics={columnTopics}
            onCardClick={onCardClick}
            selectedTopicId={selectedTopicId}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        );
      })}
    </div>
  );
};

export default KanbanBoard;