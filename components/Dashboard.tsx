

import React, { useState, useMemo, useEffect } from 'react';
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

const DASHBOARD_VIEW_KEY = 'dashboard-view-preference';
const FOLDER_STATE_KEY = 'dashboard-folder-state';

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
    <div className="glass-panel rounded-2xl p-6 flex flex-col transition-all hover:border-sky-500/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xl text-white truncate">{outline.title}</h3>
          <p className="text-base text-slate-400">
            {outline.subject} &bull; Created on {new Date(outline.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onDownload} title="Download PDF" className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"><DownloadIcon className="w-5 h-5"/></button>
          <button onClick={onExport} title="Export to Notion" className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"><NotionIcon className="w-5 h-5"/></button>
          <button onClick={onRename} title="Rename" className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"><EditIcon className="w-5 h-5"/></button>
          <button onClick={onDelete} title="Delete" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><TrashIcon className="w-5 h-5"/></button>
        </div>
      </div>
      <div className="flex items-end justify-between mt-4">
        {total > 0 ? (
            <div className="flex-1 pr-8">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{completed}/{total}</span>
                </div>
                <div title={`${Math.round(progress)}% complete`} className="w-full bg-slate-800 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-sky-500'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        ) : <div className="flex-1"></div>}
         <button onClick={onSelect} className="bg-slate-800 text-slate-100 font-semibold py-2 px-5 rounded-lg hover:bg-sky-500 hover:text-white transition-all active:scale-95">
            Study
          </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ outlines, onSelectOutline, onDeleteOutline, onRenameOutline, appSettings }) => {
  const [outlineToDelete, setOutlineToDelete] = useState<StudyOutline | null>(null);
  const [outlineToRename, setOutlineToRename] = useState<StudyOutline | null>(null);
  const [outlineToExport, setOutlineToExport] = useState<StudyOutline | null>(null);
  const [newTitle, setNewTitle] = useState('');
  
  const [view, setView] = useState<'folders' | 'list'>(() => {
    return (localStorage.getItem(DASHBOARD_VIEW_KEY) as 'folders' | 'list') || 'folders';
  });
  
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    try {
        const savedState = localStorage.getItem(FOLDER_STATE_KEY);
        return savedState ? JSON.parse(savedState) : {};
    } catch {
        return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(DASHBOARD_VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
      localStorage.setItem(FOLDER_STATE_KEY, JSON.stringify(openFolders));
  }, [openFolders]);

  const handleToggleFolder = (subject: string, isOpen: boolean) => {
    setOpenFolders(prev => ({...prev, [subject]: isOpen}));
  };
  
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
    <div className="space-y-4">
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-end mb-6">
        <div className="flex bg-slate-900/70 p-1 rounded-lg border border-slate-700">
            <button onClick={() => setView('folders')} title="Folder View" className={`p-2 rounded-md transition-colors ${view === 'folders' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                <FolderIcon className="w-5 h-5"/>
            </button>
            <button onClick={() => setView('list')} title="List View" className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                <ListIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>

      {outlines.length > 0 ? (
        view === 'folders' ? (
          <div className="space-y-6">
            {Object.entries(groupedOutlines).map(([subject, subjectOutlines]) => (
              <details 
                key={subject} 
                className="glass-panel rounded-2xl folder-accordion" 
                open={openFolders[subject] ?? true}
                onToggle={(e) => handleToggleFolder(subject, (e.currentTarget as HTMLDetailsElement).open)}
              >
                <summary 
                  className="p-6 font-semibold text-2xl cursor-pointer flex items-center gap-4 list-none"
                >
                  <FolderIcon className="w-8 h-8 text-sky-400"/>
                  {subject}
                  <span className="text-base font-normal text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full">{subjectOutlines.length}</span>
                </summary>
                <div className="folder-accordion-content">
                  <div className="folder-accordion-content-inner">
                    <div className="p-6 border-t border-white/10">
                      {renderOutlines(subjectOutlines)}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          renderOutlines(sortedOutlines)
        )
      ) : (
        <div className="text-center glass-panel rounded-2xl py-20 px-6">
          <h3 className="text-2xl font-bold text-white">No outlines yet!</h3>
          <p className="text-slate-400 mt-2 text-lg">Go to the "Create New" tab to get started.</p>
        </div>
      )}
      
      <Modal isOpen={!!outlineToDelete} onClose={() => setOutlineToDelete(null)} title="Confirm Deletion" titleIcon="delete" backdrop={false} variant="solid">
          <p className="text-slate-300">Are you sure you want to delete the outline <strong className="text-white">{outlineToDelete?.title}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setOutlineToDelete(null)} className="py-2 px-4 rounded-lg font-semibold text-white bg-slate-700 hover:bg-slate-600">Cancel</button>
              <button onClick={confirmDelete} className="py-2 px-4 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600">Delete</button>
          </div>
      </Modal>

      <Modal isOpen={!!outlineToRename} onClose={() => setOutlineToRename(null)} title="Rename Outline" backdrop={false} variant="solid">
        <div>
            <label className="block mb-2 text-base font-semibold text-slate-300">New Title</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-sky-500 focus:border-sky-500"
            />
        </div>
        <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setOutlineToRename(null)} className="py-2 px-4 rounded-lg font-semibold text-white bg-slate-700 hover:bg-slate-600">Cancel</button>
            <button onClick={confirmRename} className="py-2 px-4 rounded-lg font-semibold text-white bg-sky-500 hover:bg-sky-600">Save</button>
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