
import React, { useState, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AdvancedSettings, AppStatus } from '../types';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';
import FileTextIcon from './icons/FileTextIcon';
import SettingsIcon from './icons/SettingsIcon';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface MainViewProps {
  onGenerate: (generationInput: string, title: string, settings: AdvancedSettings, isTheme: boolean) => void;
  status: AppStatus;
  error: string | null;
  onClearError: () => void;
  defaultSettings: AdvancedSettings;
  onUpdateDefaultSettings: (newDefaults: AdvancedSettings) => void;
}

const InputPanel: React.FC<MainViewProps> = ({ onGenerate, status, error, onClearError, defaultSettings, onUpdateDefaultSettings }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileReading, setIsFileReading] = useState(false);
  const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings);
  
  useEffect(() => {
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

      const reader = new FileReader();

      reader.onload = async (event) => {
          let content = '';
          try {
              if (selectedFile.type === 'application/pdf') {
                  const arrayBuffer = event.target?.result as ArrayBuffer;
                  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                  for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const textContent = await page.getTextContent();
                      const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                      content += pageText + '\n';
                  }
              } else {
                  content = event.target?.result as string;
              }
              setFileContent(content);
          } catch (readError) {
              console.error('Error parsing file:', readError);
              alert(`Failed to parse ${selectedFile.type}. The file might be corrupted or in an unsupported format.`);
              setFile(null);
          } finally {
              setIsFileReading(false);
          }
      };

      reader.onerror = () => {
          console.error('Error reading file.');
          alert('Failed to read the file.');
          setFile(null);
          setIsFileReading(false);
      }

      if (selectedFile.type === 'application/pdf') {
        reader.readAsArrayBuffer(selectedFile);
      } else {
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
      <div className="w-full max-w-lg mx-auto glass-panel rounded-xl shadow-2xl overflow-hidden animate-fadeInUp">
        {/* File Upload Area */}
        <div className="relative p-6 text-center bg-black/10 border-b-2 border-dashed border-slate-700 hover:border-[rgba(var(--primary-rgb),1)] transition-all duration-300">
          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.txt,.md" disabled={status === 'loading' || isFileReading}/>
          <div className="text-gray-400 pointer-events-none flex flex-col items-center justify-center gap-2">
            <FileTextIcon className="w-10 h-10" />
            {isFileReading 
              ? <p className="font-semibold">Reading file...</p> 
              : file 
                ? <p className="font-semibold truncate">{file.name}</p> 
                : <>
                    <p className="font-semibold text-slate-300">Upload Your Materials</p>
                    <p className="text-xs">Drag & drop or click to upload (.pdf, .txt, .md)</p>
                  </>
            }
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-300">Topic or Subject Name</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Quantum Mechanics, The Krebs Cycle" 
              className="w-full p-3 bg-slate-800/60 border border-slate-600 rounded-md focus:ring-2 focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)] text-lg"
            />
            <p className="text-xs text-slate-500 mt-2">Required. If no file is uploaded, this topic will be used to generate the outline.</p>
          </div>

          {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 text-xs rounded-lg p-3 animate-fadeIn">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
              </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-black/20 flex items-center justify-between gap-4">
          <button 
            onClick={() => setIsModalOpen(true)} 
            title="Advanced Settings" 
            className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-100"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
          <button
            onClick={handleGenerateClick}
            disabled={!title || status === 'loading' || isFileReading}
            className="flex-1 bg-gradient-to-r from-[rgba(var(--primary-rgb),0.8)] to-[rgba(var(--primary-rgb),1)] text-white font-bold py-3 px-4 rounded-lg hover:from-[rgba(var(--primary-rgb),1)] hover:to-[rgba(var(--primary-rgb),0.9)] disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)] active:scale-95"
          >
            {status === 'loading' || isFileReading ? <Spinner className="-ml-1 mr-3 h-5 w-5" /> : 'Generate Outline'}
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Advanced Settings">
        <div className="space-y-4 text-sm">
           <div>
            <label className="block mb-1 font-semibold text-slate-300">My Goal Is</label>
            <select value={settings.intention} onChange={(e) => handleSettingsChange('intention', e.target.value as any)} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]">
              <option>Default</option>
              <option>Exam Prep</option>
              <option>Revision</option>
              <option>Knowledge Expansion</option>
            </select>
          </div>
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
          <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-white/10">
            <button 
              onClick={() => setSettings(defaultSettings)} 
              className="py-2 px-4 rounded-md text-white bg-white/10 hover:bg-white/20 text-xs font-semibold"
            >
              Restore Defaults
            </button>
            <button 
              onClick={() => { onUpdateDefaultSettings(settings); setIsModalOpen(false); }} 
              className="py-2 px-4 rounded-md text-white bg-[rgba(var(--primary-rgb),1)] hover:bg-[rgba(var(--primary-rgb),0.8)] text-xs font-semibold"
            >
              Save as Default
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InputPanel;
