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
    
    const handleDragStart = (clientX: number, clientY: number) => {
        if (panelRef.current) {
            isDragging.current = true;
            const rect = panelRef.current.getBoundingClientRect();
            const parentRect = panelRef.current.parentElement?.getBoundingClientRect();
            if (!parentRect) return;

            // Calculate initial offset from the parent container's top-left, not the viewport
            offset.current = {
                x: clientX - (rect.left - parentRect.left),
                y: clientY - (rect.top - parentRect.top)
            };
            document.body.style.cursor = 'grabbing';
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).classList.contains('cursor-grab')) {
            handleDragStart(e.clientX, e.clientY);
            e.preventDefault();
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).classList.contains('cursor-grab')) {
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    
    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging.current || !panelRef.current) return;
        const parentRect = panelRef.current.parentElement?.getBoundingClientRect();
        if(!parentRect) return;

        let newX = clientX - offset.current.x;
        let newY = clientY - offset.current.y;

        setPosition({ x: newX, y: newY });
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging.current) handleDragMove(e.clientX, e.clientY);
    }, [handleDragMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (isDragging.current) {
            e.preventDefault(); // Prevent page scroll
            handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, [handleDragMove]);

    const handleDragEnd = useCallback(() => {
        if (isDragging.current) {
            isDragging.current = false;
            document.body.style.cursor = 'default';
        }
    }, []);


    useEffect(() => {
        const currentPanel = panelRef.current;
        if(currentPanel) {
             const parentRect = currentPanel.parentElement?.getBoundingClientRect();
             if(!parentRect) return;
             // Clamp position to stay within parent bounds
             const newX = Math.max(0, Math.min(position.x, parentRect.width - currentPanel.offsetWidth));
             const newY = Math.max(0, Math.min(position.y, parentRect.height - currentPanel.offsetHeight));
            
            currentPanel.style.transform = `translate(${newX}px, ${newY}px)`;
        }
    }, [position]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleDragEnd);
            document.body.style.cursor = 'default';
        };
    }, [handleMouseMove, handleDragEnd, handleTouchMove]);


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
            ref={panelRef}
            className="absolute bottom-8 left-1/2 w-full max-w-2xl px-4 z-40"
            style={{ transform: `translateX(-50%)` }}
        >
            <div 
                className="absolute inset-0 bg-sky-500/20 rounded-full blur-3xl opacity-50" 
                aria-hidden="true">
            </div>
            <div className="relative">
                <div 
                    className="glass-panel backdrop-blur-md rounded-2xl shadow-2xl flex items-center p-2 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full h-full">
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isReadingFile || isLoading}
                            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center bg-transparent rounded-xl transition-colors disabled:opacity-50
                                ${attachedFile ? 'text-sky-400' : 'text-slate-400 hover:text-white'}`
                            }
                            title={attachedFile ? `Attached: ${attachedFile.name}` : "Add a file for context"}
                        >
                            {isReadingFile ? <Spinner className="w-5 h-5"/> : <PlusIcon className="w-6 h-6" />}
                        </button>
                        
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md" className="hidden"/>
                        
                        <input 
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Tell the AI what to change..."
                            className="w-full h-full bg-transparent focus:outline-none text-white placeholder-slate-400 px-2 text-lg"
                            disabled={isLoading || isReadingFile}
                        />
                        
                        <button 
                            type="submit"
                            disabled={(!command.trim() && !attachedFile) || isLoading || isReadingFile}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white text-slate-900 rounded-full transition-all disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-200 active:scale-95"
                            title="Apply changes"
                        >
                            {isLoading ? <Spinner className="w-5 h-5" /> : <ArrowUpIcon className="w-6 h-6" />}
                        </button>
                    </form>
                </div>
                {error && (
                    <div className="absolute top-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 text-sm px-4 py-2 rounded-lg w-max max-w-[calc(100%-1rem)] text-center shadow-lg modal-panel-animate">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiEditPanel;