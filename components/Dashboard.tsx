import React, { useState, useMemo } from 'react';
import { StudyOutline, AppSettings } from '../types';
import { generateOutlinePdf } from '../services/pdfService';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import DownloadIcon from './icons/DownloadIcon';
import NotionIcon from './icons/NotionIcon';
import Modal from './ui/Modal';
import ExportToNotionModal from './ExportToNotionModal';
import FolderIcon from './icons/FolderIcon';
import ListIcon from './icons/ListIcon';

interface DashboardProps {
  outlines: StudyOutline[];
  onSelectOutline: (id: string) => void;
  onDeleteOutline: (id:string) => void;
  onRenameOutline: (id: string, newTitle: string) => void;
  appSettings: AppSettings;
}

const OutlineCard: React.FC<{
  outline: StudyOutline;
  onDownload: () => void;
  onExport: () => void;
  onRename: () => void;
  onDelete: () => void;
  onSelect: () => void;
}> = ({ outline, onDownload, onExport, onRename, onDelete, onSelect }) => {
  const allObjectives = outline.isThemeOutline
    ? outline.units?.flatMap(u => u.mainTopics.flatMap(t => t.subtopics.flatMap(s => s.learningObjectives))) || []
    : outline.mainTopics?.flatMap(t => t.subtopics.flatMap(s => s.learningObjectives)) || [];
  
  const total = allObjectives.length;
  const completed = outline.completedObjectives.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = progress === 100;

  return (
    <div className="glass-panel rounded-lg p-4 flex flex-col transition-all hover:border-[rgba(var(--primary-rgb),0.5)]">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-white truncate">{outline.title}</h3>
          <p className="text-sm text-slate-400">
            {outline.subject} &bull; Created on {new Date(outline.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-4">
          <button onClick={onDownload} title="Download PDF" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 hover:scale-110 active:scale-100"><DownloadIcon className="w-5 h-5"/></button>
          <button onClick={onExport} title="Export to Notion" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 hover:scale-110 active:scale-100"><NotionIcon className="w-5 h-5"/></button>
          <button onClick={onRename} title="Rename" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 hover:scale-110 active:scale-100"><EditIcon className="w-5 h-5"/></button>
          <button onClick={onDelete} title="Delete" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200 hover:scale-110 active:scale-100"><TrashIcon className="w-5 h-5"/></button>
          <button onClick={onSelect} className="bg-white/10 text-white font-semibold py-2 px-4 rounded-md hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-100">
            Study
          </button>
        </div>
      </div>
      {total > 0 && (
          <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{completed}/{total}</span>
              </div>
              <div title={`${Math.round(progress)}% complete`} className="w-full bg-slate-700/50 rounded-full h-1.5">
                  <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-[rgba(var(--primary-rgb),1)]'}`}
                      style={{ width: `${progress}%` }}
                  ></div>
              </div>
          </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ outlines, onSelectOutline, onDeleteOutline, onRenameOutline, appSettings }) => {
  const [outlineToDelete, setOutlineToDelete] = useState<StudyOutline | null>(null);
  const [outlineToRename, setOutlineToRename] = useState<StudyOutline | null>(null);
  const [outlineToExport, setOutlineToExport] = useState<StudyOutline | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [view, setView] = useState<'folders' | 'list'>('folders');
  
  const sortedOutlines = useMemo(() => 
    [...outlines].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [outlines]);

  const groupedOutlines = useMemo(() => {
    return sortedOutlines.reduce((acc, outline) => {
        const subject = outline.subject || 'Uncategorized';
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push(outline);
        return acc;
    }, {} as Record<string, StudyOutline[]>);
  }, [sortedOutlines]);

  const handleDeleteClick = (outline: StudyOutline) => setOutlineToDelete(outline);
  const confirmDelete = () => {
    if (outlineToDelete) {
      onDeleteOutline(outlineToDelete.id);
      setOutlineToDelete(null);
    }
  };
  
  const handleRenameClick = (outline: StudyOutline) => {
    setOutlineToRename(outline);
    setNewTitle(outline.title);
  };
  
  const confirmRename = () => {
    if (outlineToRename && newTitle.trim()) {
      onRenameOutline(outlineToRename.id, newTitle.trim());
      setOutlineToRename(null);
      setNewTitle('');
    }
  };
  
  const handleDownload = (outline: StudyOutline) => generateOutlinePdf(outline);

  const renderOutlines = (list: StudyOutline[]) => (
    <div className="space-y-3">
      {list.map(outline => (
        <OutlineCard 
          key={outline.id}
          outline={outline}
          onDownload={() => handleDownload(outline)}
          onExport={() => setOutlineToExport(outline)}
          onRename={() => handleRenameClick(outline)}
          onDelete={() => handleDeleteClick(outline)}
          onSelect={() => onSelectOutline(outline.id)}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-end mb-4">
        <div className="flex bg-slate-800/60 p-1 rounded-lg">
            <button onClick={() => setView('folders')} title="Folder View" className={`p-1.5 rounded-md transition-colors ${view === 'folders' ? 'bg-[rgba(var(--primary-rgb),1)] text-white' : 'text-slate-400 hover:bg-white/10'}`}>
                <FolderIcon className="w-5 h-5"/>
            </button>
            <button onClick={() => setView('list')} title="List View" className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-[rgba(var(--primary-rgb),1)] text-white' : 'text-slate-400 hover:bg-white/10'}`}>
                <ListIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>

      {outlines.length > 0 ? (
        view === 'folders' ? (
          <div className="space-y-4">
            {Object.entries(groupedOutlines).map(([subject, subjectOutlines]) => (
              <details key={subject} className="glass-panel rounded-lg" open>
                <summary className="p-4 font-semibold text-lg cursor-pointer flex items-center gap-3">
                  <FolderIcon className="w-6 h-6 text-[rgba(var(--primary-rgb),1)]"/>
                  {subject}
                  <span className="text-sm font-normal text-slate-400 bg-slate-700/80 px-2 py-0.5 rounded-full">{subjectOutlines.length}</span>
                </summary>
                <div className="p-4 border-t border-[rgba(var(--primary-rgb),0.2)]">
                  {renderOutlines(subjectOutlines)}
                </div>
              </details>
            ))}
          </div>
        ) : (
          renderOutlines(sortedOutlines)
        )
      ) : (
        <div className="text-center glass-panel rounded-lg py-16 px-6">
          <h3 className="text-xl font-semibold text-white">No outlines yet!</h3>
          <p className="text-slate-400 mt-2">Go to the "Create New" tab to get started.</p>
        </div>
      )}
      
      <Modal isOpen={!!outlineToDelete} onClose={() => setOutlineToDelete(null)} title="Confirm Deletion" titleIcon="delete">
          <p className="text-slate-300">Are you sure you want to delete the outline <strong className="text-white">{outlineToDelete?.title}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setOutlineToDelete(null)} className="py-2 px-4 rounded-md text-white bg-white/10 hover:bg-white/20">Cancel</button>
              <button onClick={confirmDelete} className="py-2 px-4 rounded-md text-white bg-red-600 hover:bg-red-700">Delete</button>
          </div>
      </Modal>

      <Modal isOpen={!!outlineToRename} onClose={() => setOutlineToRename(null)} title="Rename Outline">
        <div>
            <label className="block mb-2 text-sm font-semibold text-slate-300">New Title</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"
            />
        </div>
        <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setOutlineToRename(null)} className="py-2 px-4 rounded-md text-white bg-white/10 hover:bg-white/20">Cancel</button>
            <button onClick={confirmRename} className="py-2 px-4 rounded-md text-white bg-[rgba(var(--primary-rgb),1)] hover:bg-[rgba(var(--primary-rgb),0.8)]">Save</button>
        </div>
      </Modal>

      <ExportToNotionModal
        isOpen={!!outlineToExport}
        onClose={() => setOutlineToExport(null)}
        outline={outlineToExport}
        appSettings={appSettings}
      />
    </div>
  );
};

export default Dashboard;