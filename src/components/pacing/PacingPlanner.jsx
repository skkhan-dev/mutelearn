import React, { useState, useMemo } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const ACTIVITY_TYPES = {
  learn: { label: 'Learn New', color: '#6366f1', bg: '#6366f114' },
  review: { label: 'Review', color: '#10b981', bg: '#10b98114' },
  quiz: { label: 'Quiz', color: '#f59e0b', bg: '#f59e0b14' },
  game: { label: 'Game Break', color: '#ec4899', bg: '#ec489914' },
  finalReview: { label: 'Full Review', color: '#8b5cf6', bg: '#8b5cf614' },
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDaysBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function generatePlan(decks, examDate) {
  const today = new Date().toISOString().split('T')[0];
  const totalDays = getDaysBetween(today, examDate);
  if (totalDays < 1) return [];

  const allCards = decks.flatMap((deck) =>
    (deck.cards || []).map((card) => ({ ...card, deckId: deck.id, deckName: deck.name }))
  );
  const totalCards = allCards.length;
  if (totalCards === 0) return [];

  const plan = [];

  // Phase thresholds
  const learnEnd = Math.floor(totalDays * 0.5);
  const reviewEnd = totalDays - 1;
  const cardsPerDay = Math.ceil(totalCards / Math.max(1, learnEnd));

  for (let day = 0; day < totalDays; day++) {
    const date = addDays(today, day);
    const dayNumber = day + 1;
    const isLastDay = day === totalDays - 1;

    let activities = [];
    let cardCount = 0;

    if (isLastDay) {
      // Last day: full review
      activities = [{ type: 'finalReview', description: `Review all ${totalCards} cards` }];
      cardCount = totalCards;
    } else if (day < learnEnd) {
      // Learning phase
      const startIdx = day * cardsPerDay;
      const endIdx = Math.min(startIdx + cardsPerDay, totalCards);
      cardCount = endIdx - startIdx;
      activities = [
        { type: 'learn', description: `Learn cards ${startIdx + 1}--${endIdx}` },
      ];
      // Add a game break every 3 days
      if (day > 0 && day % 3 === 0) {
        activities.push({ type: 'game', description: 'Fun game break to reinforce learning' });
      }
    } else {
      // Review + quiz phase
      const reviewCards = Math.ceil(totalCards / Math.max(1, reviewEnd - learnEnd));
      cardCount = reviewCards;
      activities = [
        { type: 'review', description: `Review ${reviewCards} cards` },
        { type: 'quiz', description: 'Quiz yourself on recent material' },
      ];
      // Game break on even review days
      if (day % 2 === 0) {
        activities.push({ type: 'game', description: 'Quick game to stay sharp' });
      }
    }

    plan.push({
      day: dayNumber,
      date,
      activities,
      cardCount,
      completed: false,
    });
  }

  return plan;
}

export default function PacingPlanner({ decks, onSavePlan }) {
  const [examDate, setExamDate] = useState('');
  const [selectedDeckIds, setSelectedDeckIds] = useState([]);
  const [showPlan, setShowPlan] = useState(false);
  const [savedPlans, setSavedPlans] = useLocalStorage('mutelearn-pacing-plans', []);

  const today = new Date().toISOString().split('T')[0];
  const selectedDecks = decks.filter((d) => selectedDeckIds.includes(d.id));

  const plan = useMemo(() => {
    if (!examDate || selectedDecks.length === 0) return [];
    return generatePlan(selectedDecks, examDate);
  }, [examDate, selectedDecks]);

  const totalDays = plan.length;
  const totalCards = selectedDecks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);

  const toggleDeck = (deckId) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
    );
    setShowPlan(false);
  };

  const handleGenerate = () => {
    if (plan.length > 0) setShowPlan(true);
  };

  const handleSave = () => {
    const newPlan = {
      id: Date.now().toString(),
      examDate,
      deckIds: selectedDeckIds,
      deckNames: selectedDecks.map((d) => d.name),
      days: plan,
      createdAt: new Date().toISOString(),
    };
    setSavedPlans((prev) => [...prev, newPlan]);
    onSavePlan(newPlan);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary,#111827)] flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Study Plan Builder
        </h2>
        <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
          Set your exam date and we'll create a day-by-day plan
        </p>
      </div>

      {/* Inputs */}
      <Card>
        <div className="space-y-4">
          {/* Exam date */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary,#111827)] mb-1">
              Exam / Test Date
            </label>
            <input
              type="date"
              value={examDate}
              min={addDays(today, 1)}
              onChange={(e) => {
                setExamDate(e.target.value);
                setShowPlan(false);
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Deck selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary,#111827)] mb-2">
              Select Decks to Study
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {decks.map((deck) => {
                const isChecked = selectedDeckIds.includes(deck.id);
                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => toggleDeck(deck.id)}
                    className={[
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all text-sm',
                      isChecked
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-[var(--border,#e5e7eb)] hover:border-emerald-300',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 dark:border-gray-600',
                      ].join(' ')}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text-primary,#111827)] truncate">
                        {deck.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary,#6b7280)]">
                        {deck.cards?.length || 0} cards
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {decks.length === 0 && (
              <p className="text-sm text-[var(--text-secondary,#6b7280)] italic">
                No decks available. Create some flashcards first!
              </p>
            )}
          </div>

          {/* Generate button */}
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            disabled={!examDate || selectedDeckIds.length === 0}
            onClick={handleGenerate}
          >
            Generate Study Plan
          </Button>

          {examDate && selectedDeckIds.length > 0 && (
            <p className="text-center text-sm text-[var(--text-secondary,#6b7280)]">
              {totalDays} days &middot; {totalCards} total cards &middot;{' '}
              ~{Math.ceil(totalCards / Math.max(1, Math.floor(totalDays * 0.5)))} new cards/day
            </p>
          )}
        </div>
      </Card>

      {/* Calendar plan view */}
      {showPlan && plan.length > 0 && (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(ACTIVITY_TYPES).map(([key, { label, color }]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
          </div>

          {/* Day-by-day grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plan.map((dayPlan) => (
              <Card
                key={dayPlan.day}
                padding="sm"
                className="relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-secondary,#6b7280)] uppercase">
                    Day {dayPlan.day}
                  </span>
                  <span className="text-xs text-[var(--text-secondary,#6b7280)]">
                    {formatDate(dayPlan.date)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {dayPlan.activities.map((activity, idx) => {
                    const style = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.learn;
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2 px-2 py-1.5 rounded-md text-xs"
                        style={{ backgroundColor: style.bg }}
                      >
                        <span
                          className="w-2 h-2 rounded-full mt-0.5 shrink-0"
                          style={{ backgroundColor: style.color }}
                        />
                        <span style={{ color: style.color }} className="font-medium">
                          {activity.description}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {dayPlan.cardCount > 0 && (
                  <p className="text-[10px] text-[var(--text-secondary,#6b7280)] mt-2 text-right">
                    {dayPlan.cardCount} cards
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Save */}
          <div className="flex justify-center">
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              size="lg"
              onClick={handleSave}
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Save This Plan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
