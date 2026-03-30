import React, { useEffect, useRef } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import EncouragingMessage from '../shared/EncouragingMessage';
import { useGamification } from '../../contexts/GamificationContext';
import { useStudy } from '../../contexts/StudyContext';

function getScoreMessage(score) {
  if (score === 100) return 'Perfect score! You really know this material!';
  if (score >= 90) return 'Outstanding! You have a strong grasp of this topic.';
  if (score >= 80) return 'Great work! You are doing really well.';
  if (score >= 70) return 'Good job! A little more practice and you will ace it.';
  if (score >= 60) return 'Nice effort! Keep studying and you will get there.';
  if (score >= 50) return 'You are making progress! Review the ones you missed and try again.';
  return 'Every attempt is a step forward. Review the material and give it another go!';
}

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-[var(--accent,#6366f1)]';
  return 'text-orange-500 dark:text-orange-400';
}

function getScoreRingColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return 'var(--accent, #6366f1)';
  return '#f59e0b';
}

function computeXP(results) {
  // Base XP: 5 per correct answer
  let xp = results.correct * 5;
  // Perfect bonus
  if (results.score === 100) xp += 25;
  // Completion bonus
  xp += 10;
  return xp;
}

export default function QuizResults({ results, quiz, onRetry, onDone }) {
  const { addXP, updateStats, checkBadges } = useGamification();
  const { saveQuizResult } = useStudy();
  const xpAwarded = useRef(false);

  const xpEarned = computeXP(results);
  const missedQuestions = results.answers.filter((a) => !a.isCorrect);

  useEffect(() => {
    if (xpAwarded.current) return;
    xpAwarded.current = true;

    addXP(xpEarned, 'Quiz completed');
    updateStats({
      totalQuizzes: 1,
      ...(results.score === 100 ? { perfectQuizzes: 1 } : {}),
    });
    checkBadges();
    saveQuizResult({
      quizId: results.quizId,
      quizName: results.quizName,
      score: results.score,
      correct: results.correct,
      total: results.total,
      xpEarned,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (results.score / 100) * circumference;

  return (
    <div className="space-y-8 animate-[fadeIn_400ms_ease-out]">
      {/* Score display */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
          Quiz Complete!
        </h2>

        {/* Circular score */}
        <div className="flex justify-center">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="var(--border, #e5e7eb)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={getScoreRingColor(results.score)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getScoreColor(results.score)}`}>
                {results.score}%
              </span>
            </div>
          </div>
        </div>

        {/* Score message */}
        <p className="text-lg text-[var(--text-secondary,#6b7280)] max-w-md mx-auto">
          {getScoreMessage(results.score)}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center" padding="sm">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {results.correct}
          </p>
          <p className="text-xs font-medium text-[var(--text-secondary,#6b7280)] mt-0.5">
            Correct
          </p>
        </Card>
        <Card className="text-center" padding="sm">
          <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
            {results.incorrect}
          </p>
          <p className="text-xs font-medium text-[var(--text-secondary,#6b7280)] mt-0.5">
            To Review
          </p>
        </Card>
        <Card className="text-center" padding="sm">
          <p className="text-2xl font-bold text-[var(--accent,#6366f1)]">
            +{xpEarned}
          </p>
          <p className="text-xs font-medium text-[var(--text-secondary,#6b7280)] mt-0.5">
            XP Earned
          </p>
        </Card>
      </div>

      {/* Missed questions review */}
      {missedQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--text-primary,#111827)]">
            Review These Questions
          </h3>
          {missedQuestions.map((item, idx) => (
            <Card key={item.questionId} padding="sm" className="space-y-2">
              <p className="font-medium text-[var(--text-primary,#111827)]">
                {idx + 1}. {item.question}
              </p>
              <div className="flex flex-col gap-1 text-sm">
                <p className="text-orange-600 dark:text-orange-400">
                  <span className="font-medium">Your answer:</span>{' '}
                  {item.type === 'true-false'
                    ? item.userAnswer === true
                      ? 'True'
                      : item.userAnswer === false
                      ? 'False'
                      : 'No answer'
                    : item.userAnswer || 'No answer'}
                </p>
                <p className="text-emerald-600 dark:text-emerald-400">
                  <span className="font-medium">Correct answer:</span>{' '}
                  {item.type === 'true-false'
                    ? item.correctAnswer
                      ? 'True'
                      : 'False'
                    : item.correctAnswer}
                </p>
                {item.explanation && (
                  <p className="text-[var(--text-secondary,#6b7280)] mt-1 italic">
                    {item.explanation}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Encouraging message */}
      <EncouragingMessage />

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <Button variant="outline" onClick={onRetry} size="lg">
          Try Again
        </Button>
        <Button onClick={onDone} size="lg">
          Done
        </Button>
      </div>
    </div>
  );
}
