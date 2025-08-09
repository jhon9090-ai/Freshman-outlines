
import React, { useState } from 'react';
import { StudyOutline } from '../types';
import { generateOutlinePdf } from '../services/pdfService';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import DownloadIcon from './icons/DownloadIcon';
import Modal from './ui/Modal';

interface DashboardProps {
  outlines: StudyOutline[];
  onSelectOutline: (id: string) => void;
  onDeleteOutline: (id:string) => void;
  onRenameOutline: (id: string, newTitle: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ outlines, onSelectOutline, onDeleteOutline, onRenameOutline }) => {
  const [outlineToDelete, setOutlineToDelete] = useState<StudyOutline | null>(null);
  const [outlineToRename, setOutlineToRename] = useState<StudyOutline | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleDeleteClick = (outline: StudyOutline) => {
    setOutlineToDelete(outline);
  };
  
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
  
  const handleDownload = (outline: StudyOutline) => {
      generateOutlinePdf(outline);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-3">
        {outlines.length > 0 ? (
          outlines.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(outline => (
            <div key={outline.id} className="glass-panel rounded-lg p-4 flex items-center justify-between transition-all hover:border-[rgba(var(--primary-rgb),0.5)]">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-white truncate">{outline.title}</h3>
                <p className="text-sm text-slate-400">
                  {outline.subject} &bull; Created on {new Date(outline.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                 <button onClick={() => handleDownload(outline)} title="Download PDF" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 hover:scale-110 active:scale-100"><DownloadIcon className="w-5 h-5"/></button>
                 <button onClick={() => handleRenameClick(outline)} title="Rename" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 hover:scale-110 active:scale-100"><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => handleDeleteClick(outline)} title="Delete" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200 hover:scale-110 active:scale-100"><TrashIcon className="w-5 h-5"/></button>
                <button onClick={() => onSelectOutline(outline.id)} className="bg-white/10 text-white font-semibold py-2 px-4 rounded-md hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-100">
                  Study
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center glass-panel rounded-lg py-16 px-6">
            <h3 className="text-xl font-semibold text-white">No outlines yet!</h3>
            <p className="text-slate-400 mt-2">Go to the "Create New" tab to get started.</p>
          </div>
        )}
      </div>
      
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
    </div>
  );
};

export default Dashboard;