import React from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';

export default function FlashcardDeck({ deck, onStudy, onEdit, onDelete }) {
  const { getDueCards } = useSpacedRepetition();
  const dueCount = getDueCards(deck.cards || []).length;
  const totalCards = deck.cards?.length || 0;

  // Find last studied date from the most recently reviewed card
  const lastStudied = (deck.cards || []).reduce((latest, card) => {
    const reviewed = card.sm2?.lastReviewed;
    if (!reviewed) return latest;
    return !latest || reviewed > latest ? reviewed : latest;
  }, null);

  const formatDate = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <Card hover className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary,#111827)] truncate">
            {deck.name}
          </h3>
          {deck.subject && (
            <p className="text-xs text-[var(--text-secondary,#6b7280)] mt-0.5">
              {deck.subject}
            </p>
          )}
        </div>

        {/* Due badge */}
        {dueCount > 0 && (
          <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent,#6366f1)] text-white">
            {dueCount} due
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary,#6b7280)]">
        <span>{totalCards} {totalCards === 1 ? 'card' : 'cards'}</span>
        <span className="w-px h-3.5 bg-[var(--border,#e5e7eb)]" />
        <span>Studied: {formatDate(lastStudied)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <Button
          size="sm"
          variant="primary"
          onClick={() => onStudy(deck.id)}
          disabled={totalCards === 0}
        >
          Study
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(deck.id)}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto text-red-500" onClick={() => onDelete(deck.id)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
