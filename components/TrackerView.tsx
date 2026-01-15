
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { StudyOutline, TrackerState, AppSettings, DailyHabitLog, TrackerAIAnalysis, PastExamResult, ChatMessage, DailyTaskDetail, TeachedMaterial } from '../types';
import { generateTrackerAnalysis } from '../services/geminiService';
import Spinner from './ui/Spinner';
import StarIcon from './icons/StarIcon';
import Modal from './ui/Modal';
import { curriculumData } from '../constants';
import MentorChatModal from './MentorChatModal';
import MessageCircleIcon from './icons/MessageCircleIcon';
import SchoolIcon from './icons/SchoolIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import InfoIcon from './icons/InfoIcon';
import UploadIcon from './icons/UploadIcon';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface TrackerViewProps {
  outlines: StudyOutline[];
  trackerState: TrackerState;
  onUpdateTracker: (log: DailyHabitLog) => void;
  onCacheAnalysis: (analysis: TrackerAIAnalysis) => void;
  onLogExam: (result: PastExamResult) => void;
  onSetSchoolDay: (isSchool: boolean) => void;
  onUpdateChat: (newHistory: ChatMessage[]) => void;
  onTeachMentor: (material: TeachedMaterial) => void;
  appSettings: AppSettings;
}

const getEATDate = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Addis_Ababa"}));
};

const countTotalUnits = () => {
    let total = 0;
    Object.values(curriculumData).forEach(s => s.themes.forEach(t => total += t.units.length));
    return total;
};

const formatTime12h = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const TaskItem: React.FC<{ task: DailyTaskDetail, index: number }> = ({ task, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-sky-500/10 border-sky-500/40 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:border-sky-500/30'}`}>
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-5 p-5 text-left transition-colors group"
            >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${index === 0 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-sky-500 group-hover:text-white'}`}>{index+1}</div>
                <span className={`flex-1 text-lg font-medium leading-tight ${index === 0 ? 'text-white font-bold' : 'text-slate-200'}`}>{task.task}</span>
                <ChevronRightIcon className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-90 text-sky-400' : ''}`} />
            </button>
            <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="accordion-content-inner p-5 pt-0 space-y-4">
                    <div className="flex gap-3">
                        <div className="mt-1"><InfoIcon className="w-4 h-4 text-sky-400" /></div>
                        <div>
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Strategic Rationale</p>
                            <p className="text-slate-300 text-sm leading-relaxed">{task.rationale}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="mt-1"><StarIcon className="w-4 h-4 text-amber-400" /></div>
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Performance Impact</p>
                            <p className="text-slate-300 text-sm leading-relaxed">{task.impact}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrackerView: React.FC<TrackerViewProps> = ({ outlines, trackerState, onUpdateTracker, onCacheAnalysis, onLogExam, onSetSchoolDay, onUpdateChat, onTeachMentor, appSettings }) => {
  const [analysis, setAnalysis] = useState<TrackerAIAnalysis | null>(trackerState.cachedAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTeaching, setIsTeaching] = useState(false);
  const [currentTime, setCurrentTime] = useState(getEATDate());
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getEATDate()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalUnits = useMemo(() => countTotalUnits(), []);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await generateTrackerAnalysis(outlines, trackerState.habitHistory, appSettings, trackerState);
      setAnalysis(result);
      onCacheAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [outlines.length, trackerState.examResults.length, trackerState.isSchoolDay, trackerState.teachedMaterials.length]);

  const handleFileTeach = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTeaching(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            let content = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    content += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
                }
            } else {
                content = event.target?.result as string;
            }
            
            onTeachMentor({
                name: file.name,
                content,
                dateAdded: new Date().toISOString()
            });

            // Brief success feedback could be added here if needed
        } catch (err) {
            console.error(err);
            alert("Failed to process learned material.");
        } finally {
            setIsTeaching(false);
            if (e.target) e.target.value = '';
        }
    };

    if (file.type === 'application/pdf') reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }, [onTeachMentor]);

  const dailyCycle = useMemo(() => {
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = 5 * 60 + 30; 
    const endMinutes = 22 * 60; 
    
    if (nowMinutes < startMinutes || nowMinutes >= endMinutes) return { phase: "Biological Rest", progress: 0 };
    
    const totalDayMinutes = endMinutes - startMinutes;
    const progress = ((nowMinutes - startMinutes) / totalDayMinutes) * 100;
    
    if (nowMinutes < 7 * 60) return { phase: "Strategy & Routine", progress };
    
    if (trackerState.isSchoolDay) {
        if (nowMinutes < 14 * 60) return { phase: "Academic Session", progress };
        if (nowMinutes < 15 * 60) return { phase: "Station Reset", progress };
        return { phase: "Deep Breach Block", progress };
    } else {
        if (nowMinutes < 19 * 60) return { phase: "Primary High-Intensity block", progress };
        return { phase: "Optimization Window", progress };
    }
  }, [currentTime, trackerState.isSchoolDay]);

  const countdownData = useMemo(() => {
    const targetDate = new Date('2026-06-27T00:00:00Z');
    const diff = targetDate.getTime() - currentTime.getTime();
    if (diff <= 0) return { days: 0, hours: 0 };
    return { days: Math.floor(diff / (1000 * 60 * 60 * 24)), hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), totalSeconds: diff / 1000 };
  }, [currentTime]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-quickFadeIn pb-32">
      {/* Dynamic Workstation Header */}
      <div className="glass-panel p-6 border-l-4 border-sky-500 shadow-xl bg-slate-900/40">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-4">
            <div className="flex-1">
                <h2 className="text-sm font-black text-sky-500 uppercase tracking-[0.3em] mb-1">Workstation Chronometer</h2>
                <div className="flex items-center gap-6">
                    <p className="text-4xl font-black text-white tracking-tighter">{formatTime12h(currentTime)}</p>
                    <button 
                        onClick={() => onSetSchoolDay(!trackerState.isSchoolDay)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all shadow-lg active:scale-95 ${trackerState.isSchoolDay ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}
                    >
                        <SchoolIcon className={`w-5 h-5 ${trackerState.isSchoolDay ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-black uppercase tracking-widest">{trackerState.isSchoolDay ? 'SCHOOL MODE' : 'OFF-SCHOOL'}</span>
                    </button>
                </div>
            </div>
            <div className="text-right">
                <span className="inline-block px-4 py-1 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-black uppercase border border-sky-500/20 mb-2">{dailyCycle.phase}</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Efficiency: {Math.round(dailyCycle.progress)}%</p>
            </div>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 transition-all duration-1000 shadow-[0_0_15px_rgba(14,165,233,0.5)]" style={{ width: `${dailyCycle.progress}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Task Center */}
            <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden bg-slate-900/30 border-white/5">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><StarIcon className="w-64 h-64 text-sky-500" /></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-black text-sky-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping"></div>
                                Daily Tasks: {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                            </h3>
                            {trackerState.teachedMaterials.length > 0 && (
                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest italic">Adaptive Rigor: {trackerState.teachedMaterials.length} patterns learned</p>
                            )}
                        </div>
                        {analysis?.isHoliday && (
                             <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase border border-green-500/40 rounded-full">Strategic Recovery</span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {isLoading ? (
                            <div className="flex items-center gap-4 text-slate-400 p-8 glass-panel rounded-2xl border-dashed">
                                <Spinner className="w-6 h-6 text-sky-500"/>
                                <p className="text-lg font-medium animate-pulse italic">Partnering with Brainwave Mentor...</p>
                            </div>
                        ) : (
                            analysis?.dailyTasks.map((task, idx) => (
                                <TaskItem key={idx} task={task} index={idx} />
                            ))
                        )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                         <div className="flex-1">
                            <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-3 italic">Growth Catalyst</p>
                            <p className="text-slate-200 text-lg leading-relaxed font-medium">"{analysis?.growthCatalyst || 'Establishing strategic trajectory...'}"</p>
                         </div>
                         <div className="flex flex-col gap-3 flex-shrink-0">
                            <button 
                                onClick={() => setIsChatOpen(true)}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-sky-500 text-white rounded-2xl font-black text-sm uppercase shadow-2xl shadow-sky-500/40 hover:scale-105 active:scale-95 transition-all"
                            >
                                <MessageCircleIcon className="w-5 h-5" />
                                Consult Mentor
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isTeaching}
                                className="flex items-center justify-center gap-3 px-8 py-3 bg-slate-800 text-slate-300 rounded-2xl font-black text-[10px] uppercase border border-white/5 hover:border-sky-500/30 hover:text-sky-400 transition-all active:scale-95"
                            >
                                {isTeaching ? <Spinner className="w-4 h-4" /> : <UploadIcon className="w-4 h-4" />}
                                Teach Partner (Exams)
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileTeach} 
                                className="hidden" 
                                accept=".pdf,.txt,.json" 
                            />
                         </div>
                    </div>
                </div>
            </div>

            {/* Streak Index */}
            <div className="glass-panel p-8 rounded-[2.5rem] bg-slate-900/30 border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Consistency Index</h3>
                    <span className="text-2xl font-black text-sky-400">{trackerState.currentStreak} DAY STREAK</span>
                </div>
                <div className="flex gap-3 justify-between overflow-x-auto pb-4 custom-scrollbar">
                    {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(d => (
                        <div key={d} className={`min-w-[42px] aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all ${d <= trackerState.currentStreak ? 'bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.4)] text-white scale-110' : 'bg-slate-800 text-slate-600'}`}>
                            {d}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] text-center bg-slate-900/30 border-white/5">
                <h3 className="text-xs font-black text-slate-500 mb-8 uppercase tracking-[0.3em]">Mastery Level ({totalUnits} Units)</h3>
                <div className="relative w-48 h-48 mx-auto mb-8">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#0ea5e9" strokeWidth="12"
                            strokeDasharray={282.7}
                            strokeDashoffset={282.7 - (282.7 * (analysis?.masteryPercentage || 0) / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-white tracking-tighter">{Math.round(analysis?.masteryPercentage || 0)}%</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase mt-1">Conquered</span>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 shadow-2xl">
                <h3 className="text-xs font-black text-amber-500 mb-6 uppercase tracking-[0.2em]">Target: 595 Score Points</h3>
                <div className="space-y-4">
                    <button 
                        onClick={() => setIsExamModalOpen(true)}
                        className="w-full bg-amber-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-amber-400 transition-all active:scale-95 shadow-xl shadow-amber-500/10"
                    >
                        LOG PERFORMANCE DATA
                    </button>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-2 italic">Mathematical Probability</p>
                         <p className="text-white font-bold leading-tight text-sm">{analysis?.prediction || 'Awaiting metrics.'}</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] bg-sky-500/5 border border-sky-500/20">
                <h3 className="text-xs font-black text-sky-400 mb-4 uppercase tracking-[0.2em]">Deadline: June 27, 2026</h3>
                <div className="flex flex-col gap-1">
                    <p className="text-3xl font-black text-white tracking-tight">{countdownData.days} Days</p>
                    <p className="text-xl font-bold text-slate-400 tracking-tight">{countdownData.hours} Hours Remaining</p>
                </div>
                <div className="mt-6 h-3 w-full bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (1 - (countdownData.totalSeconds / (1.5 * 365 * 24 * 3600))) * 100)}%` }}></div>
                </div>
            </div>
        </div>
      </div>

      <LogExamModal 
        isOpen={isExamModalOpen} 
        onClose={() => setIsExamModalOpen(false)} 
        onLog={(res) => { onLogExam(res); setIsExamModalOpen(false); }} 
      />

      <MentorChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        outlines={outlines}
        trackerState={trackerState}
        onUpdateChat={onUpdateChat}
        onTeachMentor={onTeachMentor}
        appSettings={appSettings}
      />
    </div>
  );
};

const LogExamModal: React.FC<{isOpen: boolean, onClose: () => void, onLog: (res: PastExamResult) => void}> = ({isOpen, onClose, onLog}) => {
    const [subj, setSubj] = useState('Mathematics');
    const [year, setYear] = useState(2017);
    const [score, setScore] = useState(0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="LOG PERFORMANCE">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Subject Arena</label>
                    <select value={subj} onChange={e => setSubj(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-sky-500">
                        {['Mathematics', 'Biology', 'Physics', 'Chemistry', 'SAT', 'English'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">Year (E.C.)</label>
                        <input type="number" min="2000" max="2017" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">Score (%)</label>
                        <input type="number" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white" />
                    </div>
                </div>
                <button 
                    onClick={() => onLog({ id: Date.now().toString(), subject: subj, yearEC: year, score, dateLogged: getEATDate().toISOString() })}
                    className="w-full bg-sky-500 text-white font-black py-5 rounded-2xl hover:bg-sky-600 transition-all mt-6 shadow-xl shadow-sky-500/20"
                >
                    COMMIT PERFORMANCE DATA
                </button>
            </div>
        </Modal>
    );
};

export default TrackerView;
