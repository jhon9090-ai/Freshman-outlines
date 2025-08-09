
import React, { useId } from 'react';

interface CheckboxProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, isChecked, onToggle }) => {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="peer hidden"
      />
      <label
        htmlFor={id}
        className="flex items-center cursor-pointer"
      >
        <span className={`
          flex-shrink-0 w-5 h-5 border-2 rounded-md transition-all duration-200
          ${isChecked ? 'bg-[rgba(var(--primary-rgb),1)] border-[rgba(var(--primary-rgb),1)]' : 'border-slate-500 bg-slate-700/50'}
          peer-hover:border-[rgba(var(--primary-rgb),0.8)]
        `}>
          <svg className={`w-full h-full text-white transition-opacity ${isChecked ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span className={`ml-3 text-slate-300 transition-colors peer-checked:text-slate-500 peer-checked:line-through`}>
          {label}
        </span>
      </label>
    </div>
  );
};

export default Checkbox;