import React, { useState } from 'react';
import { RevisionAssistant } from '../types';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface AIAdvicePanelProps {
    revisionData: RevisionAssistant;
    outlineTitle: string;
    onClose: () => void;
}

const AIAdvicePanel: React.FC<AIAdvicePanelProps> = ({ revisionData, outlineTitle, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    // Function to generate personalized advice based on the outline content
    const generateAdvice = async (topic: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Simulate AI advice generation (in a real implementation, this would call the Gemini API)
            // This is a placeholder for demonstration purposes
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
            
            // Generate advice based on the selected topic
            let generatedAdvice = '';
            
            switch(topic) {
                case 'study-strategy':
                    generatedAdvice = `Based on your outline "${outlineTitle}", here are some study strategies:\n\n`;
                    generatedAdvice += '1. **Spaced Repetition**: Review the key definitions at increasing intervals.\n';
                    generatedAdvice += '2. **Active Recall**: Test yourself with the exam questions before reviewing the answers.\n';
                    generatedAdvice += '3. **Focus Areas**: Prioritize the focus areas identified in your outline.\n';
                    generatedAdvice += '4. **Concept Mapping**: Create visual connections between the main topics and subtopics.\n';
                    generatedAdvice += '5. **Teach to Learn**: Explain the quick facts to someone else to reinforce your understanding.';
                    break;
                    
                case 'time-management':
                    generatedAdvice = `For effective time management while studying "${outlineTitle}", consider:\n\n`;
                    generatedAdvice += '1. **Pomodoro Technique**: Study in focused 25-minute sessions with 5-minute breaks.\n';
                    generatedAdvice += '2. **Topic Prioritization**: Allocate more time to the focus areas identified in your outline.\n';
                    generatedAdvice += '3. **Scheduled Reviews**: Set specific times to review the key definitions and quick facts.\n';
                    generatedAdvice += '4. **Practice Sessions**: Dedicate time to answering the exam questions without looking at answers.\n';
                    generatedAdvice += '5. **Reflection Time**: After each study session, take 5 minutes to summarize what you learned.';
                    break;
                    
                case 'exam-preparation':
                    generatedAdvice = `To prepare for exams on "${outlineTitle}", follow these steps:\n\n`;
                    generatedAdvice += '1. **Review Focus Areas**: These are likely to appear on your exam.\n';
                    generatedAdvice += '2. **Practice with Exam Questions**: Use the provided questions as a starting point.\n';
                    generatedAdvice += '3. **Master Key Definitions**: Create flashcards for quick review.\n';
                    generatedAdvice += '4. **Understand Connections**: Look for relationships between different topics in your outline.\n';
                    generatedAdvice += '5. **Self-Testing**: Create your own questions based on the learning objectives.';
                    break;
                    
                case 'learning-style':
                    generatedAdvice = `Adapt your learning style for "${outlineTitle}" with these approaches:\n\n`;
                    generatedAdvice += '1. **Visual Learners**: Create diagrams connecting the main topics and subtopics.\n';
                    generatedAdvice += '2. **Auditory Learners**: Record yourself explaining the key definitions and listen to them.\n';
                    generatedAdvice += '3. **Reading/Writing Learners**: Summarize each subtopic in your own words.\n';
                    generatedAdvice += '4. **Kinesthetic Learners**: Create physical flashcards and organize them into categories.\n';
                    generatedAdvice += '5. **Multimodal Approach**: Combine methods by teaching concepts to others while using visual aids.';
                    break;
                    
                default:
                    generatedAdvice = 'Select a topic to get personalized AI advice for your study outline.';
            }
            
            setAdvice(generatedAdvice);
        } catch (err) {
            console.error('Error generating advice:', err);
            setError('Failed to generate advice. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b border-slate-700">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" /> Back to Study
                </button>
                <h1 className="text-xl font-bold text-center flex-1">
                    ✨ AI Study Advisor
                </h1>
                <div className="w-24"></div> {/* Spacer for centering */}
            </header>
            
            <main className="flex-1 overflow-y-auto p-6">
                <div className="w-full max-w-2xl glass-panel rounded-xl p-8 shadow-2xl mx-auto">
                    <h2 className="font-heading text-3xl text-[rgba(var(--accent-rgb),1)] text-center mb-2">AI Study Advisor</h2>
                    <p className="text-center text-slate-400 mb-6">Get personalized advice to optimize your learning</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                    onClick={() => generateAdvice('study-strategy')}
                    className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)] flex flex-col items-center justify-center text-center"
                >
                    Study Strategies
                </button>
                <button 
                    onClick={() => generateAdvice('time-management')}
                    className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)] flex flex-col items-center justify-center text-center"
                >
                    Time Management
                </button>
                <button 
                    onClick={() => generateAdvice('exam-preparation')}
                    className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)] flex flex-col items-center justify-center text-center"
                >
                    Exam Preparation
                </button>
                <button 
                    onClick={() => generateAdvice('learning-style')}
                    className="p-4 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-[rgba(var(--primary-rgb),0.5)] flex flex-col items-center justify-center text-center"
                >
                    Learning Styles
                </button>
            </div>
            
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <Spinner className="w-8 h-8 text-[rgba(var(--primary-rgb),1)]" />
                    <span className="ml-3 text-slate-300">Generating personalized advice...</span>
                </div>
            ) : error ? (
                <div className="bg-red-900/30 border border-red-800 rounded-md p-4 text-red-200">
                    {error}
                </div>
            ) : advice ? (
                <div className="bg-white/5 rounded-lg p-6 border border-[rgba(var(--primary-rgb),0.3)]">
                    <div className="prose prose-invert max-w-none">
                        {advice.split('\n').map((line, i) => (
                            <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400 p-8">
                    Select a topic above to get personalized AI advice for your study outline.
                </div>
            )}
                </div>
            </main>
        </div>
    );
};

export default AIAdvicePanel;