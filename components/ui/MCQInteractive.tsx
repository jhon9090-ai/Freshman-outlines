
import React, { useState } from 'react';
import { MCQ } from '../../types';

interface MCQInteractiveProps {
  mcq: MCQ;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const MCQInteractive: React.FC<MCQInteractiveProps> = ({ mcq }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const isAnswered = selectedOption !== null;

  const handleOptionSelect = (index: number) => {
    if (!isAnswered) {
      setSelectedOption(index);
    }
  };

  const getOptionClass = (index: number) => {
    const isSelected = selectedOption === index;
    const isCorrect = index === mcq.correctAnswerIndex;

    if (!isAnswered) {
      return 'border-slate-700 hover:border-sky-500 hover:bg-sky-500/5 hover:scale-[1.02]';
    }
    if (isCorrect) {
      return 'border-green-500 bg-green-500/10 scale-[1.02] shadow-lg shadow-green-500/10';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-500/10';
    }
    return 'border-slate-700 opacity-60';
  };

  return (
    <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/50">
      <p className="text-slate-100 mb-6 font-semibold text-xl leading-relaxed">{mcq.question}</p>
      <div className="space-y-4">
        {mcq.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${getOptionClass(index)}`}
          >
            <input
              type="radio"
              name={mcq.id}
              checked={selectedOption === index}
              onChange={() => handleOptionSelect(index)}
              disabled={isAnswered}
              className="hidden"
            />
            <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
              ${selectedOption === index ? 'border-sky-500 bg-sky-500' : 'border-slate-600 group-hover:border-sky-500'}`}>
                {selectedOption === index && <CheckIcon className="w-4 h-4 text-white pop-in-animate" />}
            </div>
            <span className="text-lg text-slate-200">{option}</span>
          </label>
        ))}
      </div>
      {isAnswered && (
        <div className={`mt-6 p-4 rounded-lg text-base transition-opacity duration-300 modal-panel-animate ${selectedOption === mcq.correctAnswerIndex ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
          <p className="font-bold mb-1 text-white">
            {selectedOption === mcq.correctAnswerIndex ? 'Correct!' : 'Incorrect.'}
          </p>
          <p>{mcq.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MCQInteractive;