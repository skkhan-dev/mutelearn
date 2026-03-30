import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudy } from '../contexts/StudyContext';

const GAMES = [
  {
    id: 'match-madness',
    name: 'Match Madness',
    icon: '🔗',
    description: 'Match terms with their definitions as fast as you can',
    color: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50',
  },
  {
    id: 'fill-the-gap',
    name: 'Fill the Gap',
    icon: '✏️',
    description: 'Type in the missing word to complete the definition',
    color: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
  },
  {
    id: 'term-scramble',
    name: 'Term Scramble',
    icon: '🔀',
    description: 'Unscramble the letters to reveal the correct term',
    color: 'from-purple-500 to-violet-500',
    bgLight: 'bg-purple-50',
  },
  {
    id: 'speed-round',
    name: 'Speed Round',
    icon: '⚡',
    description: 'Answer as many questions as you can before time runs out',
    color: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
  },
  {
    id: 'memory-grid',
    name: 'Memory Grid',
    icon: '🧠',
    description: 'Flip cards and find matching term-definition pairs',
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
  },
  {
    id: 'boss-battle',
    name: 'Boss Battle',
    icon: '🐉',
    description: 'Answer correctly to defeat the boss. Wrong answers cost you HP!',
    color: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50',
  },
];

function GameCard({ game, disabled, onSelect }) {
  return (
    <button
      onClick={() => !disabled && onSelect(game.id)}
      disabled={disabled}
      className={`text-left rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <div className={`p-5 bg-gradient-to-br ${game.color} text-white`}>
        <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform inline-block">
          {game.icon}
        </span>
        <h3 className="font-bold text-lg">{game.name}</h3>
      </div>
      <div className="p-4 bg-white">
        <p className="text-sm text-gray-500">{game.description}</p>
        {disabled && (
          <p className="text-xs text-orange-500 font-medium mt-2">
            Requires at least one flashcard deck
          </p>
        )}
      </div>
    </button>
  );
}

function DeckSelector({ decks, selectedDeckId, onSelect, onCancel, gameName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Choose a Deck</h2>
        <p className="text-sm text-gray-500 mb-5">
          Select a deck to play {gameName}
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => onSelect(deck.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                selectedDeckId === deck.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{deck.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {deck.cards.length} cards
                  </span>
                </div>
                {selectedDeckId === deck.id && (
                  <span className="text-indigo-500 font-bold">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selectedDeckId)}
            disabled={!selectedDeckId}
            className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            Play!
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GamesPage() {
  const { decks } = useStudy();
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedDeckId, setSelectedDeckId] = useState('');

  const hasDecks = decks.length > 0;
  const eligibleDecks = decks.filter((d) => d.cards.length >= 4);

  const handleSelectGame = (gameId) => {
    if (eligibleDecks.length === 0) return;
    setSelectedGame(gameId);
  };

  const handlePlayGame = (deckId) => {
    // Game components will be built later
    // For now just close the modal
    setSelectedGame(null);
    setSelectedDeckId('');
    // TODO: Navigate to game with gameId and deckId
  };

  const selectedGameData = GAMES.find((g) => g.id === selectedGame);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Study Games</h1>
        <p className="text-gray-500 mt-1">
          Learn while having fun! Choose a game and a flashcard deck to get started.
        </p>
      </div>

      {/* Deck requirement notice */}
      {!hasDecks && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-800">No flashcard decks found</p>
            <p className="text-sm text-amber-700 mt-1">
              You need at least one flashcard deck with 4+ cards to play games.
            </p>
            <Link
              to="/flashcards"
              className="inline-block mt-3 px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Create a Deck
            </Link>
          </div>
        </div>
      )}

      {hasDecks && eligibleDecks.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-medium text-blue-800">Almost there!</p>
            <p className="text-sm text-blue-700 mt-1">
              Your decks need at least 4 cards each to play games. Add more cards to get started!
            </p>
          </div>
        </div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            disabled={!hasDecks || eligibleDecks.length === 0}
            onSelect={handleSelectGame}
          />
        ))}
      </div>

      {/* Deck Selector Modal */}
      {selectedGame && (
        <DeckSelector
          decks={eligibleDecks}
          selectedDeckId={selectedDeckId}
          onSelect={handlePlayGame}
          onCancel={() => {
            setSelectedGame(null);
            setSelectedDeckId('');
          }}
          gameName={selectedGameData?.name}
        />
      )}
    </div>
  );
}
