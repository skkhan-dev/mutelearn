import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import Button from '../shared/Button';
import Card from '../shared/Card';

const QUESTION_COUNTS = [5, 10, 15, 20];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuestions(deck, count) {
  const cards = deck.cards;
  if (cards.length < 2) return [];

  const selectedCards = shuffle(cards).slice(0, count);

  return selectedCards.map((card) => {
    // Pick 3 wrong answers from other cards' backs
    const otherBacks = cards
      .filter((c) => c.id !== card.id)
      .map((c) => c.back);
    const wrongAnswers = shuffle(otherBacks).slice(0, 3);

    // If we don't have enough wrong answers, pad with variations
    while (wrongAnswers.length < 3) {
      wrongAnswers.push(`Not ${card.back}`);
    }

    const options = shuffle([card.back, ...wrongAnswers]);

    return {
      id: uuid(),
      type: 'multiple-choice',
      question: card.front,
      options,
      correctAnswer: card.back,
      explanation: '',
      sourceCardId: card.id,
    };
  });
}

export default function QuizFromCards({ decks, onGenerate }) {
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [questionCount, setQuestionCount] = useState(10);

  const availableDecks = decks.filter((d) => d.cards.length >= 2);
  const selectedDeck = decks.find((d) => d.id === selectedDeckId);
  const maxQuestions = selectedDeck ? selectedDeck.cards.length : 0;
  const effectiveCount = Math.min(questionCount, maxQuestions);

  const canGenerate = selectedDeck && selectedDeck.cards.length >= 2;

  const handleGenerate = () => {
    if (!canGenerate) return;
    const questions = generateQuestions(selectedDeck, effectiveCount);
    onGenerate({
      id: uuid(),
      name: `${selectedDeck.name} Quiz`,
      questions,
      deckId: selectedDeck.id,
      generatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary,#111827)] mb-1">
          Generate Quiz from Flashcards
        </h3>
        <p className="text-sm text-[var(--text-secondary,#6b7280)]">
          Automatically create a multiple-choice quiz from one of your decks.
        </p>
      </div>

      {/* Deck selector */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-2">
          Select a Deck
        </label>
        {availableDecks.length === 0 ? (
          <Card className="text-center">
            <p className="text-[var(--text-secondary,#6b7280)]">
              No decks available. You need a deck with at least 2 cards to generate a quiz.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {availableDecks.map((deck) => (
              <button
                key={deck.id}
                type="button"
                onClick={() => setSelectedDeckId(deck.id)}
                className={[
                  'w-full text-left px-4 py-3 rounded-xl border-2 transition-all',
                  selectedDeckId === deck.id
                    ? 'border-[var(--accent,#6366f1)] bg-[var(--accent,#6366f1)]/5'
                    : 'border-[var(--border,#e5e7eb)] hover:border-[var(--accent,#6366f1)]/50',
                ].join(' ')}
              >
                <span className="font-medium text-[var(--text-primary,#111827)]">
                  {deck.name}
                </span>
                <span className="ml-2 text-sm text-[var(--text-secondary,#6b7280)]">
                  {deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}
                </span>
                {deck.subject && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--accent,#6366f1)]/10 text-[var(--accent,#6366f1)]">
                    {deck.subject}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Question count */}
      {selectedDeck && (
        <div className="animate-[fadeIn_200ms_ease-out]">
          <label className="block text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-2">
            Number of Questions
          </label>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map((count) => {
              const disabled = count > maxQuestions;
              return (
                <button
                  key={count}
                  type="button"
                  disabled={disabled}
                  onClick={() => setQuestionCount(count)}
                  className={[
                    'px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
                    disabled && 'opacity-30 cursor-not-allowed',
                    !disabled && questionCount === count
                      ? 'bg-[var(--accent,#6366f1)] text-white shadow-sm'
                      : !disabled
                      ? 'bg-gray-100 dark:bg-gray-700 text-[var(--text-primary,#111827)] hover:bg-gray-200 dark:hover:bg-gray-600'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {count}
                </button>
              );
            })}
          </div>
          {maxQuestions < 20 && (
            <p className="text-xs text-[var(--text-secondary,#6b7280)] mt-1.5">
              This deck has {maxQuestions} cards, so up to {maxQuestions} questions can be generated.
            </p>
          )}
        </div>
      )}

      {/* Preview summary */}
      {canGenerate && (
        <Card className="bg-[var(--accent,#6366f1)]/5 border-[var(--accent,#6366f1)]/20 animate-[fadeIn_200ms_ease-out]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text-primary,#111827)]">
                Ready to generate
              </p>
              <p className="text-sm text-[var(--text-secondary,#6b7280)]">
                {effectiveCount} multiple-choice questions from "{selectedDeck.name}"
              </p>
            </div>
            <Button onClick={handleGenerate}>
              Generate Quiz
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
