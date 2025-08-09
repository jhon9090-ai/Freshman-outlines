


import React, { useState, useEffect } from 'react';
import { StudyOutline } from '../types';
import { generateCompletionMentoring } from '../services/geminiService';
import { generateProgressReportPdf } from '../services/pdfService';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import DownloadIcon from './icons/DownloadIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface CompletionModalProps {
    outline: StudyOutline;
    onClose: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ outline, onClose }) => {
    const [mentorFeedback, setMentorFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const feedback = await generateCompletionMentoring(outline);
                setMentorFeedback(feedback);
            } catch (error) {
                console.error("Failed to get mentor feedback", error);
                setMentorFeedback("I'm having trouble connecting right now, but great job completing your outline!");
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeedback();
    }, [outline]);
    
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
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 -mt-4">
                <CheckCircleIcon className="w-10 h-10" />
            </div>
            
            <p className="text-slate-400 mb-6">Congratulations on finishing your study session for <strong className="text-white">{outline.title}</strong>.</p>
            
            <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg text-white mb-3">Your Progress</h3>
                <div className="w-full bg-slate-700 rounded-full h-4">
                    <div 
                        className="bg-gradient-to-r from-[rgba(var(--primary-rgb),0.7)] to-[rgba(var(--primary-rgb),1)] h-4 rounded-full text-xs flex items-center justify-center font-bold" 
                        style={{ width: `${progress}%` }}
                    >
                        {progress > 15 ? `${progress}%` : ''}
                    </div>
                </div>
                <p className="text-sm text-slate-300 mt-2">{completedCount} of {totalObjectives} objectives completed</p>
            </div>
            
             <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
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

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleDownloadReport}
                    className="flex-1 flex items-center justify-center gap-2 bg-[rgba(var(--primary-rgb),1)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[rgba(var(--primary-rgb),0.8)] transition-colors"
                >
                    <DownloadIcon className="w-5 h-5"/>
                    Download Report
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 bg-white/10 text-white font-semibold py-3 px-4 rounded-md hover:bg-white/20 transition-colors"
                >
                    Close
                </button>
            </div>
          </div>
        </Modal>
    );
};

export default CompletionModal;