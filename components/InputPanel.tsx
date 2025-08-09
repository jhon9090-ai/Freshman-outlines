

import React, { useState, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AdvancedSettings, AppStatus, CurriculumSource } from '../types';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';
import FileTextIcon from './icons/FileTextIcon';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface MainViewProps {
  onGenerate: (generationInput: string, title: string, settings: AdvancedSettings, isTheme: boolean, curriculumSource?: CurriculumSource) => void;
  status: AppStatus;
  error: string | null;
  onClearError: () => void;
  defaultSettings: AdvancedSettings;
}

const InputPanel: React.FC<MainViewProps> = ({ onGenerate, status, error, onClearError, defaultSettings }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileReading, setIsFileReading] = useState(false);
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings);
  
  useEffect(() => {
    // Sync with global default settings if they change, but don't overwrite if modal is open
    if (!isModalOpen) {
      setSettings(defaultSettings);
    }
  }, [defaultSettings, isModalOpen]);

  useEffect(() => {
    if (error) {
        const timer = setTimeout(() => {
            onClearError();
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [error, onClearError]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
          setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setIsFileReading(true);
      setFileContent('');
      onClearError();

      if (selectedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (arrayBuffer) {
            try {
              const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                fullText += pageText + '\n';
              }
              setFileContent(fullText);
            } catch (pdfError) {
              console.error('Error parsing PDF:', pdfError);
              alert('Failed to parse PDF file. It might be corrupted or protected.');
              setFile(null);
            } finally {
              setIsFileReading(false);
            }
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFileContent(event.target?.result as string);
          setIsFileReading(false);
        };
        reader.onerror = () => {
          console.error('Error reading file.');
          alert('Failed to read the file.');
          setFile(null);
          setIsFileReading(false);
        }
        reader.readAsText(selectedFile);
      }
    }
  }, [title, onClearError]);

  const handleGenerateClick = () => {
    if (title) {
      const generationInput = fileContent || title;
      onGenerate(generationInput, title, settings, false);
    }
  };
  
  const handleSettingsChange = <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto glass-panel rounded-lg p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">What do you want to master?</h2>
          <p className="text-slate-400">Start by giving your outline a title.</p>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-300">Topic or Subject Name</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Quantum Mechanics, The Krebs Cycle" className="w-full p-3 bg-slate-800/60 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)] text-lg"/>
        </div>

        <div className="space-y-2">
            {!isUploadVisible && (
              <button onClick={() => setIsUploadVisible(true)} className="w-full text-sm text-center text-[rgba(var(--primary-rgb),1)] hover:text-[rgba(var(--primary-rgb),0.8)] transition-colors py-2 active:scale-95">
                  + Add supplemental materials (optional)
              </button>
            )}
             <div className={`accordion-content ${isUploadVisible ? 'expanded' : ''}`}>
                <div className="accordion-content-inner pt-2">
                  <div className="relative border-2 border-dashed border-gray-500 rounded-lg p-6 text-center hover:border-[rgba(var(--primary-rgb),1)] transition-all duration-300">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.txt,.md" disabled={status === 'loading' || isFileReading}/>
                    <div className="text-gray-400 pointer-events-none">
                      <FileTextIcon className="w-8 h-8 mx-auto mb-2" />
                      {isFileReading ? <p className="font-semibold">Reading file...</p> : file ? <p className="font-semibold truncate">{file.name}</p> : <><p className="font-semibold">Drag & drop or click to upload</p><p className="text-xs">.pdf, .txt, .md</p></>}
                    </div>
                  </div>
                </div>
            </div>
        </div>
        
        <div className="space-y-2 pt-4 border-t border-white/10">
            <button onClick={() => setIsModalOpen(true)} className="w-full text-sm text-center text-[rgba(var(--primary-rgb),1)] hover:text-[rgba(var(--primary-rgb),0.8)] transition-colors active:scale-95">
              Advanced Settings
            </button>
            <button
              onClick={handleGenerateClick}
              disabled={!title || status === 'loading' || isFileReading}
              className="w-full bg-gradient-to-r from-[rgba(var(--primary-rgb),0.8)] to-[rgba(var(--primary-rgb),1)] text-white font-bold py-3 px-4 rounded-lg hover:from-[rgba(var(--primary-rgb),1)] hover:to-[rgba(var(--primary-rgb),0.9)] disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)] active:scale-95"
            >
              {status === 'loading' || isFileReading ? <Spinner className="-ml-1 mr-3 h-5 w-5" /> : 'Generate Outline'}
            </button>
        </div>

        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 text-xs rounded-lg p-3 mt-4 animate-fadeIn">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Advanced Settings">
        <div className="space-y-4 text-sm">
          <div>
            <label className="block mb-1 font-semibold text-slate-300">Outline Depth</label>
            <select value={settings.outlineDepth} onChange={(e) => handleSettingsChange('outlineDepth', e.target.value as any)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]">
              <option>Concise</option>
              <option>Standard</option>
              <option>Detailed</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-slate-300">Study Pace</label>
            <select value={settings.studyPace} onChange={(e) => handleSettingsChange('studyPace', e.target.value as any)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]">
              <option>Casual</option>
              <option>Moderate</option>
              <option>Intensive</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-slate-300">Learning Goals (Optional)</label>
            <input type="text" placeholder="e.g., 'Focus on practical applications'" value={settings.learningGoals} onChange={(e) => handleSettingsChange('learningGoals', e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"/>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-slate-300">Subject Emphasis (Optional)</label>
            <input type="text" placeholder="e.g., 'Prioritize chapters 3 and 5'" value={settings.subjectEmphasis} onChange={(e) => handleSettingsChange('subjectEmphasis', e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"/>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InputPanel;