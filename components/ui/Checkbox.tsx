import React from 'react';
import EditableText from './EditableText';

interface CheckboxProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
  onLabelSave: (newLabel: string) => void;
  isEditable?: boolean;
}

const CheckmarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
        <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
    </svg>
);


const Checkbox: React.FC<CheckboxProps> = ({ label, isChecked, onToggle, onLabelSave, isEditable = true }) => {
  return (
    <div className="flex items-start gap-4 group">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isChecked}
        className={`
          flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 transition-all duration-200
          flex items-center justify-center
          ${isChecked
            ? 'bg-sky-500 border-sky-500'
            : 'bg-transparent border-slate-600 group-hover:border-sky-500/70'
          }
        `}
      >
        <CheckmarkIcon className={`w-5 h-5 text-white transition-transform duration-200 ease-out ${isChecked ? 'scale-100 pop-in-animate' : 'scale-0'}`} />
      </button>
      <EditableText 
        initialValue={label}
        onSave={onLabelSave}
        Tag="div"
        isEditable={isEditable}
        className={`w-full text-slate-300 transition-colors text-lg ${isChecked ? 'text-slate-500 line-through' : ''}`}
        inputClassName="text-lg"
      />
    </div>
  );
};

export default Checkbox;