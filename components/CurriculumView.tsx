

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
import SigmaIcon from './icons/SigmaIcon';
import BrainIcon from './icons/BrainIcon';
import MagnetIcon from './icons/MagnetIcon';
import AtomIcon from './icons/AtomIcon';
import BooksIcon from './icons/BooksIcon';
import MessageCircleIcon from './icons/MessageCircleIcon';
import GridIcon from './icons/GridIcon';
import ListIcon from './icons/ListIcon';
import TimerIcon from './icons/TimerIcon';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

const CURRICULUM_SUBJECT_VIEW_KEY = 'curriculum-subject-view-preference';
const CURRICULUM_THEME_VIEW_KEY = 'curriculum-theme-view-preference';
const CURRICULUM_TIMER_PLAN_KEY = 'curriculum-timer-plan-v1';


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
    <div className="mt-2 ml-4 mr-2 mb-2 p-4 bg-slate-900/70 rounded-xl border border-slate-800">
        <p className="text-sm text-slate-300 mb-3 font-semibold">How do you want to create this outline?</p>
        <div className="space-y-3">
            <button onClick={onUploadClick} disabled={isReadingFile} className="w-full flex items-center gap-3 p-3 bg-slate-800/80 rounded-lg text-white hover:bg-sky-500/10 transition-all duration-200 border border-slate-700 hover:border-sky-500/50 disabled:opacity-50 hover:scale-[1.02] active:scale-100">
                {isReadingFile ? <Spinner className="w-5 h-5" /> : <UploadIcon className="w-5 h-5 text-sky-400"/>}
                <span className="text-left"><span className="font-semibold">Upload Materials</span><span className="text-xs font-normal text-slate-400 block">Use your own PDF or text file</span></span>
            </button>
            <button onClick={onAiClick} className="w-full flex items-center gap-3 p-3 bg-slate-800/80 rounded-lg text-white hover:bg-sky-500/10 transition-all duration-200 border border-slate-700 hover:border-sky-500/50 hover:scale-[1.02] active:scale-100">
                <StarIcon className="w-5 h-5 text-sky-400"/>
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

type TimerPlan = {
  days: number;
  hours: number;
  deadline?: string; // yyyy-mm-dd
};

// Preference Helpers
const getPreference = (source: CurriculumSource): 'study' | 'regenerate' | null => {
    const key = `outline-preference-${source.subjectKey}-${source.theme}-${source.unit || ''}`;
    return localStorage.getItem(key) as 'study' | 'regenerate' | null;
};
const setPreference = (source: CurriculumSource, choice: 'study' | 'regenerate') => {
    const key = `outline-preference-${source.subjectKey}-${source.theme}-${source.unit || ''}`;
    localStorage.setItem(key, choice);
};

const formatDaysHours = (plan?: TimerPlan) => {
    if (!plan) return null;
    const days = Math.max(0, Math.floor(plan.days || 0));
    const hours = Math.max(0, Math.floor(plan.hours || 0));
    return `${days}d:${hours}h`;
};

const isPastDeadline = (plan?: TimerPlan) => {
    if (!plan?.deadline) return false;
    return new Date(plan.deadline) < new Date(new Date().toDateString());
};

const CalendarIcon: React.FC<{className?: string}> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
);

const TimerPopover: React.FC<{
    label: string;
    plan?: TimerPlan;
    onSave: (plan: TimerPlan) => void;
}> = ({ label, plan, onSave }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [days, setDays] = useState(String(plan?.days ?? 0));
    const [hours, setHours] = useState(String(plan?.hours ?? 0));
    const [deadline, setDeadline] = useState(plan?.deadline || '');

    useEffect(() => {
        setDays(String(plan?.days ?? 0));
        setHours(String(plan?.hours ?? 0));
        setDeadline(plan?.deadline || '');
    }, [plan]);

    const focusedHours = (parseInt(days, 10) || 0) * 24 + (parseInt(hours, 10) || 0);
    const translatedDays = (focusedHours / 6).toFixed(1);

    const handleSave = () => {
        onSave({
            days: Math.max(0, parseInt(days, 10) || 0),
            hours: Math.max(0, Math.min(23, parseInt(hours, 10) || 0)),
            deadline: deadline || undefined,
        });
        setIsOpen(false);
        setShowCalendar(false);
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(v => !v); }}
                className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-sky-500/20 border border-slate-700 hover:border-sky-500/40 transition-all"
                title="Set timer"
            >
                <TimerIcon className="w-4 h-4" />
            </button>
            {isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-11 w-72 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl z-30 backdrop-blur"
                >
                    <p className="text-xs text-slate-300 font-semibold mb-2">{label} timer</p>
                    <div className="grid grid-cols-2 gap-2">
                        <input value={days} onChange={(e) => setDays(e.target.value)} type="number" min="0" className="w-full p-2 text-xs rounded-md bg-slate-800 border border-slate-700 text-white" placeholder="Days" />
                        <input value={hours} onChange={(e) => setHours(e.target.value)} type="number" min="0" max="23" className="w-full p-2 text-xs rounded-md bg-slate-800 border border-slate-700 text-white" placeholder="Hours" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Approx real-time: {translatedDays} days @ 6h/day</span>
                        <button onClick={() => setShowCalendar(v => !v)} className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800">
                            <CalendarIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {showCalendar && (
                        <div className="mt-2">
                            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full p-2 text-xs rounded-md bg-slate-800 border border-slate-700 text-white" />
                        </div>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => setIsOpen(false)} className="text-xs px-3 py-1.5 rounded-md bg-slate-700 text-white">Close</button>
                        <button onClick={handleSave} className="text-xs px-3 py-1.5 rounded-md bg-sky-500 text-white">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProgressDisplay: React.FC<{ completed: number; total: number; percentage: number }> = ({ completed, total, percentage }) => {
    const isComplete = percentage === 100;
    return (
        <div className="w-28 flex items-center gap-3" title={`${completed}/${total} objectives completed`}>
            <div className="w-full bg-slate-700/50 rounded-full h-2 flex-1">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-400' : 'bg-sky-500'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className="text-sm font-mono text-slate-400 w-10 text-right">{Math.round(percentage)}%</span>
        </div>
    );
};

const ThemeItem: React.FC<{
    theme: CurriculumTheme;
    subjectKey: string;
    findExistingOutline: (source: CurriculumSource) => StudyOutline | undefined;
    onSelectTheme: (theme: CurriculumTheme) => void;
    view: 'grid' | 'list';
    timerPlan?: TimerPlan;
    onSaveTimerPlan: (plan: TimerPlan) => void;
}> = ({ theme, subjectKey, findExistingOutline, onSelectTheme, view, timerPlan, onSaveTimerPlan }) => {
    const themeProgress = useMemo(() => {
        let completed = 0, total = 0;
        theme.units.forEach(unit => {
            const outline = findExistingOutline({ subjectKey: subjectKey, theme: theme.theme, unit: unit.unit });
            if (outline && outline.isThemeOutline === false && outline.mainTopics) { // Ensure it's not a theme outline itself
                const unitObjectives = (outline.mainTopics || []).flatMap(t => t.subtopics.flatMap(s => s.learningObjectives));
                total += unitObjectives.length;
                completed += (outline.completedObjectives || []).length;
            } else if (outline?.isThemeOutline === true) {
                const themeUnit = outline.units?.find(u => u.unitTitle === unit.unit);
                if(themeUnit) {
                    const unitObjectives = (themeUnit.mainTopics || []).flatMap(t => t.subtopics.flatMap(s => s.learningObjectives));
                    total += unitObjectives.length;
                    const completedIds = new Set(outline.completedObjectives);
                    completed += unitObjectives.filter(obj => completedIds.has(obj.id)).length;
                }
            }
        });
        return total > 0 ? { completed, total, percentage: (completed / total) * 100 } : null;
    }, [findExistingOutline, theme, subjectKey]);

    if (view === 'grid') {
        return (
            <div className="w-full p-4 glass-panel rounded-2xl hover:bg-sky-500/5 hover:border-sky-500/30 transition-all duration-300 flex flex-col justify-between aspect-[4/3]">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <button onClick={() => onSelectTheme(theme)} className="text-left">
                            <span className="font-semibold text-xl text-slate-100">{theme.theme}</span>
                            {theme.class && <span className="text-sm font-normal text-slate-400 block">({theme.class})</span>}
                            {formatDaysHours(timerPlan) && (
                                <span className={`text-xs mt-1 inline-block ${isPastDeadline(timerPlan) ? 'text-red-400' : 'text-sky-300'}`}>{formatDaysHours(timerPlan)}</span>
                            )}
                        </button>
                    </div>
                    <TimerPopover label={theme.theme} plan={timerPlan} onSave={onSaveTimerPlan} />
                </div>
                {themeProgress && <ProgressDisplay {...themeProgress} />}
            </div>
        );
    }

    return (
        <div className="w-full text-left p-4 sm:p-6 glass-panel rounded-2xl hover:bg-sky-500/5 hover:border-sky-500/30 transition-all duration-300 flex justify-between items-center">
            <button onClick={() => onSelectTheme(theme)} className="flex-1 text-left">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-2xl text-slate-100">{theme.theme}</span>
                    {theme.class && <span className="text-base font-normal text-slate-400 ml-1">({theme.class})</span>}
                    {formatDaysHours(timerPlan) && (
                        <span className={`text-sm font-semibold ${isPastDeadline(timerPlan) ? 'text-red-400' : 'text-sky-300'}`}>{formatDaysHours(timerPlan)}</span>
                    )}
                </div>
            </button>
            <div className="flex items-center gap-4">{themeProgress && <ProgressDisplay {...themeProgress} />}<ChevronRightIcon className="w-8 h-8 text-slate-500" /></div>
            <div className="ml-3"><TimerPopover label={theme.theme} plan={timerPlan} onSave={onSaveTimerPlan} /></div>
        </div>
    );
};

const UnitItem: React.FC<{
    unit: CurriculumUnit;
    subjectKey: string;
    theme: CurriculumTheme;
    findExistingOutline: (source: CurriculumSource) => StudyOutline | undefined;
    toggleGenerationOptions: (key: string, context: GenerationContext) => void;
    buildContext: (type: 'unit', item: CurriculumUnit, subjectKey: string, theme: CurriculumTheme) => GenerationContext;
    activeGenerationKey: string | null;
    isReadingFile: boolean;
    onUploadClick: () => void;
    onAiClick: () => void;
    timerPlan?: TimerPlan;
    onSaveTimerPlan: (plan: TimerPlan) => void;
}> = ({ unit, subjectKey, theme, findExistingOutline, toggleGenerationOptions, buildContext, activeGenerationKey, isReadingFile, onUploadClick, onAiClick, timerPlan, onSaveTimerPlan }) => {
    const source = { subjectKey: subjectKey, theme: theme.theme, unit: unit.unit };
    const outlineForUnit = findExistingOutline(source);
    
    const progress = useMemo(() => {
        if (!outlineForUnit) return null;
        const allObjectives = (outlineForUnit.mainTopics || []).flatMap(t => t.subtopics.flatMap(s => s.learningObjectives));
        const total = allObjectives.length;
        if (total === 0) return null;
        const completed = outlineForUnit.completedObjectives.length;
        return { completed, total, percentage: (completed / total) * 100 };
    }, [outlineForUnit]);

    const unitKey = `unit-${subjectKey}-${theme.theme}-${unit.unit}`;
    const unitContext = buildContext('unit', unit, subjectKey, theme);
    
    return (
        <li>
            <div className="w-full text-left p-4 rounded-lg hover:bg-sky-500/10 transition-colors flex justify-between items-center">
                <div>
                    {outlineForUnit && <span className="w-2.5 h-2.5 bg-green-400 rounded-full mr-4 inline-block ring-4 ring-green-400/20" title="Outline exists"></span>}
                    <button onClick={() => toggleGenerationOptions(unitKey, unitContext)} className="text-slate-200 text-lg">{unit.unit}</button>
                    {formatDaysHours(timerPlan) && (
                        <span className={`ml-3 text-xs font-semibold ${isPastDeadline(timerPlan) ? 'text-red-400' : 'text-sky-300'}`}>{formatDaysHours(timerPlan)}</span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {progress && <ProgressDisplay {...progress} />}
                    <TimerPopover label={unit.unit} plan={timerPlan} onSave={onSaveTimerPlan} />
                </div>
            </div>
            <div className={`accordion-content ${activeGenerationKey === unitKey ? 'expanded' : ''}`}>
                <div className="accordion-content-inner">
                    <GenerationOptions 
                        onUploadClick={onUploadClick} 
                        onAiClick={onAiClick}
                        isReadingFile={isReadingFile}
                    />
                </div>
            </div>
        </li>
    );
};


const CurriculumView: React.FC<CurriculumViewProps> = ({ onGenerate, outlines, onSelectOutline, onDeleteOutlineBySource, selectedSubjectKey, setSelectedSubjectKey, defaultSettings }) => {
  const [activeGenerationKey, setActiveGenerationKey] = useState<string | null>(null);
  const [generationContext, setGenerationContext] = useState<GenerationContext | null>(null);
  const [existingOutlineTarget, setExistingOutlineTarget] = useState<StudyOutline | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isFileReading, setIsFileReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<CurriculumTheme | null>(null);
  
  const [subjectView, setSubjectView] = useState<'grid' | 'list'>(() => (localStorage.getItem(CURRICULUM_SUBJECT_VIEW_KEY) as 'grid' | 'list') || 'grid');
  const [themeView, setThemeView] = useState<'grid' | 'list'>(() => (localStorage.getItem(CURRICULUM_THEME_VIEW_KEY) as 'grid' | 'list') || 'list');
  const [timerPlans, setTimerPlans] = useState<Record<string, TimerPlan>>(() => {
    try {
      const saved = localStorage.getItem(CURRICULUM_TIMER_PLAN_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });


  useEffect(() => { localStorage.setItem(CURRICULUM_SUBJECT_VIEW_KEY, subjectView); }, [subjectView]);
  useEffect(() => { localStorage.setItem(CURRICULUM_THEME_VIEW_KEY, themeView); }, [themeView]);
  useEffect(() => { localStorage.setItem(CURRICULUM_TIMER_PLAN_KEY, JSON.stringify(timerPlans)); }, [timerPlans]);

  const getTimerKey = useCallback((source: CurriculumSource) => `${source.subjectKey}::${source.theme}::${source.unit || '__theme__'}`, []);
  const saveTimerPlan = useCallback((source: CurriculumSource, plan: TimerPlan) => {
    const key = getTimerKey(source);
    setTimerPlans(prev => ({ ...prev, [key]: plan }));
  }, [getTimerKey]);
  const findTimerPlan = useCallback((source: CurriculumSource) => timerPlans[getTimerKey(source)], [timerPlans, getTimerKey]);


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

  const findExistingOutline = useCallback((source: CurriculumSource) => {
    const key = `${source.subjectKey}-${source.theme}-${source.unit || ''}`;
    return outlinesBySource.get(key);
  }, [outlinesBySource]);

  const buildContext = useCallback((type: 'theme' | 'unit', item: CurriculumTheme | CurriculumUnit, subjectKey: string, theme?: CurriculumTheme): GenerationContext => {
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
  }, []);

  const toggleGenerationOptions = (key: string, context: GenerationContext) => {
    const existingOutline = findExistingOutline(context.source);
    const storedPreference = getPreference(context.source);
    
    if (existingOutline && storedPreference) {
        if (storedPreference === 'study') {
            onSelectOutline(existingOutline.id);
        } else {
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
    
    setActiveGenerationKey(prevKey => prevKey === key ? null : key);
    setGenerationContext(context);
  };
  
  const handleConfirmStudy = () => {
    if (!existingOutlineTarget) return;
    if (rememberChoice) setPreference(existingOutlineTarget.curriculumSource!, 'study');
    onSelectOutline(existingOutlineTarget.id);
    setExistingOutlineTarget(null);
    setRememberChoice(false);
  };

  const handleConfirmRegenerate = () => {
    if (!existingOutlineTarget?.curriculumSource) return;
    const source = existingOutlineTarget.curriculumSource;
    if (rememberChoice) setPreference(source, 'regenerate');

    const { subjectKey, theme, unit } = source;
    const isTheme = !unit;
    const curriculumTheme = curriculumData[subjectKey]?.themes.find(t => t.theme === theme);
    const item = isTheme ? curriculumTheme : curriculumTheme?.units.find(u => u.unit === unit);

    onDeleteOutlineBySource(source);
    if (item && curriculumTheme) {
      const context = buildContext(isTheme ? 'theme' : 'unit', item, subjectKey, curriculumTheme);
      setActiveGenerationKey(isTheme ? `theme-${subjectKey}-${theme}` : `unit-${subjectKey}-${theme}-${unit}`);
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
            console.error("Error processing file:", err); alert("Failed to process the uploaded file.");
        } finally {
            setIsFileReading(false); setActiveGenerationKey(null); setGenerationContext(null);
        }
      };
      reader.onerror = () => { alert("Failed to read file."); setIsFileReading(false); }
      if (selectedFile.type === 'application/pdf') { reader.readAsArrayBuffer(selectedFile); } else { reader.readAsText(selectedFile); }
    }
  }, [generationContext, onGenerate, defaultSettings]);

  const handleGenerateWithAi = () => {
    if (generationContext) {
        onGenerate(generationContext.context, generationContext.title, defaultSettings, generationContext.type === 'theme', generationContext.source);
        setActiveGenerationKey(null); setGenerationContext(null);
    }
  };

  const subject = selectedSubjectKey ? curriculumData[selectedSubjectKey] : null;

  const handleBackToSubjects = () => {
    setSelectedSubjectKey(null);
    setSelectedTheme(null);
  };

  const handleBackToThemes = () => {
    setSelectedTheme(null);
  };
  
  const activeView = selectedTheme ? 'units' : selectedSubjectKey ? 'themes' : 'subjects';

  return (
    <div className="relative w-full h-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md" />
      
      {/* View 1: Subject Grid */}
      <div className={`absolute w-full h-full transition-opacity duration-300 ease-out ${activeView === 'subjects' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between items-center mb-6">
            <p className="text-xl text-slate-300">Select a subject to browse its curriculum.</p>
            <div className="flex bg-slate-900/70 p-1 rounded-lg border border-slate-700">
                <button onClick={() => setSubjectView('grid')} title="Grid View" className={`p-2 rounded-md transition-colors ${subjectView === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><GridIcon className="w-5 h-5"/></button>
                <button onClick={() => setSubjectView('list')} title="List View" className={`p-2 rounded-md transition-colors ${subjectView === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><ListIcon className="w-5 h-5"/></button>
            </div>
        </div>
        <div className={`max-w-6xl mx-auto px-4 ${subjectView === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6' : 'space-y-3'}`}>
            {SUBJECT_ORDER.map(key => {
                const Icon = subjectIcons[key];
                return subjectView === 'grid' ? (
                    <button key={key} onClick={() => setSelectedSubjectKey(key)} className="aspect-square glass-panel rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-3 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all active:scale-95">
                        {Icon && <Icon className="w-12 h-12 text-sky-400"/>}
                        <span className="font-semibold text-lg text-slate-100">{key}</span>
                    </button>
                ) : (
                   <button key={key} onClick={() => setSelectedSubjectKey(key)} className="w-full text-left p-4 glass-panel rounded-xl hover:bg-sky-500/5 hover:border-sky-500/30 transition-all duration-300 flex justify-between items-center active:scale-[0.99]">
                        <div className="flex items-center gap-4">
                            {Icon && <Icon className="w-8 h-8 text-sky-400"/>}
                            <span className="font-semibold text-xl text-slate-100">{key}</span>
                        </div>
                        <ChevronRightIcon className="w-6 h-6 text-slate-500" />
                   </button>
                );
            })}
        </div>
      </div>

      {/* View 2: Theme List */}
      <div className={`absolute w-full h-full transition-opacity duration-300 ease-out ${activeView === 'themes' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {subject && (
          <div className="h-full flex flex-col">
            <header className="flex-shrink-0 mb-6 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={handleBackToSubjects} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"><ArrowLeftIcon className="w-6 h-6"/></button>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-100">{subject.title}</h2>
                </div>
                <div className="flex bg-slate-900/70 p-1 rounded-lg border border-slate-700">
                    <button onClick={() => setThemeView('grid')} title="Grid View" className={`p-2 rounded-md transition-colors ${themeView === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><GridIcon className="w-5 h-5"/></button>
                    <button onClick={() => setThemeView('list')} title="List View" className={`p-2 rounded-md transition-colors ${themeView === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><ListIcon className="w-5 h-5"/></button>
                </div>
            </header>
            <div className={`flex-1 overflow-y-auto pr-2 ${themeView === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-4'}`}>
                {subject.themes.map((theme, index) => (
                    <ThemeItem
                        key={index}
                        theme={theme}
                        subjectKey={selectedSubjectKey!}
                        findExistingOutline={findExistingOutline}
                        onSelectTheme={setSelectedTheme}
                        view={themeView}
                        timerPlan={findTimerPlan({ subjectKey: selectedSubjectKey!, theme: theme.theme, unit: '' })}
                        onSaveTimerPlan={(plan) => saveTimerPlan({ subjectKey: selectedSubjectKey!, theme: theme.theme, unit: '' }, plan)}
                    />
                ))}
            </div>
          </div>
        )}
      </div>
      
      {/* View 3: Unit List */}
      <div className={`absolute w-full h-full transition-opacity duration-300 ease-out ${activeView === 'units' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {selectedTheme && selectedSubjectKey && (
          <div className="h-full flex flex-col">
            <header className="flex-shrink-0 mb-6 flex items-center gap-4">
              <button onClick={handleBackToThemes} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"><ArrowLeftIcon className="w-6 h-6"/></button>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-100">{selectedTheme.theme}</h2>
                {selectedTheme.class && <p className="text-lg text-slate-400">({selectedTheme.class})</p>}
              </div>
            </header>
             <div className="flex-1 overflow-y-auto pr-2 glass-panel rounded-2xl p-4">
                <ul className="divide-y divide-slate-800/80">
                    {selectedTheme.units.map(unit => (
                        <UnitItem 
                            key={unit.unit}
                            unit={unit}
                            subjectKey={selectedSubjectKey}
                            theme={selectedTheme}
                            findExistingOutline={findExistingOutline}
                            toggleGenerationOptions={toggleGenerationOptions}
                            buildContext={buildContext}
                            activeGenerationKey={activeGenerationKey}
                            isReadingFile={isFileReading}
                            onUploadClick={() => fileInputRef.current?.click()}
                            onAiClick={handleGenerateWithAi}
                            timerPlan={findTimerPlan({ subjectKey: selectedSubjectKey, theme: selectedTheme.theme, unit: unit.unit })}
                            onSaveTimerPlan={(plan) => saveTimerPlan({ subjectKey: selectedSubjectKey, theme: selectedTheme.theme, unit: unit.unit }, plan)}
                        />
                    ))}
                </ul>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!existingOutlineTarget} onClose={() => setExistingOutlineTarget(null)} title="Outline Exists" backdrop={false} variant="solid">
          <p className="text-slate-300 mb-4">You already have an outline for <strong className="text-white">{existingOutlineTarget?.curriculumSource?.unit || existingOutlineTarget?.curriculumSource?.theme}</strong>. What would you like to do?</p>
          <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setExistingOutlineTarget(null)} className="py-2 px-4 rounded-lg font-semibold text-white bg-slate-700 hover:bg-slate-600">Cancel</button>
              <button onClick={handleConfirmRegenerate} className="py-2 px-4 rounded-lg font-semibold text-white bg-amber-500 hover:bg-amber-600">Regenerate</button>
              <button onClick={handleConfirmStudy} className="py-2 px-4 rounded-lg font-semibold text-white bg-sky-500 hover:bg-sky-600">Study</button>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-slate-400">
                <input type="checkbox" checked={rememberChoice} onChange={e => setRememberChoice(e.target.checked)} className="bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500/50" />
                Remember my choice for this item
            </label>
          </div>
      </Modal>
    </div>
  );
};

export default CurriculumView;
