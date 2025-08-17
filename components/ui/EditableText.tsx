
import React, { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  Tag?: keyof JSX.IntrinsicElements;
  placeholder?: string;
  isEditable?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({ initialValue, onSave, className, inputClassName, Tag = 'div', placeholder = "Click to edit", isEditable = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  useEffect(() => {
    // Update internal value if initialValue prop changes from outside
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    if (value.trim() !== initialValue.trim()) {
      onSave(value.trim() || 'Untitled'); // Prevent saving empty strings
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation(); 
    e.preventDefault(); 
    setIsEditing(true);
  }

  if (isEditing) {
    const InputTag = 'input';
    return (
      <InputTag
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-800/80 border border-[rgba(var(--primary-rgb),1)] rounded-md px-1 -my-0.5 w-full ${className} ${inputClassName}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Tag
      onClick={handleClick}
      className={`${isEditable ? 'cursor-text hover:bg-white/10' : ''} rounded-md px-1 -my-0.5 transition-colors ${className}`}
      title={isEditable ? "Click to edit" : ""}
    >
      {initialValue || <span className="text-slate-500 italic">{placeholder}</span>}
    </Tag>
  );
};

export default EditableText;
