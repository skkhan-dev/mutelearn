import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { useStudy } from '../../contexts/StudyContext';

export default function FlashcardEditor({ deckId, onClose }) {
  const { getDeck, addCard, updateCard, deleteCard, addCardsFromImport } = useStudy();
  const deck = getDeck(deckId);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  if (!deck) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary,#6b7280)]">Deck not found.</p>
        <Button variant="outline" className="mt-4" onClick={onClose}>
          Go Back
        </Button>
      </div>
    );
  }

  const cards = deck.cards || [];

  // Single card add
  const handleAdd = () => {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();
    if (!trimmedFront || !trimmedBack) return;

    addCard(deckId, trimmedFront, trimmedBack);
    setFront('');
    setBack('');
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleAdd();
    }
  };

  // Bulk add
  const handleBulkAdd = () => {
    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed = lines
      .map((line) => {
        // Support "term | definition" or "term \t definition"
        const separator = line.includes('|') ? '|' : '\t';
        const parts = line.split(separator).map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          return { front: parts[0], back: parts[1] };
        }
        return null;
      })
      .filter(Boolean);

    if (parsed.length > 0) {
      addCardsFromImport(deckId, parsed);
      setBulkText('');
    }
  };

  // Edit card inline
  const startEdit = (card) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const saveEdit = () => {
    if (!editFront.trim() || !editBack.trim()) return;
    updateCard(deckId, editingCardId, {
      front: editFront.trim(),
      back: editBack.trim(),
    });
    setEditingCardId(null);
  };

  const cancelEdit = () => {
    setEditingCardId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary,#111827)]">
            {deck.name}
          </h2>
          <p className="text-sm text-[var(--text-secondary,#6b7280)]">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={!isBulkMode ? 'primary' : 'outline'}
          onClick={() => setIsBulkMode(false)}
        >
          Add Card
        </Button>
        <Button
          size="sm"
          variant={isBulkMode ? 'primary' : 'outline'}
          onClick={() => setIsBulkMode(true)}
        >
          Bulk Add
        </Button>
      </div>

      {/* Add card form */}
      {!isBulkMode ? (
        <Card>
          <div className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="card-front"
                className="block text-sm font-medium text-[var(--text-primary,#111827)] mb-1"
              >
                Front (Question / Term)
              </label>
              <textarea
                id="card-front"
                rows={2}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter the question or term..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] resize-none"
              />
            </div>
            <div>
              <label
                htmlFor="card-back"
                className="block text-sm font-medium text-[var(--text-primary,#111827)] mb-1"
              >
                Back (Answer / Definition)
              </label>
              <textarea
                id="card-back"
                rows={2}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter the answer or definition..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] resize-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary,#6b7280)]">
                Cmd/Ctrl + Enter to add
              </span>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!front.trim() || !back.trim()}
              >
                Add Card
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col gap-3">
            <label
              htmlFor="bulk-cards"
              className="block text-sm font-medium text-[var(--text-primary,#111827)]"
            >
              Paste cards (one per line, term | definition)
            </label>
            <textarea
              id="bulk-cards"
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Photosynthesis | Process by which plants convert sunlight to energy\nMitosis | Cell division producing two identical daughter cells\nDNA | Deoxyribonucleic acid, carries genetic information"}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] resize-none font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary,#6b7280)]">
                Separate term and definition with | or tab
              </span>
              <Button size="sm" onClick={handleBulkAdd} disabled={!bulkText.trim()}>
                Add All
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Existing cards list */}
      {cards.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary,#6b7280)]">
            Cards ({cards.length})
          </h3>
          {cards.map((card) => (
            <Card key={card.id} padding="sm" className="group">
              {editingCardId === card.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-sm text-[var(--text-primary,#111827)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] resize-none"
                  />
                  <textarea
                    rows={2}
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-sm text-[var(--text-primary,#111827)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary,#111827)] truncate">
                      {card.front}
                    </p>
                    <p className="text-sm text-[var(--text-secondary,#6b7280)] truncate mt-0.5">
                      {card.back}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(card)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deleteCard(deckId, card.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
