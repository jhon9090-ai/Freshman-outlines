
import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { StudyOutline, TrackerState, AppSettings, ChatMessage, TeachedMaterial } from '../types';
import { consultMentor } from '../services/geminiService';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';
import ArrowUpIcon from './icons/ArrowUpIcon';
import StarIcon from './icons/StarIcon';
import UploadIcon from './icons/UploadIcon';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface MentorChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    outlines: StudyOutline[];
    trackerState: TrackerState;
    onUpdateChat: (newHistory: ChatMessage[]) => void;
    onTeachMentor: (material: TeachedMaterial) => void;
    appSettings: AppSettings;
}

const MentorChatModal: React.FC<MentorChatModalProps> = ({ isOpen, onClose, outlines, trackerState, onUpdateChat, onTeachMentor, appSettings }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(trackerState.chatHistory.length > 0 ? trackerState.chatHistory : [
        { role: 'model', text: "Strategic Partner workstation online. Establish query parameters for 2026 trajectory." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTeaching, setIsTeaching] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && trackerState.chatHistory.length > 0) {
            setMessages(trackerState.chatHistory);
        }
    }, [isOpen, trackerState.chatHistory]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', text: trimmedInput };
        const updatedWithUser = [...messages, userMsg];
        setMessages(updatedWithUser);
        onUpdateChat(updatedWithUser);
        setInput('');
        setIsLoading(true);

        try {
            const response = await consultMentor(trimmedInput, messages, outlines, trackerState, appSettings);
            const modelMsg: ChatMessage = { role: 'model', text: String(response) };
            const finalHistory = [...updatedWithUser, modelMsg];
            setMessages(finalHistory);
            onUpdateChat(finalHistory);
        } catch (err) {
            const errorMsg: ChatMessage = { role: 'model', text: "SYSTEM CRITICAL: Communication link fail. Re-establish sync." };
            setMessages([...updatedWithUser, errorMsg]);
        } finally {
            setIsLoading(false);
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
                } else {
                    content = event.target?.result as string;
                }
                
                onTeachMentor({
                    name: file.name,
                    content,
                    dateAdded: new Date().toISOString()
                });

                const systemMsg: ChatMessage = { 
                    role: 'model', 
                    text: `*System Analysis Completed:* Ingested technical patterns from "${file.name}". I have mapped the rigor and presentation style to our 2026 trajectory. Daily tasks will now adapt to this data.` 
                };
                const updatedHistory = [...messages, systemMsg];
                setMessages(updatedHistory);
                onUpdateChat(updatedHistory);

            } catch (err) {
                alert("Failed to process learned material.");
            } finally {
                setIsTeaching(false);
            }
        };

        if (file.type === 'application/pdf') reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
        
        if (e.target) e.target.value = '';
    }, [messages, onTeachMentor, onUpdateChat]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Strategic Consultation" variant="solid">
            <div className="flex flex-col h-[80vh]">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[92%] p-4 rounded-2xl text-sm leading-relaxed ${
                                m.role === 'user' 
                                    ? 'bg-sky-500 text-white rounded-br-none shadow-lg' 
                                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner'
                            }`}>
                                {m.role === 'model' && (
                                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-sky-400 uppercase tracking-widest">
                                        <StarIcon className="w-3 h-3" />
                                        Strategic Partner Insight
                                    </div>
                                )}
                                <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-auto">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkMath, remarkGfm]} 
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {String(m.text)}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-bl-none">
                                <Spinner className="w-5 h-5 text-sky-500" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="flex flex-col gap-3 p-4 bg-slate-950/50 rounded-3xl border border-white/5">
                    <form onSubmit={handleSend} className="relative">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Discuss technical patterns or trajectory..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pr-12 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder-slate-600"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-slate-950 rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-sky-500 hover:text-white transition-all shadow-md"
                        >
                            <ArrowUpIcon className="w-6 h-6" />
                        </button>
                    </form>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTeaching}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-xs font-black uppercase tracking-widest text-sky-400 hover:bg-sky-500/20 transition-all group"
                    >
                        {isTeaching ? <Spinner className="w-4 h-4" /> : <UploadIcon className="w-4 h-4 group-hover:animate-bounce" />}
                        Teach Partner New Exam Patterns (.pdf, .txt, .json)
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileTeach} className="hidden" accept=".pdf,.txt,.json" />
                </div>
                
                <div className="mt-4 flex flex-col items-center gap-1">
                     <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">Contextual Reservoir: {trackerState.teachedMaterials.length} Technical Documents</p>
                     <p className="text-[8px] text-slate-600 uppercase tracking-[0.1em]">Strategic Workstation V8.0</p>
                </div>
            </div>
        </Modal>
    );
};

export default MentorChatModal;
