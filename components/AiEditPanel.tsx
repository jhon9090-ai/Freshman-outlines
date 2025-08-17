import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Spinner from './ui/Spinner';
import PlusIcon from './icons/PlusIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface AiEditPanelProps {
    onCommand: (command: string, fileContent?: string) => Promise<void>;
}

const AiEditPanel: React.FC<AiEditPanelProps> = ({ onCommand }) => {
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReadingFile, setIsReadingFile] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (panelRef.current) {
            isDragging.current = true;
            offset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y
            };
            document.body.style.cursor = 'grabbing';
            e.preventDefault();
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        setPosition({
            x: e.clientX - offset.current.x,
            y: e.clientY - offset.current.y
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        if (isDragging.current) {
            isDragging.current = false;
            document.body.style.cursor = 'default';
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
             document.body.style.cursor = 'default';
        };
    }, [handleMouseMove, handleMouseUp]);


    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setIsReadingFile(true);
        setError(null);
        setAttachedFile(null);
        let fileContent = '';

        try {
            if (selectedFile.type === 'application/pdf') {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const arrayBuffer = event.target?.result as ArrayBuffer;
                    if (arrayBuffer) {
                        try {
                            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                            let fullText = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                            }
                            setAttachedFile({ name: selectedFile.name, content: fullText });
                        } catch (pdfError) {
                            setError('Failed to parse PDF file.');
                        } finally {
                           setIsReadingFile(false);
                        }
                    }
                };
                reader.readAsArrayBuffer(selectedFile);
            } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                    fileContent = event.target?.result as string;
                    setAttachedFile({ name: selectedFile.name, content: fileContent });
                    setIsReadingFile(false);
                };
                reader.onerror = () => {
                    setError('Failed to read the file.');
                    setIsReadingFile(false);
                }
                reader.readAsText(selectedFile);
            }
        } catch (err) {
            setError('Error processing file.');
            setIsReadingFile(false);
        }
        if (e.target) e.target.value = ''; // Allow re-uploading the same file
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!command.trim() && !attachedFile) || isLoading) return;
        
        setIsLoading(true);
        setError(null);
        try {
            await onCommand(command, attachedFile?.content);
            setCommand('');
            setAttachedFile(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to apply changes.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div 
            className="fixed bottom-6 left-1/2 w-full max-w-2xl px-4 z-40 animate-fadeInUp"
            style={{ transform: `translateX(calc(-50% + ${position.x}px)) translateY(${position.y}px)` }}
        >
            <div 
                className="absolute inset-0 bg-[rgba(var(--primary-rgb),0.2)] rounded-full blur-2xl opacity-50" 
                aria-hidden="true">
            </div>
            <div 
                ref={panelRef}
                className="relative glass-panel backdrop-blur-md rounded-xl shadow-2xl flex items-center p-2 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full h-full">
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isReadingFile || isLoading}
                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center bg-transparent rounded-full transition-colors disabled:opacity-50
                            ${attachedFile ? 'text-[rgba(var(--primary-rgb),1)]' : 'text-slate-400 hover:text-white'}`
                        }
                        title={attachedFile ? `Attached: ${attachedFile.name}` : "Add a file for context"}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {isReadingFile ? <Spinner className="w-5 h-5"/> : <PlusIcon className="w-6 h-6" />}
                    </button>
                    
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md" className="hidden"/>
                    
                    <input 
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Tell the AI what to change... (Ctrl+Shift+X to toggle)"
                        className="w-full h-full bg-transparent focus:outline-none text-white placeholder-slate-400 px-2"
                        disabled={isLoading || isReadingFile}
                        onMouseDown={(e) => { e.stopPropagation(); }}
                    />
                    
                    <button 
                        type="submit"
                        disabled={(!command.trim() && !attachedFile) || isLoading || isReadingFile}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[rgba(var(--primary-rgb),1)] text-white rounded-full transition-all disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-[rgba(var(--primary-rgb),0.8)] active:scale-95"
                        title="Apply changes"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {isLoading ? <Spinner className="w-5 h-5 text-white" /> : <ArrowUpIcon className="w-6 h-6" />}
                    </button>
                </form>
            </div>
             {error && (
                <div className="absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 text-xs px-3 py-1.5 rounded-md w-max max-w-[calc(100%-1rem)] text-center shadow-lg animate-fadeIn">
                    {error}
                </div>
            )}
        </div>
    );
};

export default AiEditPanel;
