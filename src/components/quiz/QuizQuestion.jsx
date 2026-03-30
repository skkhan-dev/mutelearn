import React, { useState } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';

export default function QuizQuestion({ question, onAnswer, showResult, userAnswer }) {
  const [inputValue, setInputValue] = useState('');

  const isCorrect =
    showResult && userAnswer != null
      ? question.type === 'short-answer'
        ? userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
        : userAnswer === question.correctAnswer
      : null;

  const handleOptionClick = (option) => {
    if (showResult) return;
    onAnswer(option);
  };

  const handleShortAnswerSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || showResult) return;
    onAnswer(inputValue.trim());
  };

  const getOptionStyle = (option) => {
    const base =
      'w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 font-medium text-[var(--text-primary,#111827)]';

    if (!showResult) {
      if (userAnswer === option) {
        return `${base} border-[var(--accent,#6366f1)] bg-[var(--accent,#6366f1)]/10`;
      }
      return `${base} border-[var(--border,#e5e7eb)] hover:border-[var(--accent,#6366f1)] hover:bg-[var(--accent,#6366f1)]/5 cursor-pointer`;
    }

    // After answering
    if (option === question.correctAnswer) {
      return `${base} border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300`;
    }
    if (option === userAnswer && option !== question.correctAnswer) {
      return `${base} border-orange-300 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300`;
    }
    return `${base} border-[var(--border,#e5e7eb)] opacity-50`;
  };

  const getTrueFalseStyle = (value) => {
    const base =
      'flex-1 py-5 rounded-xl border-2 text-lg font-semibold transition-all duration-200 text-center';

    if (!showResult) {
      if (userAnswer === value) {
        return `${base} border-[var(--accent,#6366f1)] bg-[var(--accent,#6366f1)]/10 text-[var(--accent,#6366f1)]`;
      }
      return `${base} border-[var(--border,#e5e7eb)] hover:border-[var(--accent,#6366f1)] hover:bg-[var(--accent,#6366f1)]/5 cursor-pointer text-[var(--text-primary,#111827)]`;
    }

    if (value === question.correctAnswer) {
      return `${base} border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300`;
    }
    if (value === userAnswer && value !== question.correctAnswer) {
      return `${base} border-orange-300 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300`;
    }
    return `${base} border-[var(--border,#e5e7eb)] opacity-50 text-[var(--text-secondary,#6b7280)]`;
  };

  return (
    <div className="space-y-6 animate-[fadeIn_300ms_ease-out]">
      {/* Question text */}
      <h3 className="text-xl md:text-2xl font-semibold text-[var(--text-primary,#111827)] leading-relaxed">
        {question.question}
      </h3>

      {/* Answer area */}
      {question.type === 'multiple-choice' && (
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={showResult}
              className={getOptionStyle(option)}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </span>
              {showResult && option === question.correctAnswer && (
                <span className="float-right text-emerald-500 mt-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {question.type === 'true-false' && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleOptionClick(true)}
            disabled={showResult}
            className={getTrueFalseStyle(true)}
          >
            True
          </button>
          <button
            type="button"
            onClick={() => handleOptionClick(false)}
            disabled={showResult}
            className={getTrueFalseStyle(false)}
          >
            False
          </button>
        </div>
      )}

      {question.type === 'short-answer' && (
        <form onSubmit={handleShortAnswerSubmit} className="space-y-3">
          <input
            type="text"
            value={showResult ? userAnswer || '' : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={showResult}
            placeholder="Type your answer..."
            className={[
              'w-full px-4 py-3 rounded-xl border-2 text-lg bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)]',
              'placeholder:text-[var(--text-secondary,#6b7280)] transition-all duration-200',
              'focus:outline-none focus:border-[var(--accent,#6366f1)] focus:ring-2 focus:ring-[var(--accent,#6366f1)]/20',
              showResult && isCorrect && 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
              showResult && isCorrect === false && 'border-orange-300 bg-orange-50 dark:bg-orange-900/20',
              !showResult && 'border-[var(--border,#e5e7eb)]',
            ].filter(Boolean).join(' ')}
          />
          {!showResult && (
            <Button onClick={handleShortAnswerSubmit} disabled={!inputValue.trim()}>
              Submit Answer
            </Button>
          )}
        </form>
      )}

      {/* Feedback */}
      {showResult && (
        <div className="animate-[fadeIn_300ms_ease-out]">
          <Card
            className={
              isCorrect
                ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                : 'border-orange-200 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10'
            }
            padding="sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 mt-0.5">
                {isCorrect ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="16 9 10.5 15 8 12.5" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </span>
              <div>
                <p className={`font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                  {isCorrect ? 'Great job!' : 'Not quite'}
                </p>
                {!isCorrect && question.type === 'short-answer' && (
                  <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
                    The correct answer is: <strong className="text-[var(--text-primary,#111827)]">{question.correctAnswer}</strong>
                  </p>
                )}
                {question.explanation && (
                  <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-2 leading-relaxed">
                    {question.explanation}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
