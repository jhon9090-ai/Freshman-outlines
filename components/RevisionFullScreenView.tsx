


import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { RevisionAssistant, RevisionSection, ExamAnalysis, AppSettings } from '../types';
import { generateComponentPdf } from '../services/pdfService';
import { analyzeExamPaper } from '../services/geminiService';
import XIcon from './icons/XIcon';
import DownloadIcon from './icons/DownloadIcon';
import Spinner from './ui/Spinner';
import MCQInteractive from './ui/MCQInteractive';
import DefinitionCallout from './ui/DefinitionCallout';
import QuickFactCallout from './ui/QuickFactCallout';
import UploadIcon from './icons/UploadIcon';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface RevisionFullScreenViewProps {
    view: RevisionSection;
    data: RevisionAssistant;
    onClose: () => void;
    outlineTitle: string;
    appSettings: AppSettings;
}

const Section: React.FC<{title: string; children: React.ReactNode; className?: string}> = ({title, children, className}) => (
    <div className={className}>
        <h3 className="font-heading text-2xl text-[rgba(var(--primary-rgb),1)] mb-3">{title}</h3>
        <div className="space-y-3 text-slate-300">{children}</div>
    </div>
)

const RevisionFullScreenView: React.FC<RevisionFullScreenViewProps> = ({ view, data, onClose, outlineTitle, appSettings }) => {
    const [isDownloading, setIsDownloading] = React.useState(false);
    const contentId = `revision-content-${view}`;

    const [analysis, setAnalysis] = React.useState<ExamAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analysisError, setAnalysisError] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const getTitle = () => {
        switch (view) {
            case 'focus': return 'Focus Areas & Exam Analysis';
            case 'questions': return 'Exam-Style Questions';
            case 'definitions': return 'Key Definitions';
            case 'quick-facts': return 'Quick Facts';
            default: return 'Revision';
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background-dark').trim();
        await generateComponentPdf(contentId, `${outlineTitle}_${view}_Revision`, bgColor);
        setIsDownloading(false);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setAnalysis(null);
        setAnalysisError(null);

        try {
            let textContent = '';
            if (file.type === 'application/pdf') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    if (arrayBuffer) {
                        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            textContent += content.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
                        }
                        triggerAnalysis(textContent);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    textContent = e.target?.result as string;
                    triggerAnalysis(textContent);
                };
                reader.readAsText(file);
            }
        } catch (err) {
            setAnalysisError('Failed to read the file.');
            setIsAnalyzing(false);
        }
    };

    const triggerAnalysis = async (content: string) => {
        if (!content.trim()) {
            setAnalysisError("File seems to be empty.");
            setIsAnalyzing(false);
            return;
        }

        try {
            const result = await analyzeExamPaper(content, outlineTitle, appSettings);
            setAnalysis(result);
        } catch(err) {
            setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze file.');
        } finally {
            setIsAnalyzing(false);
        }
    }


    const renderContent = () => {
        switch (view) {
            case 'focus':
                return (
                    <div className="space-y-10">
                        <div>
                            <h3 className="font-heading text-2xl text-[rgba(var(--primary-rgb),1)] mb-3">Generated Focus Areas</h3>
                            <ul className="list-disc list-inside space-y-3 text-slate-300 text-lg">
                                {data.focusAreas.map((area, i) => <li key={i}>{area}</li>)}
                            </ul>
                        </div>
                        <div className="pt-8 border-t border-white/10">
                            <h3 className="font-heading text-2xl text-[rgba(var(--primary-rgb),1)] mb-2">Past Paper Analysis</h3>
                            <p className="text-slate-400 mb-4">Upload a past exam paper (.pdf, .txt) to get AI-powered insights on question patterns and key topics.</p>
                            
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md" disabled={isAnalyzing}/>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isAnalyzing}
                                className="flex items-center justify-center gap-2 bg-[rgba(var(--primary-rgb),0.8)] text-white font-semibold py-2 px-4 rounded-md hover:bg-[rgba(var(--primary-rgb),1)] transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                <UploadIcon className="w-5 h-5"/>
                                {isAnalyzing ? 'Analyzing...' : 'Upload Exam File'}
                            </button>

                            <div className="mt-6">
                                {isAnalyzing && <div className="flex items-center gap-3 text-lg text-slate-300"><Spinner className="w-6 h-6" /> <p>AI is analyzing the document...</p></div>}
                                {analysisError && <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm rounded-lg p-3">{analysisError}</div>}
                                {analysis && (
                                    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                                        <Section title="Main Focus"><ul className="list-disc list-inside space-y-2">{analysis.mainFocus.map((item, i) => <li key={i}>{item}</li>)}</ul></Section>
                                        <Section title="Question Types"><ul className="list-disc list-inside space-y-2">{analysis.questionTypes.map((item, i) => <li key={i}>{item}</li>)}</ul></Section>
                                        <Section title="Future Predictions"><ul className="list-disc list-inside space-y-2">{analysis.futurePredictions.map((item, i) => <li key={i}>{item}</li>)}</ul></Section>
                                        <Section title="Practice Sources"><ul className="list-disc list-inside space-y-2">{analysis.practiceSources.map((item, i) => <li key={i}>{item}</li>)}</ul></Section>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'questions':
                return (
                    <div className="space-y-6">
                        {data.examQuestions.map((mcq) => <MCQInteractive key={mcq.id} mcq={mcq} />)}
                    </div>
                );
            case 'definitions':
                return (
                    <div className="space-y-4">
                        {data.keyDefinitions.map((def, i) => (
                           <DefinitionCallout key={i} term={def.term} definition={def.definition} />
                        ))}
                    </div>
                );
            case 'quick-facts':
                 return (
                    <div className="space-y-4">
                        {data.quickFacts.map((fact, i) => (
                           <QuickFactCallout key={i} term={fact.term} fact={fact.fact} />
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="fixed inset-0 z-50 bg-[#0A001F]/80 backdrop-blur-md flex flex-col p-4 md:p-8 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col glass-panel rounded-xl overflow-hidden">
                <header className="flex-shrink-0 flex justify-between items-center p-4 md:p-6 border-b border-white/10">
                    <h2 className="font-heading text-2xl md:text-3xl text-white">{getTitle()}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDownload} disabled={isDownloading} title="Download this view as PDF" className="p-2 text-slate-300 hover:text-white hover:bg-white/20 rounded-full transition-colors disabled:cursor-wait">
                           {isDownloading ? <Spinner className="w-6 h-6" /> : <DownloadIcon className="w-6 h-6" />}
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-300 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                <main id={contentId} className="flex-1 overflow-y-auto p-4 md:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default RevisionFullScreenView;