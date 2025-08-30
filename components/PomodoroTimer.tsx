import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings } from '../types';
import { ALARM_SOUND } from '../assets/sounds';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import XIcon from './icons/XIcon';
import GripVerticalIcon from './icons/GripVerticalIcon';

interface PomodoroTimerProps {
  session: {
    duration: number; // in minutes
    title: string;
  };
  onClose: () => void;
  appSettings: AppSettings;
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ session, onClose, appSettings }) => {
  const workerRef = useRef<Worker | null>(null);
  const [phase, setPhase] = useState<'study' | 'break' | 'finished'>('study');
  const [timeLeft, setTimeLeft] = useState(session.duration * 60);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, hasBeenDragged: false });
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Initialize Audio element
  useEffect(() => {
    const soundSrc = appSettings.customAlarmSound || ALARM_SOUND;
    const audio = new Audio(soundSrc);
    audio.preload = 'auto';

    const handleError = () => {
        console.error(`Failed to load audio source: ${audio.src.substring(0, 100)}...`);
        if (appSettings.customAlarmSound && audio.src !== ALARM_SOUND) {
            console.log("Falling back to default alarm sound.");
            audio.src = ALARM_SOUND;
        }
    };
    
    audio.addEventListener('error', handleError);
    audioRef.current = audio;
    return () => audio.removeEventListener('error', handleError);
  }, [appSettings.customAlarmSound]);
  
  const playAlarm = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => console.error("Audio play failed:", error));
    }
  }, []);

  // Setup Worker on mount
  useEffect(() => {
    const workerScript = `
      let timerId = null;
      let timeLeft = 0;

      self.onmessage = function(e) {
        const { command, value } = e.data;

        switch (command) {
          case 'start':
            timeLeft = value;
            if (timerId) clearInterval(timerId);
            timerId = setInterval(() => {
              timeLeft--;
              self.postMessage({ type: 'tick', timeLeft: timeLeft });
              if (timeLeft <= 0) {
                clearInterval(timerId);
                timerId = null;
                self.postMessage({ type: 'finished' });
              }
            }, 1000);
            break;

          case 'pause':
            if (timerId) {
              clearInterval(timerId);
              timerId = null;
            }
            break;
          
          case 'resume':
            if (!timerId && timeLeft > 0) {
              timerId = setInterval(() => {
                timeLeft--;
                self.postMessage({ type: 'tick', timeLeft: timeLeft });
                if (timeLeft <= 0) {
                  clearInterval(timerId);
                  timerId = null;
                  self.postMessage({ type: 'finished' });
                }
              }, 1000);
            }
            break;

          case 'stop':
            if (timerId) {
              clearInterval(timerId);
              timerId = null;
            }
            timeLeft = 0;
            break;
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const newWorker = new Worker(workerUrl);
    workerRef.current = newWorker;

    const handleWorkerMessage = (event: MessageEvent) => {
      const { type, timeLeft: newTimeLeft } = event.data;
      if (type === 'tick') {
        setTimeLeft(newTimeLeft);
      } else if (type === 'finished') {
        setTimeLeft(0);
      }
    };

    newWorker.addEventListener('message', handleWorkerMessage);

    return () => {
      newWorker.postMessage({ command: 'stop' });
      newWorker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  // Start/reset timer in worker when phase changes
  useEffect(() => {
    let initialTime: number;
    if (phase === 'study') {
      initialTime = session.duration * 60;
    } else if (phase === 'break') {
      initialTime = session.duration <= 60 ? 10 * 60 : 20 * 60;
    } else {
      return; // 'finished' state
    }

    setTimeLeft(initialTime); // Update UI immediately
    if (!isPaused) {
      workerRef.current?.postMessage({ command: 'start', value: initialTime });
    }
  }, [phase, session.duration]);

  // Phase transition logic, triggered by timeLeft
  useEffect(() => {
    if (timeLeft <= 0) {
      if (phase === 'study') {
        playAlarm();
        const timeout = setTimeout(() => setPhase('break'), 2000);
        return () => clearTimeout(timeout);
      } else if (phase === 'break') {
        playAlarm();
        const timeout = setTimeout(() => setPhase('finished'), 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [timeLeft, phase, playAlarm]);

  const handlePauseToggle = () => {
    setIsPaused(prev => {
      const newPausedState = !prev;
      workerRef.current?.postMessage({ command: newPausedState ? 'pause' : 'resume' });
      return newPausedState;
    });
  };
  
  // Drag handling logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
        isDragging.current = true;
        document.body.style.cursor = 'grabbing';
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            offset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !panelRef.current) return;
    setPosition({ 
        x: e.clientX - offset.current.x, 
        y: e.clientY - offset.current.y,
        hasBeenDragged: true,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [handleMouseMove, handleMouseUp]);

  const getStatusText = () => {
    switch (phase) {
      case 'study': return 'Study Session';
      case 'break': return 'Time for a break!';
      case 'finished': return 'Session Complete!';
      default: return '';
    }
  };
  
  const timerRingColor = phase === 'study' ? 'stroke-sky-500' : 'stroke-green-500';
  const totalDuration = phase === 'study' ? session.duration * 60 : (session.duration <= 60 ? 10 * 60 : 20 * 60);
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  
  const style = position.hasBeenDragged 
    ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none' } 
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div
      ref={panelRef}
      style={style}
      className={`fixed z-50 w-80 h-96 ${!position.hasBeenDragged ? 'modal-panel-animate' : ''}`}
    >
        <div 
            className="w-full h-full glass-panel rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-between text-center"
            onMouseDown={handleMouseDown}
        >
            <div className="w-full flex justify-between items-center drag-handle cursor-grab">
                <GripVerticalIcon className="w-6 h-6 text-slate-500"/>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full">
                    <XIcon className="w-5 h-5"/>
                </button>
            </div>
            
            <div className="flex flex-col items-center">
                <p className="font-semibold text-lg text-sky-400">{getStatusText()}</p>
                <p className="text-white text-xl font-semibold mt-1 truncate w-64">{session.title}</p>
            </div>

            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" strokeWidth="8" className="stroke-slate-700/50" fill="transparent"/>
                    <circle cx="50" cy="50" r="45" strokeWidth="8" className={timerRingColor} fill="transparent"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={(1 - progress) * (2 * Math.PI * 45)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <span className="text-5xl font-mono font-bold text-white tracking-tighter">
                    {phase === 'finished' ? 'Done!' : formatTime(timeLeft)}
                </span>
            </div>

            <div className="flex items-center gap-4">
                {phase !== 'finished' ? (
                    <button onClick={handlePauseToggle} className="w-16 h-16 bg-white/90 text-slate-900 rounded-full flex items-center justify-center hover:bg-white active:scale-95 transition-all shadow-lg shadow-white/10">
                        {isPaused ? <PlayIcon className="w-8 h-8"/> : <PauseIcon className="w-8 h-8"/>}
                    </button>
                ) : (
                     <button onClick={onClose} className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-600 transition-all active:scale-95">
                        Finish Session
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default PomodoroTimer;