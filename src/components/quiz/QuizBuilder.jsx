import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Modal from '../shared/Modal';

const QUESTION_TYPES = [
  { value: 'multiple-choice', label: 'Multiple Choice', icon: '(A)' },
  { value: 'true-false', label: 'True / False', icon: 'T/F' },
  { value: 'short-answer', label: 'Short Answer', icon: '...' },
];

const emptyQuestion = (type = 'multiple-choice') => ({
  id: uuid(),
  type,
  question: '',
  options: type === 'multiple-choice' ? ['', '', '', ''] : [],
  correctAnswer: type === 'true-false' ? true : '',
  explanation: '',
});

export default function QuizBuilder({ onSave, onCancel }) {
  const [quizName, setQuizName] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [editingIndex, setEditingIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const currentQ = questions[editingIndex];

  const updateQuestion = (index, updates) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const addQuestion = () => {
    const newQ = emptyQuestion();
    setQuestions((prev) => [...prev, newQ]);
    setEditingIndex(questions.length);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex((prev) => Math.min(prev, questions.length - 2));
    setShowDeleteModal(null);
  };

  const changeType = (index, type) => {
    const q = questions[index];
    updateQuestion(index, {
      type,
      options: type === 'multiple-choice' ? ['', '', '', ''] : [],
      correctAnswer: type === 'true-false' ? true : '',
    });
  };

  const isQuestionValid = (q) => {
    if (!q.question.trim()) return false;
    if (q.type === 'multiple-choice') {
      return q.options.every((o) => o.trim()) && q.options.includes(q.correctAnswer) && q.correctAnswer.trim();
    }
    if (q.type === 'true-false') return typeof q.correctAnswer === 'boolean';
    if (q.type === 'short-answer') return q.correctAnswer.trim().length > 0;
    return false;
  };

  const canSave = quizName.trim() && questions.length > 0 && questions.every(isQuestionValid);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: uuid(),
      name: quizName.trim(),
      questions,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Quiz name */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-1.5">
          Quiz Name
        </label>
        <input
          type="text"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="e.g., Chapter 5 Review"
          className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] text-lg font-medium placeholder:text-[var(--text-secondary,#6b7280)] focus:outline-none focus:border-[var(--accent,#6366f1)] focus:ring-2 focus:ring-[var(--accent,#6366f1)]/20 transition-all"
        />
      </div>

      {/* Question tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setEditingIndex(i)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              i === editingIndex
                ? 'bg-[var(--accent,#6366f1)] text-white shadow-sm'
                : isQuestionValid(q)
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:opacity-80'
                : 'bg-gray-100 dark:bg-gray-700 text-[var(--text-secondary,#6b7280)] hover:bg-gray-200 dark:hover:bg-gray-600',
            ].join(' ')}
          >
            Q{i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-[var(--border,#e5e7eb)] text-[var(--text-secondary,#6b7280)] hover:border-[var(--accent,#6366f1)] hover:text-[var(--accent,#6366f1)] transition-all"
        >
          + Add
        </button>
      </div>

      {/* Question editor */}
      {currentQ && (
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary,#111827)]">
              Question {editingIndex + 1}
            </h3>
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(editingIndex)}
                className="text-sm text-[var(--text-secondary,#6b7280)] hover:text-orange-500 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          {/* Type selector */}
          <div className="flex gap-2">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => changeType(editingIndex, t.value)}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  currentQ.type === t.value
                    ? 'bg-[var(--accent,#6366f1)]/10 text-[var(--accent,#6366f1)] border border-[var(--accent,#6366f1)]/30'
                    : 'bg-gray-50 dark:bg-gray-800 text-[var(--text-secondary,#6b7280)] hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent',
                ].join(' ')}
              >
                <span className="text-xs font-bold opacity-60">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-1">
              Question
            </label>
            <textarea
              value={currentQ.question}
              onChange={(e) => updateQuestion(editingIndex, { question: e.target.value })}
              placeholder="Enter your question..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] placeholder:text-[var(--text-secondary,#6b7280)] focus:outline-none focus:border-[var(--accent,#6366f1)] focus:ring-2 focus:ring-[var(--accent,#6366f1)]/20 transition-all resize-none"
            />
          </div>

          {/* Answer inputs based on type */}
          {currentQ.type === 'multiple-choice' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)]">
                Options (click the circle to mark correct answer)
              </label>
              {currentQ.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuestion(editingIndex, { correctAnswer: opt })}
                    className={[
                      'flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center',
                      opt && currentQ.correctAnswer === opt
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[var(--accent,#6366f1)]',
                    ].join(' ')}
                    title="Mark as correct answer"
                  >
                    {opt && currentQ.correctAnswer === opt && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(editingIndex, optIdx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] placeholder:text-[var(--text-secondary,#6b7280)] focus:outline-none focus:border-[var(--accent,#6366f1)] transition-all"
                  />
                </div>
              ))}
            </div>
          )}

          {currentQ.type === 'true-false' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-2">
                Correct Answer
              </label>
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => updateQuestion(editingIndex, { correctAnswer: val })}
                    className={[
                      'flex-1 py-3 rounded-xl border-2 font-semibold transition-all',
                      currentQ.correctAnswer === val
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-[var(--border,#e5e7eb)] text-[var(--text-secondary,#6b7280)] hover:border-[var(--accent,#6366f1)]',
                    ].join(' ')}
                  >
                    {val ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentQ.type === 'short-answer' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-1">
                Correct Answer
              </label>
              <input
                type="text"
                value={currentQ.correctAnswer}
                onChange={(e) => updateQuestion(editingIndex, { correctAnswer: e.target.value })}
                placeholder="The expected answer..."
                className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] placeholder:text-[var(--text-secondary,#6b7280)] focus:outline-none focus:border-[var(--accent,#6366f1)] focus:ring-2 focus:ring-[var(--accent,#6366f1)]/20 transition-all"
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-1">
              Explanation (optional)
            </label>
            <textarea
              value={currentQ.explanation}
              onChange={(e) => updateQuestion(editingIndex, { explanation: e.target.value })}
              placeholder="Why is this the correct answer?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] placeholder:text-[var(--text-secondary,#6b7280)] focus:outline-none focus:border-[var(--accent,#6366f1)] focus:ring-2 focus:ring-[var(--accent,#6366f1)]/20 transition-all resize-none"
            />
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary,#6b7280)]">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {' \u00b7 '}
            {questions.filter(isQuestionValid).length} ready
          </span>
          <Button onClick={handleSave} disabled={!canSave}>
            Save Quiz
          </Button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal !== null}
        onClose={() => setShowDeleteModal(null)}
        title="Remove Question"
        size="sm"
      >
        <p className="text-[var(--text-secondary,#6b7280)] mb-4">
          Are you sure you want to remove Question {showDeleteModal !== null ? showDeleteModal + 1 : ''}?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(null)}>
            Keep
          </Button>
          <Button
            variant="outline"
            className="border-orange-400 text-orange-600 hover:bg-orange-50"
            onClick={() => removeQuestion(showDeleteModal)}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
