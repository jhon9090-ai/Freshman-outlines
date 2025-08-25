

import React, { useState, useEffect } from 'react';
import XIcon from '../icons/XIcon';
import TrashIcon from '../icons/TrashIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  titleIcon?: 'delete';
  backdrop?: boolean;
  variant?: 'glass' | 'solid';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, titleIcon, backdrop = true, variant = 'glass' }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleClose = React.useCallback(() => {
    if (!isOpen) return;
    setIsAnimatingOut(true);
    setTimeout(() => {
        onClose();
        setIsAnimatingOut(false);
    }, 300); // must match animation duration
  }, [isOpen, onClose]);

  useEffect(() => {
    // Listen for escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen && !isAnimatingOut) {
    return null;
  }

  const renderTitleIcon = () => {
    if (titleIcon === 'delete') {
      return <TrashIcon className="w-5 h-5 mr-2 text-red-400" />
    }
    return null;
  }
  
  const backdropAnimation = isAnimatingOut ? 'animate-fade-out' : 'modal-backdrop-animate';
  const panelAnimation = isAnimatingOut ? 'animate-scale-out' : 'modal-panel-animate';
  const panelClass = variant === 'solid' ? 'solid-card-panel' : 'glass-panel';
  
  const panelContent = (
    <div 
      className={`${panelClass} w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl ${panelAnimation} ${backdrop ? '' : 'pointer-events-auto'}`}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          {renderTitleIcon()}
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <button onClick={handleClose} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full">
          <XIcon className="w-6 h-6" />
        </button>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${backdrop ? 'bg-slate-950/70' : 'pointer-events-none'} ${backdropAnimation}`}
        onClick={backdrop ? handleClose : undefined}
    >
      {panelContent}
    </div>
  );
};

export default Modal;