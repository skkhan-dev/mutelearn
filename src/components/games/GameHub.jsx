import React, { useState, useMemo } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { useMode } from '../../contexts/ModeContext';

const GAMES = [
  {
    id: 'match',
    name: 'Match Madness',
    icon: '🔗',
    description: 'Connect terms with their definitions before time runs out!',
    gradient: 'from-violet-500 to-purple-600',
    minCards: 4,
  },
  {
    id: 'fill',
    name: 'Fill the Gap',
    icon: '✏️',
    description: 'Read the definition and type the missing term.',
    gradient: 'from-cyan-500 to-blue-600',
    minCards: 4,
  },
  {
    id: 'scramble',
    name: 'Term Scramble',
    icon: '🔀',
    description: 'Unscramble the letters to reveal the hidden term!',
    gradient: 'from-emerald-500 to-teal-600',
    minCards: 4,
  },
  {
    id: 'speed',
    name: 'Speed Round',
    icon: '⚡',
    description: 'True or false? Decide fast before the timer runs out!',
    gradient: 'from-amber-500 to-orange-600',
    minCards: 4,
  },
  {
    id: 'memory',
    name: 'Memory Grid',
    icon: '🧠',
    description: 'Flip cards and match terms to definitions from memory.',
    gradient: 'from-pink-500 to-rose-600',
    minCards: 4,
  },
  {
    id: 'boss',
    name: 'Boss Battle',
    icon: '⚔️',
    description: 'Answer questions to defeat the boss before it defeats you!',
    gradient: 'from-red-500 to-fuchsia-600',
    minCards: 4,
  },
];

export default function GameHub({ decks, onSelectGame }) {
  const { mode } = useMode();
  const [selectedDeckId, setSelectedDeckId] = useState('');

  const eligibleDecks = useMemo(
    () => (decks || []).filter((d) => d.cards && d.cards.length >= 4),
    [decks]
  );

  const hasEligibleDecks = eligibleDecks.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary,#111827)] mb-2">
          Game Hub
        </h1>
        <p className="text-[var(--text-secondary,#6b7280)] text-lg">
          Pick a game and put your knowledge to the test!
        </p>
      </div>

      {/* Deck Selector */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <label
          htmlFor="deck-select"
          className="text-sm font-medium text-[var(--text-secondary,#6b7280)]"
        >
          Choose a deck to play with
        </label>
        <select
          id="deck-select"
          value={selectedDeckId}
          onChange={(e) => setSelectedDeckId(e.target.value)}
          disabled={!hasEligibleDecks}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {hasEligibleDecks ? '-- Select a deck --' : 'No eligible decks (need 4+ cards)'}
          </option>
          {eligibleDecks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name} ({deck.cards.length} cards)
            </option>
          ))}
        </select>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GAMES.map((game) => {
          const disabled = !selectedDeckId;
          return (
            <div
              key={game.id}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                disabled ? 'opacity-50 grayscale' : 'hover:scale-[1.03] hover:shadow-xl'
              }`}
            >
              <div
                className={`bg-gradient-to-br ${game.gradient} p-6 h-full flex flex-col`}
              >
                <div className="text-4xl mb-3">{game.icon}</div>
                <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
                <p className="text-white/80 text-sm mb-4 flex-1">
                  {game.description}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onSelectGame(game.id, selectedDeckId)}
                  className="self-start bg-white/20 text-white hover:bg-white/30 border-none"
                >
                  Play
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {!hasEligibleDecks && (
        <div className="mt-8 text-center">
          <Card className="inline-block max-w-md">
            <p className="text-[var(--text-secondary,#6b7280)]">
              Create a deck with at least 4 cards to start playing games!
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
