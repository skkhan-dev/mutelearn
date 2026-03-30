import React, { useState, useCallback } from 'react';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';

export default function QuizSession({ quiz, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const questions = quiz.questions || [];
  const total = questions.length;
  const current = questions[currentIndex];
  const progress = total > 0 ? ((currentIndex + (showResult ? 1 : 0)) / total) * 100 : 0;

  const handleAnswer = useCallback(
    (answer) => {
      setAnswers((prev) => ({ ...prev, [current.id]: answer }));
      setShowResult(true);
    },
    [current],
  );

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowResult(false);
    } else {
      // Quiz complete - build results
      const results = questions.map((q) => {
        const userAnswer = answers[q.id];
        const isCorrect =
          q.type === 'short-answer'
            ? (userAnswer || '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
            : userAnswer === q.correctAnswer;
        return {
          questionId: q.id,
          question: q.question,
          type: q.type,
          userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const correct = results.filter((r) => r.isCorrect).length;

      const finalResults = {
        quizId: quiz.id,
        quizName: quiz.name,
        total,
        correct,
        incorrect: total - correct,
        score: Math.round((correct / total) * 100),
        answers: results,
        completedAt: new Date().toISOString(),
      };

      setFinished(true);
      onComplete(finalResults);
    }
  };

  if (finished) return null;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary,#111827)]">
            {quiz.name}
          </h2>
          <span className="text-sm font-medium text-[var(--text-secondary,#6b7280)] tabular-nums">
            Question {currentIndex + 1} of {total}
          </span>
        </div>
        <ProgressBar value={progress} height={6} color="var(--accent, #6366f1)" />
      </div>

      {/* Question */}
      {current && (
        <QuizQuestion
          key={current.id}
          question={current}
          onAnswer={handleAnswer}
          showResult={showResult}
          userAnswer={answers[current.id]}
        />
      )}

      {/* Navigation */}
      {showResult && (
        <div className="flex justify-end pt-2 animate-[fadeIn_200ms_ease-out]">
          <Button onClick={handleNext} size="lg">
            {currentIndex < total - 1 ? (
              <span className="inline-flex items-center gap-2">
                Next
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            ) : (
              'See Results'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
