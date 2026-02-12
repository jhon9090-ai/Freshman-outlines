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

const quickActions = [
  'Rebuild my timeline for today based on what I missed.',
  'Give me a 90-minute emergency recovery sprint for this subject.',
  'Convert the next 3 tasks into active recall drills with checkpoints.',
];

const MentorChatModal: React.FC<MentorChatModalProps> = ({ isOpen, onClose, outlines, trackerState, onUpdateChat, onTeachMentor, appSettings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(trackerState.chatHistory.length > 0 ? trackerState.chatHistory : [
    { role: 'model', text: 'Mentor online. I can re-plan your day, rescue your pace, and convert your goals to executable steps.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTeaching, setIsTeaching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setMessages(trackerState.chatHistory.length ? trackerState.chatHistory : [{ role: 'model', text: 'Mentor online. Ask me for a tactical schedule or objective rescue plan.' }]);
    }
  }, [isOpen, trackerState.chatHistory]);

  const handleSend = async (textOverride?: string, e?: React.FormEvent) => {
    e?.preventDefault();
    const outgoing = (textOverride ?? input).trim();
    if (!outgoing || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: outgoing };
    const updated = [...messages, userMsg];
    setMessages(updated);
    onUpdateChat(updated);
    setInput('');
    setIsLoading(true);

    try {
      const response = await consultMentor(outgoing, updated, outlines, trackerState, appSettings);
      const modelMsg: ChatMessage = { role: 'model', text: String(response) };
      const finalHistory = [...updated, modelMsg];
      setMessages(finalHistory);
      onUpdateChat(finalHistory);
    } catch {
      const fallback: ChatMessage = { role: 'model', text: 'Mentor link is unstable. Retry now and I will continue from the latest context.' };
      const finalHistory = [...updated, fallback];
      setMessages(finalHistory);
      onUpdateChat(finalHistory);
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

        onTeachMentor({ name: file.name, content, dateAdded: new Date().toISOString() });

        const systemMsg: ChatMessage = {
          role: 'model',
          text: `Ingest complete for **${file.name}**. I can now mirror this exam style in your daily drills and mentoring.`
        };
        const updatedHistory = [...messages, systemMsg];
        setMessages(updatedHistory);
        onUpdateChat(updatedHistory);

      } catch {
        alert('Failed to process learned material.');
      } finally {
        setIsTeaching(false);
        if (e.target) e.target.value = '';
      }
    };

    if (file.type === 'application/pdf') reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }, [messages, onTeachMentor, onUpdateChat]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Consult Mentor" variant="solid" size="full">
      <div className="h-full min-h-0 flex flex-col">
        <div className="pb-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-sky-400 uppercase tracking-widest">Strategic Partner</p>
            <p className="text-xs text-slate-400">Wide full-screen workspace for clearer planning and execution coaching.</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isTeaching}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/40 rounded-xl text-xs font-black uppercase text-sky-300"
          >
            {isTeaching ? <Spinner className="w-4 h-4" /> : <UploadIcon className="w-4 h-4" />}
            Teach Partner
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileTeach} className="hidden" accept=".pdf,.txt,.json" />
        </div>

        <div className="py-3 flex flex-wrap gap-2 border-b border-white/10">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => handleSend(action)}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs hover:bg-sky-500/20 hover:text-sky-200 transition-all"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 py-4 space-y-4 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'}`}>
                {m.role === 'model' && (
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-sky-400 uppercase tracking-widest">
                    <StarIcon className="w-3 h-3" /> Mentor Insight
                  </div>
                )}
                <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{String(m.text)}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start"><div className="bg-slate-900 border border-slate-800 p-3 rounded-xl"><Spinner className="w-5 h-5 text-sky-500" /></div></div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="pt-4 border-t border-white/10">
          <form onSubmit={(e) => handleSend(undefined, e)} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a tactical plan, recovery strategy, or objective-based drills..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 pr-14 text-white focus:ring-2 focus:ring-sky-500 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-slate-950 rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-sky-500 hover:text-white"
            >
              <ArrowUpIcon className="w-6 h-6" />
            </button>
          </form>
          <p className="text-[10px] mt-2 text-slate-500 uppercase tracking-[0.2em]">Learned Docs: {trackerState.teachedMaterials.length}</p>
        </div>
      </div>
    </Modal>
  );
};

export default MentorChatModal;
