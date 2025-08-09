
import React, { useState } from 'react';
import { MCQ } from '../../types';

interface MCQInteractiveProps {
  mcq: MCQ;
}

const MCQInteractive: React.FC<MCQInteractiveProps> = ({ mcq }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const isAnswered = selectedOption !== null;

  const handleOptionSelect = (index: number) => {
    if (!isAnswered) {
      setSelectedOption(index);
    }
  };

  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return 'bg-slate-700 hover:bg-slate-600';
    }
    if (index === mcq.correctAnswerIndex) {
      return 'bg-green-500/80 ring-2 ring-green-400';
    }
    if (index === selectedOption) {
      return 'bg-red-500/80 ring-2 ring-red-400';
    }
    return 'bg-slate-800 opacity-60';
  };

  return (
    <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
      <p className="text-slate-200 mb-4 font-medium">{mcq.question}</p>
      <div className="space-y-2">
        {mcq.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            disabled={isAnswered}
            className={`w-full text-left p-3 rounded-md transition-all duration-200 text-white ${getButtonClass(index)}`}
          >
            <span className="font-mono mr-3">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
      {isAnswered && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${selectedOption === mcq.correctAnswerIndex ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
          <p className="font-bold mb-1">
            {selectedOption === mcq.correctAnswerIndex ? 'Correct!' : 'Incorrect.'}
          </p>
          <p className="text-slate-300">{mcq.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MCQInteractive;
