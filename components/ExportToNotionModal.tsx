import React, { useState, useEffect } from 'react';
import { StudyOutline, AppSettings } from '../types';
import { exportToNotion } from '../services/notionService';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';
import NotionIcon from './icons/NotionIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface ExportToNotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  outline: StudyOutline | null;
  appSettings: AppSettings;
}

const ExportToNotionModal: React.FC<ExportToNotionModalProps> = ({ isOpen, onClose, outline, appSettings }) => {
  const [parentPageUrl, setParentPageUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');

  useEffect(() => {
    // Reset state when modal is reopened for a new outline
    if (isOpen) {
      setStatus('idle');
      setParentPageUrl('');
      setErrorMessage('');
      setNewPageUrl('');
    }
  }, [isOpen]);

  const handleExport = async () => {
    if (!outline || !parentPageUrl.trim()) return;
    setStatus('exporting');
    setErrorMessage('');
    try {
      const url = await exportToNotion(outline, appSettings.notionApiKey, parentPageUrl);
      setNewPageUrl(url);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStatus('error');
    }
  };

  const renderContent = () => {
    if (!appSettings.notionApiKey) {
      return (
        <div className="text-center">
          <p className="text-slate-300 mb-4">Please add your Notion Integration Token in the Settings panel first.</p>
          <button onClick={onClose} className="py-2 px-4 rounded-md text-white bg-white/10 hover:bg-white/20">Close</button>
        </div>
      );
    }

    switch (status) {
      case 'exporting':
        return (
          <div className="flex flex-col items-center justify-center text-center h-40">
            <Spinner className="w-10 h-10 text-[rgba(var(--primary-rgb),1)]" />
            <p className="mt-4 text-slate-300">Exporting to Notion...</p>
            <p className="text-sm text-slate-400">This may take a moment for large outlines.</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8" />
            </div>
            <p className="text-slate-200 font-semibold mb-4">Successfully exported!</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={newPageUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-[rgba(var(--primary-rgb),1)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[rgba(var(--primary-rgb),0.8)] transition-colors">
                View in Notion
              </a>
              <button onClick={onClose} className="flex-1 bg-white/10 text-white font-semibold py-2 px-4 rounded-md hover:bg-white/20 transition-colors">
                Done
              </button>
            </div>
          </div>
        );
      case 'error':
        return (
          <div>
            <p className="text-red-300 bg-red-500/20 p-3 rounded-lg mb-4 text-sm">{errorMessage}</p>
            <button onClick={() => setStatus('idle')} className="w-full p-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors">
              Try Again
            </button>
          </div>
        );
      case 'idle':
      default:
        return (
          <div>
            <p className="text-slate-300 mb-4">A new page titled "<strong className="text-white">{outline?.title}</strong>" will be created inside the Notion page you select.</p>
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-300">Notion Parent Page Link</label>
              <input 
                type="url" 
                value={parentPageUrl}
                onChange={(e) => setParentPageUrl(e.target.value)}
                placeholder="https://www.notion.so/your/page-url..."
                className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="py-2 px-4 rounded-md text-white bg-white/10 hover:bg-white/20">Cancel</button>
              <button 
                onClick={handleExport}
                disabled={!parentPageUrl.trim()}
                className="flex items-center gap-2 py-2 px-4 rounded-md text-white bg-[#191919] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <NotionIcon className="w-4 h-4" />
                Export to Notion
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Export to Notion`}>
      {outline ? renderContent() : null}
    </Modal>
  );
};

export default ExportToNotionModal;
