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
  LearningObjective,
} from '../types';
import { generateTrackerAnalysis } from '../services/geminiService';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import { curriculumData } from '../constants';
import MentorChatModal from './MentorChatModal';
import MessageCircleIcon from './icons/MessageCircleIcon';
import SchoolIcon from './icons/SchoolIcon';
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

type BlockType = 'Deep Focus' | 'Active Recall' | 'Light Review';

type PlannedTask = DailyTaskDetail & {
  id: string;
  subject: string;
  startMinute: number;
  endMinute: number;
  blockType: BlockType;
  objectiveIds: string[];
  objectiveLabels: string[];
  energyScore: number;
};

type TeachQuality = { relevance: number; confidence: number; patternType: string };

const TRACKER_DAILY_KEY = 'tracker-daily-checks-v3';
const TRACKER_OBJECTIVE_KEY = 'tracker-objective-checks-v1';

const getEATDate = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }));
const formatTime12h = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtMinute = (m: number) => formatTime12h(new Date(new Date().setHours(Math.floor(m / 60), m % 60, 0, 0)));
const dayString = (d: Date) => d.toISOString().slice(0, 10);

const countTotalUnits = () => Object.values(curriculumData).reduce((a, s) => a + s.themes.reduce((b, t) => b + t.units.length, 0), 0);

const estimateTeachQuality = (material: TeachedMaterial): TeachQuality => {
  const content = material.content.toLowerCase();
  const examKeywords = ['question', 'option', 'answer', 'explain', 'mark', 'choice'];
  const hits = examKeywords.filter((k) => content.includes(k)).length;
  const relevance = Math.min(100, Math.round((hits / examKeywords.length) * 100));
  const confidence = Math.min(100, Math.round(Math.log10(Math.max(10, content.length)) * 40));
  const patternType = content.includes('a)') || content.includes('b)') ? 'MCQ Pattern' : content.includes('essay') ? 'Essay Pattern' : 'Mixed Pattern';
  return { relevance, confidence, patternType };
};

const buildPlan = (outlines: StudyOutline[], state: TrackerState, now: Date, carryoverMinutes: number): PlannedTask[] => {
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const schedule: Record<string, string> = {
    Sunday: 'Mathematics', Monday: 'Biology', Tuesday: 'Physics', Wednesday: 'Chemistry', Thursday: 'SAT', Friday: 'English', Saturday: 'Revision',
  };
  const targetSubject = schedule[weekday] || 'Mathematics';
  const openMinute = now.getHours() * 60 + now.getMinutes();
  const sleepMinute = state.isSchoolDay ? 22 * 60 : 23 * 60;
  const startMinute = Math.min(openMinute + 10, sleepMinute - 120);
  const available = Math.max(120, sleepMinute - startMinute - carryoverMinutes);

  const examDate = new Date('2026-06-27T00:00:00Z');
  const daysLeft = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const subjectOutlines = outlines.filter((o) => o.subject === targetSubject);
  const curriculumUnits = curriculumData[targetSubject]?.themes.flatMap((t) => t.units) || [];
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

  const unresolved = (candidate?.mainTopics || []).flatMap((m) =>
    m.subtopics
      .filter((s) => s.learningObjectives.some((o) => !candidate.completedObjectives.includes(o.id)))
      .map((s) => ({
        topic: m.title,
        subunit: s.title,
        objectives: s.learningObjectives.filter((o) => !candidate.completedObjectives.includes(o.id)),
      }))
  );

  const blockCount = Math.min(7, Math.max(3, Math.ceil(available / 85)));
  const blockMinutes = Math.max(40, Math.floor(available / blockCount));

  const tasks: PlannedTask[] = [];
  for (let i = 0; i < blockCount; i++) {
    const start = startMinute + i * blockMinutes;
    const end = i === blockCount - 1 ? sleepMinute : Math.min(sleepMinute, start + blockMinutes);
    const next = unresolved[i % Math.max(1, unresolved.length)];
    const hour = Math.floor(start / 60);
    const blockType: BlockType = hour < 13 ? 'Deep Focus' : hour < 19 ? 'Active Recall' : 'Light Review';
    const energyScore = blockType === 'Deep Focus' ? 100 : blockType === 'Active Recall' ? 72 : 48;
    const objectiveIds = (next?.objectives || []).slice(0, 3).map((o: LearningObjective) => o.id);
    const objectiveLabels = (next?.objectives || []).slice(0, 3).map((o: LearningObjective) => o.text);

    tasks.push({
      id: `${now.toDateString()}-${i}`,
      subject: targetSubject,
      startMinute: start,
      endMinute: end,
      blockType,
      objectiveIds,
      objectiveLabels,
      energyScore,
      task: `${fmtMinute(start)} - ${fmtMinute(end)} • ${targetSubject}: ${next ? `${next.topic} • ${next.subunit}` : 'Core progression'}`,
      rationale: `Built from open time ${fmtMinute(openMinute)}, remaining ${remainingUnits} curriculum units, unfinished sub-units, and time to sleep (${fmtMinute(sleepMinute)}).`,
      impact: `Targets ≈${unitsPerDay.toFixed(2)} units/day so you can finish before exam day while keeping realistic block intensity.`,
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
  const [objectiveChecked, setObjectiveChecked] = useState<Record<string, boolean>>({});
  const [startMap, setStartMap] = useState<Record<string, string>>({});
  const [carryoverMinutes, setCarryoverMinutes] = useState(0);
  const [teachQuality, setTeachQuality] = useState<TeachQuality | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionStartRef = useRef<Date>(getEATDate());

  useEffect(() => { const timer = setInterval(() => setCurrentTime(getEATDate()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { const raw = localStorage.getItem(TRACKER_DAILY_KEY); if (raw) setChecked(JSON.parse(raw)); }, []);
  useEffect(() => { localStorage.setItem(TRACKER_DAILY_KEY, JSON.stringify(checked)); }, [checked]);

  useEffect(() => {
    const raw = localStorage.getItem(TRACKER_DAILY_KEY);
    if (raw) setChecked(JSON.parse(raw));
    const rawObj = localStorage.getItem(TRACKER_OBJECTIVE_KEY);
    if (rawObj) setObjectiveChecked(JSON.parse(rawObj));
  }, []);

  useEffect(() => { localStorage.setItem(TRACKER_DAILY_KEY, JSON.stringify(checked)); }, [checked]);
  useEffect(() => { localStorage.setItem(TRACKER_OBJECTIVE_KEY, JSON.stringify(objectiveChecked)); }, [objectiveChecked]);

  const plannedTasks = useMemo(() => buildPlan(outlines, trackerState, sessionStartRef.current, carryoverMinutes), [outlines, trackerState, carryoverMinutes]);

  const completionRate = plannedTasks.length ? (plannedTasks.filter((t) => checked[t.id]).length / plannedTasks.length) * 100 : 0;
  const currentMinute = currentTime.getHours() * 60 + currentTime.getMinutes();

  const intervention = useMemo(() => {
    if (currentMinute < 14 * 60) return null;
    if (completionRate >= 70) return { level: 'Stable', message: 'Great pace. Keep momentum and protect your final review block.' };
    if (completionRate >= 45) return { level: 'Nudge', message: 'You are slightly behind. Start the next shortest block now and skip non-essential breaks.' };
    if (completionRate >= 25) return { level: 'Correction', message: 'You are drifting. Execute 2 back-to-back active-recall blocks before any other activity.' };
    return { level: 'Recovery', message: 'Critical drift detected. Trigger emergency mode: 90-minute rescue sprint + immediate mentor consultation.' };
  }, [completionRate, currentMinute]);

  const examCountdown = useMemo(() => {
    const targetDate = new Date('2026-06-27T00:00:00Z');
    const diff = Math.max(0, targetDate.getTime() - currentTime.getTime());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    };
  }, [currentTime]);

  const paceForecast = useMemo(() => {
    const sessions = trackerState.sessionLogs || [];
    const recent = sessions.slice(-14);
    const avgPace = recent.length ? recent.reduce((a, s) => a + s.paceTasksPerHour, 0) / recent.length : 0;
    const avgCompletion = recent.length ? recent.reduce((a, s) => a + s.completionRate, 0) / recent.length : 0;

    const remainingGlobalUnits = Math.max(1, countTotalUnits() - Math.round((analysis?.masteryPercentage || 0) / 100 * countTotalUnits()));
    const unitPerTask = 0.22;
    const projectedTasksPerDay = Math.max(1, avgPace * 3);
    const projectedDaysToFinish = Math.ceil((remainingGlobalUnits / unitPerTask) / projectedTasksPerDay);
    const projectedDate = new Date(currentTime);
    projectedDate.setDate(projectedDate.getDate() + projectedDaysToFinish);

    return { avgPace, avgCompletion, projectedDate, projectedDaysToFinish, projectedTasksPerDay };
  }, [trackerState.sessionLogs, analysis?.masteryPercentage, currentTime]);

  const weeklyDebrief = useMemo(() => {
    const sessions = (trackerState.sessionLogs || []).filter((s) => {
      const daysAgo = (currentTime.getTime() - new Date(s.closedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });

    const completed = sessions.reduce((a, s) => a + s.completedTaskCount, 0);
    const planned = sessions.reduce((a, s) => a + s.totalTaskCount, 0);
    const avgRate = sessions.length ? sessions.reduce((a, s) => a + s.completionRate, 0) / sessions.length : 0;

    const nextWeekDirective = avgRate >= 70
      ? 'Increase deep-focus blocks by +1 each day and convert one review block into timed exam drills.'
      : avgRate >= 45
      ? 'Keep same total blocks but move hardest subject to first two blocks daily.'
      : 'Reduce block count by 1, enforce strict 50/10 cycles, and schedule daily mentor recovery prompts.';

    return { completed, planned, avgRate, nextWeekDirective };
  }, [trackerState.sessionLogs, currentTime]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await generateTrackerAnalysis(outlines, trackerState.habitHistory, appSettings, trackerState);
      setAnalysis({ ...result, dailyTasks: plannedTasks });
      onCacheAnalysis({ ...result, dailyTasks: plannedTasks });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAnalysis(); }, [plannedTasks.length, trackerState.examResults.length, trackerState.isSchoolDay, trackerState.teachedMaterials.length]);

  useEffect(() => {
    fetchAnalysis();
  }, [plannedTasks.length, trackerState.examResults.length, trackerState.isSchoolDay, trackerState.teachedMaterials.length]);

  useEffect(() => {
    return () => {
      const sleepTime = trackerState.isSchoolDay ? '10:00 PM' : '11:00 PM';
      const completed = plannedTasks.filter((t) => checked[t.id]).length;
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
    setChecked((prev) => ({ ...prev, [task.id]: !wasChecked }));

    if (!wasChecked) {
      const startedAt = startMap[task.id] || nowIso;
      const completedAt = nowIso;
      const durationMinutes = Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000));
      const plannedMinutes = task.endMinute - task.startMinute;
      const delta = durationMinutes - plannedMinutes;
      if (delta > 5) setCarryoverMinutes((v) => Math.min(150, v + Math.round(delta / 2))); // live replan engine
      if (delta < -5) setCarryoverMinutes((v) => Math.max(0, v - Math.abs(Math.round(delta / 2))));

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

      onUpdateTracker({
        date: dayString(getEATDate()),
        tasksCompleted: Object.values({ ...checked, [task.id]: true }).filter(Boolean).length,
        tasksTotal: plannedTasks.length,
        procrastinationLogged: delta > 20,
        performanceScore: Math.max(0, Math.round((completionRate + Math.max(0, 100 - Math.max(0, delta))) / 2)),
        aiInsight: delta > 20 ? 'Task overrun detected; timeline auto-compressed.' : 'Task completed within expected range.',
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
            content += textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
          }
        } else content = event.target?.result as string;

        const material = { name: file.name, content, dateAdded: new Date().toISOString() };
        onTeachMentor(material);
        setTeachQuality(estimateTeachQuality(material));
      } finally {
        setIsTeaching(false);
        if (e.target) e.target.value = '';
      }
    };
    if (file.type === 'application/pdf') reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }, [onTeachMentor]);

  const totalUnits = useMemo(() => countTotalUnits(), []);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-quickFadeIn pb-32">
      <div className="glass-panel p-6 border-l-4 border-sky-500 bg-slate-900/40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
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
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold">Completion today: {Math.round(completionRate)}%</p>
            <p className="text-xs text-amber-300 font-bold">Exam countdown: {examCountdown.days} days {examCountdown.hours} hours</p>
          </div>
        </div>
        <div className="h-7 w-full rounded-2xl overflow-hidden bg-slate-800/80 flex">
          {plannedTasks.map((task) => {
            const total = plannedTasks.reduce((a, t) => a + (t.endMinute - t.startMinute), 0) || 1;
            const width = ((task.endMinute - task.startMinute) / total) * 100;
            return (
              <div key={task.id} style={{ width: `${width}%` }} className={`h-full border-r border-slate-900/50 ${checked[task.id] ? 'bg-emerald-500/90' : task.blockType === 'Deep Focus' ? 'bg-sky-500/80' : task.blockType === 'Active Recall' ? 'bg-indigo-500/70' : 'bg-violet-500/65'}`} title={`${task.blockType} | ${task.task}`} />
            );
          })}
        </div>
      </div>

      {intervention && (
        <div className={`glass-panel p-4 border ${intervention.level === 'Recovery' ? 'border-red-500/40 bg-red-500/10' : intervention.level === 'Correction' ? 'border-amber-500/40 bg-amber-500/10' : 'border-sky-500/40 bg-sky-500/10'}`}>
          <p className="font-bold">Intervention: {intervention.level}</p>
          <p className="text-sm text-slate-200">{intervention.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2rem] bg-slate-900/30 border-white/5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xs font-black text-sky-500 uppercase tracking-[0.2em]">Daily Study Secretary</h3>
              <span className="text-[10px] text-slate-400 uppercase">Live replan carryover: {carryoverMinutes} min</span>
            </div>

            {isLoading ? <div className="flex items-center gap-3"><Spinner className="w-5 h-5" /><p>Planning your day...</p></div> : (
              <div className="space-y-3">
                {plannedTasks.map((task, i) => (
                  <div key={task.id} className={`w-full p-4 rounded-2xl text-left border ${checked[task.id] ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleToggleTask(task)} className={`w-6 h-6 mt-1 rounded-full border-2 flex items-center justify-center ${checked[task.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                        {checked[task.id] && <span className="text-white text-xs">✓</span>}
                      </button>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-white font-semibold">{i + 1}. {task.task}</p>
                          <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-slate-800 text-slate-300">{task.blockType} • energy {task.energyScore}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{task.rationale}</p>
                        <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="text-xs mt-2 text-sky-300">{expandedTaskId === task.id ? 'Hide objectives' : 'Show objective checklist'}</button>
                        {expandedTaskId === task.id && (
                          <div className="mt-3 space-y-2">
                            {task.objectiveIds.length ? task.objectiveIds.map((objId, idx) => (
                              <label key={objId} className="flex items-start gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={!!objectiveChecked[objId]}
                                  onChange={() => setObjectiveChecked((prev) => ({ ...prev, [objId]: !prev[objId] }))}
                                  className="mt-1"
                                />
                                <span className={objectiveChecked[objId] ? 'line-through text-slate-500' : 'text-slate-200'}>{task.objectiveLabels[idx] || `Objective ${idx + 1}`}</span>
                              </label>
                            )) : <p className="text-xs text-slate-500">No explicit objective IDs in this block yet.</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setIsChatOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase"><MessageCircleIcon className="w-4 h-4" />Consult Mentor</button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isTeaching} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 text-slate-200 rounded-2xl font-black text-xs uppercase">{isTeaching ? <Spinner className="w-4 h-4" /> : <UploadIcon className="w-4 h-4" />}Teach Partner</button>
              <input type="file" ref={fileInputRef} onChange={handleFileTeach} className="hidden" accept=".pdf,.txt,.json" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-[2rem] border border-white/10">
            <h4 className="text-xs uppercase font-black text-amber-400 mb-2">Weekly Debrief + Next Week Blueprint</h4>
            <p className="text-sm text-slate-200">This week: {weeklyDebrief.completed}/{weeklyDebrief.planned || 0} tasks completed • Avg completion {Math.round(weeklyDebrief.avgRate)}%.</p>
            <p className="text-sm text-slate-300 mt-2">Next-week auto-blueprint: {weeklyDebrief.nextWeekDirective}</p>
          </div>
        </div>
      )

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-[2rem]">
            <h3 className="text-xs uppercase text-slate-400 font-black mb-2">Mastery ({totalUnits} Units)</h3>
            <p className="text-4xl font-black text-white">{Math.round(analysis?.masteryPercentage || 0)}%</p>
            <p className="text-sm text-slate-400 mt-2">{analysis?.prediction || 'Awaiting analysis'}</p>
          </div>

          <div className="glass-panel p-6 rounded-[2rem] border border-sky-500/30">
            <p className="text-xs uppercase font-black text-sky-400">Pace Forecast Dashboard</p>
            <p className="text-sm mt-2 text-slate-200">Actual pace: {paceForecast.avgPace.toFixed(2)} tasks/hr • Avg completion: {paceForecast.avgCompletion.toFixed(0)}%.</p>
            <p className="text-sm text-slate-300 mt-1">Projected finish in {paceForecast.projectedDaysToFinish} days (~{paceForecast.projectedDate.toLocaleDateString()}).</p>
          </div>

          {teachQuality && (
            <div className="glass-panel p-6 rounded-[2rem] border border-indigo-500/30">
              <p className="text-xs uppercase font-black text-indigo-300">Teach Partner Quality</p>
              <p className="text-sm mt-2 text-slate-200">Relevance: {teachQuality.relevance}% • Confidence: {teachQuality.confidence}%</p>
              <p className="text-sm text-slate-300">Detected pattern: {teachQuality.patternType}</p>
            </div>
          )}

          <button onClick={() => setIsExamModalOpen(true)} className="w-full bg-amber-500 text-slate-900 font-black py-4 rounded-2xl">Log Performance Data</button>
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
    <Modal isOpen={isOpen} onClose={onClose} title="LOG PERFORMANCE" size="md">
      <div className="space-y-4">
        <select value={subj} onChange={(e) => setSubj(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white">
          {['Mathematics', 'Biology', 'Physics', 'Chemistry', 'SAT', 'English'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" min="2000" max="2017" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white" />
          <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white" />
        </div>
        <button onClick={() => onLog({ id: Date.now().toString(), subject: subj, yearEC: year, score, dateLogged: getEATDate().toISOString() })} className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl">Commit Performance Data</button>
      </div>
    </Modal>
  );
};

export default TrackerView;
