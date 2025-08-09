
import React, { useState, useEffect } from 'react';
import XIcon from '../icons/XIcon';
import TrashIcon from '../icons/TrashIcon'; // Assuming TrashIcon can be used here

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  titleIcon?: 'delete';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, titleIcon }) => {
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

  return (
    <div 
        className={`fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleClose}
    >
      <div 
        className={`glass-panel w-full max-w-md rounded-xl p-6 shadow-2xl ${isAnimatingOut ? 'animate-zoomOut' : 'animate-zoomIn'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {renderTitleIcon()}
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;