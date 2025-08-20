

import React, { useState, useEffect } from 'react';
import { StudyOutline, AppSettings } from '../types';
import { generateCompletionMentoring } from '../services/geminiService';
import { generateProgressReportPdf } from '../services/pdfService';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import DownloadIcon from './icons/DownloadIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface CircularProgressProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
}
const CircularProgress: React.FC<CircularProgressProps> = ({ percentage, size = 120, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const [displayPercentage, setDisplayPercentage] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = Math.round(percentage);
        if (start === end) return;

        const incrementTime = 1000 / end; // Total time for animation is 1 second
        const timer = setInterval(() => {
            start += 1;
            setDisplayPercentage(start);
            if (start === end) clearInterval(timer);
        }, incrementTime);

        return () => clearInterval(timer);
    }, [percentage]);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle
                    stroke="rgba(14, 165, 233, 0.2)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke="url(#progressGradient)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{displayPercentage}%</span>
            </div>
        </div>
    );
};


interface CompletionModalProps {
    outline: StudyOutline;
    onClose: () => void;
    appSettings: AppSettings;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ outline, onClose, appSettings }) => {
    const [mentorFeedback, setMentorFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            setIsLoading(true);
            try {
                const feedback = await generateCompletionMentoring(outline, appSettings);
                setMentorFeedback(feedback);
            } catch (error) {
                console.error("Failed to get mentor feedback", error);
                setMentorFeedback("I'm having trouble connecting right now, but great job completing your outline!");
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeedback();
    }, [outline, appSettings]);
    
    const allObjectives = outline.isThemeOutline
      ? outline.units?.flatMap(u => u.mainTopics.flatMap(t => t.subtopics.flatMap(st => st.learningObjectives))) || []
      : outline.mainTopics?.flatMap(t => t.subtopics.flatMap(st => st.learningObjectives)) || [];

    const totalObjectives = allObjectives.length;
    const completedCount = outline.completedObjectives.length;
    const progress = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;

    const handleDownloadReport = () => {
        generateProgressReportPdf(outline, mentorFeedback);
    };

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose}
            title={`${outline.isThemeOutline ? 'Theme' : 'Outline'} Complete!`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mx-auto mb-6">
                <CircularProgress percentage={progress} />
            </div>
            
            <p className="text-slate-400 mb-6 text-lg">Congratulations on finishing your study session for <strong className="text-white">{outline.title}</strong>.</p>
            
            <div className="bg-slate-900/70 rounded-xl p-4 mb-8 text-left border border-slate-700">
                <h3 className="font-semibold text-lg text-white mb-2">Mentor's Note</h3>
                {isLoading ? (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Spinner className="w-4 h-4" />
                        <span>Generating feedback...</span>
                    </div>
                ) : (
                    <p className="text-slate-300 italic">"{mentorFeedback}"</p>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleDownloadReport}
                    className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600"
                >
                    <DownloadIcon className="w-5 h-5"/>
                    Download Report
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-600"
                >
                    Close
                </button>
            </div>
          </div>
        </Modal>
    );
};

export default CompletionModal;