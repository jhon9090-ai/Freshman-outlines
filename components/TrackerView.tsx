import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  StudyOutline,
  TrackerState,
  AppSettings,
  DailyHabitLog,
  TrackerAIAnalysis,
  PastExamResult,
  ChatMessage,
  DailyTaskDetail,
  TeachedMaterial,
  DailyTaskExecutionLog,
  StudySessionLog,
} from '../types';
import { generateTrackerAnalysis } from '../services/geminiService';
import Spinner from './ui/Spinner';
import StarIcon from './icons/StarIcon';
import Modal from './ui/Modal';
import { curriculumData } from '../constants';
import MentorChatModal from './MentorChatModal';
import MessageCircleIcon from './icons/MessageCircleIcon';
import SchoolIcon from './icons/SchoolIcon';
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
  onLogTaskExecution: (log: DailyTaskExecutionLog) => void;
  onLogStudySession: (log: StudySessionLog) => void;
  appSettings: AppSettings;
}

type PlannedTask = DailyTaskDetail & {
  id: string;
  subject: string;
  startMinute: number;
  endMinute: number;
};

const TRACKER_DAILY_KEY = 'tracker-daily-checks-v2';

const getEATDate = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }));
const formatTime12h = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtMinute = (m: number) => formatTime12h(new Date(new Date().setHours(Math.floor(m / 60), m % 60, 0, 0)));

const countTotalUnits = () => Object.values(curriculumData).reduce((a, s) => a + s.themes.reduce((b, t) => b + t.units.length, 0), 0);

const buildPlan = (outlines: StudyOutline[], state: TrackerState, now: Date): PlannedTask[] => {
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const schedule: Record<string, string> = {
    Sunday: 'Mathematics', Monday: 'Biology', Tuesday: 'Physics', Wednesday: 'Chemistry', Thursday: 'SAT', Friday: 'English', Saturday: 'Revision',
  };
  const targetSubject = schedule[weekday] || 'Mathematics';
  const openMinute = now.getHours() * 60 + now.getMinutes();
  const sleepMinute = state.isSchoolDay ? 22 * 60 : 23 * 60;
  const startMinute = Math.min(openMinute + 10, sleepMinute - 120);
  const available = Math.max(120, sleepMinute - startMinute);

  const examDate = new Date('2026-06-27T00:00:00Z');
  const daysLeft = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const subjectOutlines = outlines.filter(o => o.subject === targetSubject);
  const curriculumUnits = curriculumData[targetSubject]?.themes.flatMap(t => t.units) || [];
  const completedUnits = subjectOutlines.filter((o) => {
    const objectives = (o.mainTopics || []).flatMap((m) => m.subtopics.flatMap((s) => s.learningObjectives));
    return objectives.length > 0 && o.completedObjectives.length >= objectives.length;
  }).length;
  const remainingUnits = Math.max(1, curriculumUnits.length - completedUnits);
  const unitsPerDay = Math.max(0.3, remainingUnits / daysLeft);

  const candidate = subjectOutlines.find((o) => {
    const all = (o.mainTopics || []).flatMap((m) => m.subtopics.flatMap((s) => s.learningObjectives));
    return all.some((obj) => !o.completedObjectives.includes(obj.id));
  }) || subjectOutlines[0] || outlines[0];

  const nextSubunits = (candidate?.mainTopics || []).flatMap(m =>
    m.subtopics.filter(s => s.learningObjectives.some(o => !candidate.completedObjectives.includes(o.id))).map(s => ({ topic: m.title, subunit: s.title }))
  ).slice(0, 4);

  const blockCount = Math.min(6, Math.max(3, Math.ceil(available / 90)));
  const blockMinutes = Math.floor(available / blockCount);

  const tasks: PlannedTask[] = [];
  for (let i = 0; i < blockCount; i++) {
    const start = startMinute + i * blockMinutes;
    const end = i === blockCount - 1 ? sleepMinute : start + blockMinutes;
    const next = nextSubunits[i % Math.max(1, nextSubunits.length)];
    const title = i === blockCount - 1
      ? `Rapid review + active recall (${targetSubject})`
      : `${targetSubject}: ${next ? `${next.topic} • ${next.subunit}` : 'Core unit progression'}`;
    tasks.push({
      id: `${now.toDateString()}-${i}`,
      subject: targetSubject,
      startMinute: start,
      endMinute: end,
      task: `${fmtMinute(start)} - ${fmtMinute(end)} • ${title}`,
      rationale: `Planned from app-open time (${fmtMinute(openMinute)}), current pace, ${remainingUnits} remaining units, and ${daysLeft} days to exam.`,
      impact: `Completes ~${unitsPerDay.toFixed(2)} unit/day trajectory while covering unfinished sub-units before sleep at ${fmtMinute(sleepMinute)}.`,
    });
  }
  return tasks;
};

const TrackerView: React.FC<TrackerViewProps> = ({ outlines, trackerState, onUpdateTracker, onCacheAnalysis, onLogExam, onSetSchoolDay, onUpdateChat, onTeachMentor, onLogTaskExecution, onLogStudySession, appSettings }) => {
  const [analysis, setAnalysis] = useState<TrackerAIAnalysis | null>(trackerState.cachedAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTeaching, setIsTeaching] = useState(false);
  const [currentTime, setCurrentTime] = useState(getEATDate());
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [startMap, setStartMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionStartRef = useRef<Date>(getEATDate());

  useEffect(() => { const timer = setInterval(() => setCurrentTime(getEATDate()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { const raw = localStorage.getItem(TRACKER_DAILY_KEY); if (raw) setChecked(JSON.parse(raw)); }, []);
  useEffect(() => { localStorage.setItem(TRACKER_DAILY_KEY, JSON.stringify(checked)); }, [checked]);

  const plannedTasks = useMemo(() => buildPlan(outlines, trackerState, sessionStartRef.current), [outlines, trackerState]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await generateTrackerAnalysis(outlines, trackerState.habitHistory, appSettings, trackerState);
      setAnalysis({ ...result, dailyTasks: plannedTasks });
      onCacheAnalysis({ ...result, dailyTasks: plannedTasks });
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAnalysis(); }, [plannedTasks.length, trackerState.examResults.length, trackerState.isSchoolDay, trackerState.teachedMaterials.length]);

  useEffect(() => {
    return () => {
      const sleepTime = trackerState.isSchoolDay ? '10:00 PM' : '11:00 PM';
      const completed = plannedTasks.filter(t => checked[t.id]).length;
      const plannedMinutes = plannedTasks.reduce((a, t) => a + (t.endMinute - t.startMinute), 0);
      const sessionHours = Math.max(1 / 60, (getEATDate().getTime() - sessionStartRef.current.getTime()) / 3600000);
      onLogStudySession({
        id: `session-${Date.now()}`,
        openedAt: sessionStartRef.current.toISOString(),
        closedAt: getEATDate().toISOString(),
        sleepTime,
        plannedStudyMinutes: plannedMinutes,
        completedTaskCount: completed,
        totalTaskCount: plannedTasks.length,
        completionRate: plannedTasks.length ? (completed / plannedTasks.length) * 100 : 0,
        paceTasksPerHour: completed / sessionHours,
      });
    };
  }, [checked, plannedTasks, trackerState.isSchoolDay, onLogStudySession]);

  const handleToggleTask = (task: PlannedTask) => {
    const nowIso = getEATDate().toISOString();
    const wasChecked = !!checked[task.id];
    const nextChecked = { ...checked, [task.id]: !wasChecked };
    setChecked(nextChecked);

    if (!wasChecked) {
      const startedAt = startMap[task.id] || nowIso;
      const completedAt = nowIso;
      const durationMinutes = Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000));
      onLogTaskExecution({
        id: `task-log-${task.id}-${Date.now()}`,
        taskTitle: task.task,
        subject: task.subject,
        plannedStart: fmtMinute(task.startMinute),
        plannedEnd: fmtMinute(task.endMinute),
        startedAt,
        completedAt,
        durationMinutes,
      });
    } else {
      setStartMap((prev) => ({ ...prev, [task.id]: nowIso }));
    }
  };

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
        } else content = event.target?.result as string;
        onTeachMentor({ name: file.name, content, dateAdded: new Date().toISOString() });
      } finally {
        setIsTeaching(false);
        if (e.target) e.target.value = '';
      }
    };
    if (file.type === 'application/pdf') reader.readAsArrayBuffer(file); else reader.readAsText(file);
  }, [onTeachMentor]);

  const totalUnits = useMemo(() => countTotalUnits(), []);
  const completionRate = plannedTasks.length ? (plannedTasks.filter(t => checked[t.id]).length / plannedTasks.length) * 100 : 0;
  const offTrack = completionRate < 35 && currentTime.getHours() >= 16;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-quickFadeIn pb-32">
      <div className="glass-panel p-6 border-l-4 border-sky-500 bg-slate-900/40">
        <div className="flex justify-between items-end gap-4 mb-4">
          <div>
            <h2 className="text-sm font-black text-sky-500 uppercase tracking-[0.3em] mb-1">Workstation Chronometer</h2>
            <div className="flex items-center gap-5">
              <p className="text-4xl font-black text-white">{formatTime12h(currentTime)}</p>
              <button onClick={() => onSetSchoolDay(!trackerState.isSchoolDay)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${trackerState.isSchoolDay ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <SchoolIcon className="w-5 h-5" />
                <span className="text-xs font-black uppercase">{trackerState.isSchoolDay ? 'School Mode' : 'Off-school'}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-bold">Task completion today: {Math.round(completionRate)}%</p>
        </div>
        <div className="h-6 w-full rounded-2xl overflow-hidden bg-slate-800/80 flex">
          {plannedTasks.map((task) => {
            const total = plannedTasks.reduce((a, t) => a + (t.endMinute - t.startMinute), 0) || 1;
            const width = ((task.endMinute - task.startMinute) / total) * 100;
            return (
              <div key={task.id} style={{ width: `${width}%` }} className={`h-full border-r border-slate-900/50 ${checked[task.id] ? 'bg-emerald-500/80' : 'bg-sky-500/50'}`} title={task.task} />
            );
          })}
        </div>
      </div>

      {offTrack && (
        <div className="glass-panel p-4 border border-red-500/40 bg-red-500/10">
          <p className="text-red-300 font-bold">You are steering off path. Immediate fix: complete the next two shortest blocks now, then run a 15-minute recap before break.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2rem] bg-slate-900/30 border-white/5">
            <div className="flex justify-between mb-5">
              <h3 className="text-xs font-black text-sky-500 uppercase tracking-[0.2em]">Daily Study Secretary</h3>
              {analysis?.isHoliday && <span className="text-[10px] px-3 py-1 rounded-full bg-green-500/20 text-green-300">Holiday mode</span>}
            </div>
            {isLoading ? <div className="flex items-center gap-3"><Spinner className="w-5 h-5" /><p>Planning your day...</p></div> : (
              <div className="space-y-3">
                {plannedTasks.map((task, i) => (
                  <button key={task.id} onClick={() => handleToggleTask(task)} className={`w-full p-4 rounded-2xl text-left border ${checked[task.id] ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 mt-1 rounded-full border-2 flex items-center justify-center ${checked[task.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                        {checked[task.id] && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{i + 1}. {task.task}</p>
                        <p className="text-xs text-slate-400 mt-1">{task.rationale}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setIsChatOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase"><MessageCircleIcon className="w-4 h-4" />Consult Mentor</button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isTeaching} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 text-slate-200 rounded-2xl font-black text-xs uppercase">{isTeaching ? <Spinner className="w-4 h-4" /> : <UploadIcon className="w-4 h-4" />}Teach Partner</button>
              <input type="file" ref={fileInputRef} onChange={handleFileTeach} className="hidden" accept=".pdf,.txt,.json" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-[2rem]">
            <h3 className="text-xs uppercase text-slate-400 font-black mb-4">Mastery ({totalUnits} Units)</h3>
            <p className="text-4xl font-black text-white">{Math.round(analysis?.masteryPercentage || 0)}%</p>
            <p className="text-sm text-slate-400 mt-2">{analysis?.prediction || 'Awaiting analysis'}</p>
          </div>
          <button onClick={() => setIsExamModalOpen(true)} className="w-full bg-amber-500 text-slate-900 font-black py-4 rounded-2xl">Log Performance Data</button>
          <div className="glass-panel p-6 rounded-[2rem] border border-sky-500/30">
            <p className="text-xs uppercase font-black text-sky-400">Path Advisor</p>
            <p className="text-sm mt-2 text-slate-200">{offTrack ? 'Off-track detected. Prioritize your next unfinished block now.' : (analysis?.pathDeviation || 'On trajectory.')}</p>
          </div>
        </div>
      </div>

      <LogExamModal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} onLog={(res) => { onLogExam(res); setIsExamModalOpen(false); }} />
      <MentorChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} outlines={outlines} trackerState={trackerState} onUpdateChat={onUpdateChat} onTeachMentor={onTeachMentor} appSettings={appSettings} />
    </div>
  );
};

const LogExamModal: React.FC<{ isOpen: boolean; onClose: () => void; onLog: (res: PastExamResult) => void }> = ({ isOpen, onClose, onLog }) => {
  const [subj, setSubj] = useState('Mathematics');
  const [year, setYear] = useState(2017);
  const [score, setScore] = useState(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="LOG PERFORMANCE">
      <div className="space-y-4">
        <select value={subj} onChange={e => setSubj(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white">
          {['Mathematics', 'Biology', 'Physics', 'Chemistry', 'SAT', 'English'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" min="2000" max="2017" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white" />
          <input type="number" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white" />
        </div>
        <button onClick={() => onLog({ id: Date.now().toString(), subject: subj, yearEC: year, score, dateLogged: getEATDate().toISOString() })} className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl">Commit Performance Data</button>
      </div>
    </Modal>
  );
};

export default TrackerView;
