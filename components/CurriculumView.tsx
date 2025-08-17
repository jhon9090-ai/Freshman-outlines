import React, { useState, useCallback, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AdvancedSettings, CurriculumTheme, CurriculumUnit, StudyOutline, CurriculumSource } from '../types';
import { curriculumData } from '../constants';
import { SUBJECT_ORDER } from '../constants';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';
import UploadIcon from './icons/UploadIcon';
import StarIcon from './icons/StarIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

// New Icons
import SigmaIcon from './icons/SigmaIcon';
import BrainIcon from './icons/BrainIcon';
import MagnetIcon from './icons/MagnetIcon';
import AtomIcon from './icons/AtomIcon';
import BooksIcon from './icons/BooksIcon';
import MessageCircleIcon from './icons/MessageCircleIcon';
import GridIcon from './icons/GridIcon';
import ListIcon from './icons/ListIcon';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

const subjectIcons: { [key: string]: React.FC<{className?: string}> } = {
  'Mathematics': SigmaIcon,
  'Biology': BrainIcon,
  'Physics': MagnetIcon,
  'Chemistry': AtomIcon,
  'SAT': BooksIcon,
  'English': MessageCircleIcon,
};

interface GenerationOptionsProps {
    onUploadClick: () => void;
    onAiClick: () => void;
    isReadingFile: boolean;
}

const GenerationOptions: React.FC<GenerationOptionsProps> = ({ onUploadClick, onAiClick, isReadingFile }) => (
    <div className="mt-2 ml-4 mr-2 mb-2 p-3 bg-slate-800/60 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-300 mb-3 font-semibold">How do you want to create this outline?</p>
        <div className="space-y-2">
            <button onClick={onUploadClick} disabled={isReadingFile} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-md text-white hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-[rgba(var(--primary-rgb),0.3)] disabled:opacity-50 hover:scale-[1.02] active:scale-100">
                {isReadingFile ? <Spinner className="w-5 h-5" /> : <UploadIcon className="w-5 h-5 text-[rgba(var(--primary-rgb),1)]"/>}
                <span className="text-left"><span className="font-semibold">Upload Materials</span><span className="text-xs font-normal text-slate-400 block">Use your own PDF or text file</span></span>
            </button>
            <button onClick={onAiClick} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-md text-white hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-[rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-100">
                <StarIcon className="w-5 h-5 text-[rgba(var(--primary-rgb),1)]"/>
                 <span className="text-left"><span className="font-semibold">Generate with AI</span><span className="text-xs font-normal text-slate-400 block">Create from curriculum topic</span></span>
            </button>
        </div>
    </div>
);


interface CurriculumViewProps {
  onGenerate: (generationInput: string, title: string, settings: AdvancedSettings, isTheme: boolean, curriculumSource?: CurriculumSource) => void;
  outlines: StudyOutline[];
  onSelectOutline: (id: string) => void;
  onDeleteOutlineBySource: (source: CurriculumSource) => void;
  selectedSubjectKey: string | null;
  setSelectedSubjectKey: (key: string | null) => void;
  defaultSettings: AdvancedSettings;
}

type GenerationContext = {
  type: 'theme' | 'unit';
  title: string;
  context: string;
  source: CurriculumSource;
}

// --- Preference Helpers ---
const getPreference = (source: CurriculumSource): 'study' | 'regenerate' | null => {
    const key = `outline-preference-${source.subjectKey}-${source.theme}-${source.unit || ''}`;
    return localStorage.getItem(key) as 'study' | 'regenerate' | null;
};

const setPreference = (source: CurriculumSource, choice: 'study' | 'regenerate') => {
    const key = `outline-preference-${source.subjectKey}-${source.theme}-${source.unit || ''}`;
    localStorage.setItem(key, choice);
};
// -------------------------


const CurriculumView: React.FC<CurriculumViewProps> = ({ onGenerate, outlines, onSelectOutline, onDeleteOutlineBySource, selectedSubjectKey, setSelectedSubjectKey, defaultSettings }) => {
  const [activeGenerationKey, setActiveGenerationKey] = useState<string | null>(null);
  const [generationContext, setGenerationContext] = useState<GenerationContext | null>(null);
  const [existingOutlineTarget, setExistingOutlineTarget] = useState<StudyOutline | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isFileReading, setIsFileReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<CurriculumTheme | null>(null);
  const [subjectView, setSubjectView] = useState<'grid' | 'list'>('grid');

  const outlinesBySource = useMemo(() => {
    const map = new Map<string, StudyOutline>();
    outlines.forEach(outline => {
        if (outline.curriculumSource) {
            const key = `${outline.curriculumSource.subjectKey}-${outline.curriculumSource.theme}-${outline.curriculumSource.unit || ''}`;
            map.set(key, outline);
        }
    });
    return map;
  }, [outlines]);

  const findExistingOutline = (source: CurriculumSource) => {
    const key = `${source.subjectKey}-${source.theme}-${source.unit || ''}`;
    return outlinesBySource.get(key);
  };

  const buildContext = (type: 'theme' | 'unit', item: CurriculumTheme | CurriculumUnit, subjectKey: string, theme?: CurriculumTheme): GenerationContext => {
    const isTheme = type === 'theme';
    const currentTheme = isTheme ? (item as CurriculumTheme) : theme!;
    const title = isTheme ? currentTheme.theme : (item as CurriculumUnit).unit;
    const unitName = isTheme ? "" : (item as CurriculumUnit).unit;
    
    const source: CurriculumSource = { subjectKey, theme: currentTheme.theme, unit: unitName };
    
    const unitList = isTheme ? `This theme includes the following units: ${currentTheme.units.map(u => u.unit).join(', ')}.` : '';
    const context = isTheme 
        ? `Generate a comprehensive study outline for the entire theme: "${title}". Subject: ${curriculumData[subjectKey].title}. ${unitList}`
        : `Generate a detailed study outline for the topic: "${title}". Subject: ${curriculumData[subjectKey].title}. Theme: ${theme!.theme}. Grade: ${(item as CurriculumUnit).grade}.`;

    return { type, title, context, source };
  };

  const toggleGenerationOptions = (key: string, context: GenerationContext) => {
    const existingOutline = findExistingOutline(context.source);
    const storedPreference = getPreference(context.source);
    
    if (existingOutline && storedPreference) {
        if (storedPreference === 'study') {
            onSelectOutline(existingOutline.id);
        } else { // 'regenerate'
            onDeleteOutlineBySource(context.source);
            setActiveGenerationKey(key);
            setGenerationContext(context);
        }
        return;
    }

    if (existingOutline) {
        setExistingOutlineTarget(existingOutline);
        return;
    }
    
    if (activeGenerationKey === key) {
        setActiveGenerationKey(null);
        setGenerationContext(null);
    } else {
        setActiveGenerationKey(key);
        setGenerationContext(context);
    }
  };
  
  const handleConfirmStudy = () => {
    if (!existingOutlineTarget) return;
    if (rememberChoice) {
        setPreference(existingOutlineTarget.curriculumSource!, 'study');
    }
    onSelectOutline(existingOutlineTarget.id);
    setExistingOutlineTarget(null);
    setRememberChoice(false);
  };

  const handleConfirmRegenerate = () => {
    if (!existingOutlineTarget?.curriculumSource) return;

    const source = existingOutlineTarget.curriculumSource;
    if (rememberChoice) {
        setPreference(source, 'regenerate');
    }

    const { subjectKey, theme, unit } = source;
    const isTheme = !unit;
    const key = isTheme ? `theme-${subjectKey}-${theme}` : `unit-${subjectKey}-${theme}-${unit}`;
    const curriculumTheme = curriculumData[subjectKey]?.themes.find(t => t.theme === theme);
    const item = isTheme ? curriculumTheme : curriculumTheme?.units.find(u => u.unit === unit);

    onDeleteOutlineBySource(source);

    if (item && curriculumTheme) {
      const context = buildContext(isTheme ? 'theme' : 'unit', item, subjectKey, curriculumTheme);
      setActiveGenerationKey(key);
      setGenerationContext(context);
    }
    
    setExistingOutlineTarget(null);
    setRememberChoice(false);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && generationContext) {
      setIsFileReading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
            let text = '';
            if (selectedFile.type === 'application/pdf') {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                }
            } else {
                text = event.target?.result as string;
            }
            onGenerate(generationContext.context + "\n\n--- User Provided File Content ---\n\n" + text, generationContext.title, defaultSettings, generationContext.type === 'theme', generationContext.source);
        } catch (err) {
            console.error("Error processing file:", err);
            alert("Failed to process the uploaded file.");
        } finally {
            setIsFileReading(false);
            setActiveGenerationKey(null);
            setGenerationContext(null);
        }
      };
      reader.onerror = () => { alert("Failed to read file."); setIsFileReading(false); }
      if (selectedFile.type === 'application/pdf') { reader.readAsArrayBuffer(selectedFile); } 
      else { reader.readAsText(selectedFile); }
    }
  }, [generationContext, onGenerate, defaultSettings]);

  const handleGenerateWithAi = () => {
    if (generationContext) {
        onGenerate(generationContext.context, generationContext.title, defaultSettings, generationContext.type === 'theme', generationContext.source);
        setActiveGenerationKey(null);
        setGenerationContext(null);
    }
  };

  const subject = selectedSubjectKey ? curriculumData[selectedSubjectKey] : null;

  const handleBackToSubjects = () => {
    setSelectedSubjectKey(null);
    setSelectedTheme(null);
    setExistingOutlineTarget(null);
    setActiveGenerationKey(null);
  };

  const handleBackToThemes = () => {
    setSelectedTheme(null);
    setActiveGenerationKey(null);
  };

  let content;

  // View 1: Unit List (when a theme is selected)
  if (selectedSubjectKey && selectedTheme && subject) {
    const theme = selectedTheme;
    const themeSource: CurriculumSource = { subjectKey: selectedSubjectKey, theme: theme.theme, unit: ''};
    const themeKey = `theme-${selectedSubjectKey}-${theme.theme}`;
    const themeContext = buildContext('theme', theme, selectedSubjectKey);

    content = (
      <div key="unit-details" className="flex flex-col h-full w-full animate-fadeInUp">
        <header className="flex-shrink-0 mb-4">
          <button onClick={handleBackToThemes} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4">
              <ArrowLeftIcon className="w-5 h-5"/> Back to Themes
          </button>
          <h2 className="font-heading text-2xl text-white">{theme.theme}</h2>
          {theme.class && <p className="text-slate-400 mt-1">{theme.class}</p>}
        </header>
        <main className="flex-1 overflow-y-auto pr-2 space-y-2">
           <ul className="space-y-1">
              {theme.units.map(unit => {
                  const source: CurriculumSource = { subjectKey: selectedSubjectKey!, theme: theme.theme, unit: unit.unit };
                  const hasOutline = !!findExistingOutline(source);
                  const unitKey = `unit-${selectedSubjectKey}-${theme.theme}-${unit.unit}`;
                  const unitContext = buildContext('unit', unit, selectedSubjectKey!, theme);
                  return (
                      <li key={unit.unit + unit.grade}>
                          <button onClick={() => toggleGenerationOptions(unitKey, unitContext)} className="w-full text-left p-3 rounded-md hover:bg-[rgba(var(--primary-rgb),0.15)] transition-colors flex justify-between items-center">
                              <div className="flex items-center">
                                  {hasOutline && <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0" title="Outline exists"></span>}
                                  <span className="text-slate-200">{unit.unit}</span>
                              </div>
                              {unit.grade && <span className="ml-2 text-xs text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">{unit.grade}</span>}
                          </button>
                          <div className={`accordion-content ${activeGenerationKey === unitKey ? 'expanded' : ''}`}>
                              <div className="accordion-content-inner">
                                  <GenerationOptions 
                                      onUploadClick={() => fileInputRef.current?.click()}
                                      onAiClick={handleGenerateWithAi}
                                      isReadingFile={isFileReading}
                                  />
                              </div>
                          </div>
                      </li>
                  )
              })}
          </ul>
          <div className="pt-4 mt-2 border-t border-slate-700/50">
              <button onClick={() => toggleGenerationOptions(themeKey, themeContext)} className="w-full text-left p-3 rounded-lg bg-[rgba(var(--primary-rgb),0.15)] hover:bg-[rgba(var(--primary-rgb),0.25)] transition-colors flex justify-between items-center border border-[rgba(var(--primary-rgb),0.2)] active:scale-[0.98]">
                  <div className="flex items-center">
                      {findExistingOutline(themeSource) && <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0" title="Outline exists"></span>}
                      <div className="flex flex-col">
                          <span className="text-slate-100 font-semibold">Create Outline for "{theme.theme}" Theme</span>
                          <span className="text-xs text-slate-400">Generates a single comprehensive outline for all units.</span>
                      </div>
                  </div>
                  <StarIcon className="w-5 h-5 text-[rgba(var(--primary-rgb),1)] flex-shrink-0"/>
              </button>
              <div className={`accordion-content ${activeGenerationKey === themeKey ? 'expanded' : ''}`}>
                  <div className="accordion-content-inner">
                      <GenerationOptions 
                          onUploadClick={() => fileInputRef.current?.click()}
                          onAiClick={handleGenerateWithAi}
                          isReadingFile={isFileReading}
                      />
                  </div>
              </div>
          </div>
        </main>
      </div>
    );
  // View 2: Theme List (when a subject is selected)
  } else if (subject) {
    content = (
      <div key="subject-details" className="flex flex-col h-full w-full animate-fadeInUp">
          <header className="flex-shrink-0 mb-4">
          <button onClick={handleBackToSubjects} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4">
              <ArrowLeftIcon className="w-5 h-5"/> Back to Subjects
          </button>
          <h1 className="font-heading text-2xl text-white">{subject.title}</h1>
          <p className="text-slate-400 mt-1">Select a theme to view its units.</p>
          </header>
          
          <main className="flex-1 overflow-y-auto pr-2 space-y-3">
              {subject.themes.map(theme => (
                <button 
                  key={theme.theme} 
                  onClick={() => setSelectedTheme(theme)} 
                  className="w-full text-left p-4 glass-panel rounded-lg border border-slate-700/50 hover:bg-[rgba(var(--primary-rgb),0.05)] hover:border-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 flex justify-between items-center active:scale-[0.99]"
                >
                    <div className="flex-1 flex items-center">
                        <span className="font-semibold text-xl text-slate-100">{theme.theme}</span>
                        {theme.class && <span className="text-sm font-normal text-slate-400 ml-2">({theme.class})</span>}
                    </div>
                    <ChevronRightIcon className="w-6 h-6 text-slate-400" />
                </button>
              ))}
          </main>
      </div>
    );
  // View 3: Subject Grid (initial view)
  } else {
    content = (
      <div key="subject-grid" className="animate-fadeInUp">
        <div className="flex justify-between items-center mb-6">
            <p className="text-lg text-slate-300">Select a subject to browse its curriculum.</p>
            <div className="flex bg-slate-800/60 p-1 rounded-lg">
                <button onClick={() => setSubjectView('grid')} title="Grid View" className={`p-1.5 rounded-md transition-colors ${subjectView === 'grid' ? 'bg-[rgba(var(--primary-rgb),1)] text-white' : 'text-slate-400 hover:bg-white/10'}`}>
                    <GridIcon className="w-5 h-5"/>
                </button>
                <button onClick={() => setSubjectView('list')} title="List View" className={`p-1.5 rounded-md transition-colors ${subjectView === 'list' ? 'bg-[rgba(var(--primary-rgb),1)] text-white' : 'text-slate-400 hover:bg-white/10'}`}>
                    <ListIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
        <div className="max-w-4xl mx-auto">
          {subjectView === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {SUBJECT_ORDER.map(key => {
                      const Icon = subjectIcons[key];
                      return (
                          <button key={key} onClick={() => setSelectedSubjectKey(key)} className="relative flex flex-col items-center justify-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 border-2 border-dashed border-slate-700 hover:border-[rgba(var(--primary-rgb),0.5)] transition-all aspect-square active:scale-95 hover:scale-105 hover:z-20">
                              {Icon && <Icon className="w-10 h-10 text-[rgba(var(--primary-rgb),0.8)]"/>}
                              <span className="font-semibold text-sm text-center text-slate-200">{key}</span>
                          </button>
                      )
                  })}
              </div>
          ) : (
              <div className="space-y-2">
                  {SUBJECT_ORDER.map(key => {
                      const Icon = subjectIcons[key];
                      return (
                          <button key={key} onClick={() => setSelectedSubjectKey(key)} className="w-full flex items-center gap-4 p-4 glass-panel rounded-lg hover:bg-[rgba(var(--primary-rgb),0.05)] hover:border-[rgba(var(--primary-rgb),0.3)] transition-all">
                              {Icon && <Icon className="w-8 h-8 text-[rgba(var(--primary-rgb),0.8)] flex-shrink-0"/>}
                              <span className="font-semibold text-lg text-slate-100">{curriculumData[key].title}</span>
                          </button>
                      )
                  })}
              </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md" />
       {/* Existing Outline Modal */}
      <Modal isOpen={!!existingOutlineTarget} onClose={() => { setExistingOutlineTarget(null); setRememberChoice(false); }} title={`Outline Exists for "${existingOutlineTarget?.title}"`}>
          <p className="text-slate-300 mb-4">An outline for this item has already been generated. What would you like to do?</p>
          <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg mb-4">
              <input 
                id="remember-choice"
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-[rgba(var(--primary-rgb),1)] focus:ring-[rgba(var(--primary-rgb),1)]"
              />
              <label htmlFor="remember-choice" className="text-sm text-slate-300">Remember my choice for this item</label>
          </div>
          <div className="space-y-2">
            <button onClick={handleConfirmStudy} className="w-full p-3 bg-[rgba(var(--primary-rgb),1)] text-white font-semibold rounded-lg hover:bg-[rgba(var(--primary-rgb),0.8)] transition-colors">Study Outline</button>
            <button onClick={handleConfirmRegenerate} className="w-full p-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors">Re-generate Outline</button>
          </div>
      </Modal>
    </>
  );
};

export default CurriculumView;