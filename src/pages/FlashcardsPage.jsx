import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudy } from '../contexts/StudyContext';

function DeckCard({ deck, onEdit, onDelete }) {
  const cardCount = deck.cards.length;
  const dueCount = deck.cards.filter((c) => {
    if (!c.sm2 || !c.sm2.nextReview) return true;
    return new Date(c.sm2.nextReview) <= new Date();
  }).length;

  const lastStudied = deck.cards.reduce((latest, card) => {
    if (card.sm2?.lastReview && (!latest || card.sm2.lastReview > latest)) {
      return card.sm2.lastReview;
    }
    return latest;
  }, null);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden group">
      <Link to={`/flashcards/${deck.id}`} className="block p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-lg truncate">{deck.name}</h3>
            {deck.subject && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                {deck.subject}
              </span>
            )}
          </div>
          <div className="text-3xl opacity-70 group-hover:opacity-100 transition-opacity">🃏</div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-2">
            <p className="text-lg font-bold text-gray-800">{cardCount}</p>
            <p className="text-xs text-gray-500">Cards</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2">
            <p className="text-lg font-bold text-blue-600">{dueCount}</p>
            <p className="text-xs text-gray-500">Due</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <p className="text-xs font-medium text-gray-600 mt-1">{formatDate(lastStudied)}</p>
            <p className="text-xs text-gray-500">Studied</p>
          </div>
        </div>
      </Link>

      <div className="border-t border-gray-50 px-5 py-3 flex gap-2">
        <Link
          to={`/study?deck=${deck.id}`}
          className="flex-1 text-center py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
        >
          Study Now
        </Link>
        <button
          onClick={() => onEdit(deck)}
          className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          aria-label="Edit deck"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(deck.id)}
          className="px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          aria-label="Delete deck"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function CreateDeckModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), subject.trim());
    setName('');
    setSubject('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Create New Deck</h2>
        <p className="text-sm text-gray-500 mb-5">Give your deck a name to get started!</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deck Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Biology Chapter 5"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject (optional)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Biology"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 px-4 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDeckModal({ deck, isOpen, onClose, onSubmit }) {
  const [name, setName] = useState(deck?.name || '');
  const [subject, setSubject] = useState(deck?.subject || '');

  if (!isOpen || !deck) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(deck.id, { name: name.trim(), subject: subject.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Deck</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deck Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 px-4 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { decks, createDeck, updateDeck, deleteDeck } = useStudy();
  const [showCreate, setShowCreate] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDecks = decks.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.subject && d.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (deckId) => {
    if (deleteConfirm === deckId) {
      deleteDeck(deckId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(deckId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Flashcard Decks</h1>
          <p className="text-gray-500 mt-1">
            {decks.length} {decks.length === 1 ? 'deck' : 'decks'} &middot;{' '}
            {decks.reduce((s, d) => s + d.cards.length, 0)} total cards
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2 self-start"
        >
          <span className="text-xl">+</span>
          New Deck
        </button>
      </div>

      {/* Search */}
      {decks.length > 0 && (
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
          />
        </div>
      )}

      {/* Deck Grid */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={setEditingDeck}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">🃏</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No decks yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Create your first flashcard deck to start studying. You can add cards manually or import them from your notes!
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Create Your First Deck
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500">No decks match your search</p>
        </div>
      )}

      {/* Delete Confirmation Toast */}
      {deleteConfirm && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-40">
          <span>Click delete again to confirm</span>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateDeckModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createDeck}
      />
      <EditDeckModal
        deck={editingDeck}
        isOpen={!!editingDeck}
        onClose={() => setEditingDeck(null)}
        onSubmit={updateDeck}
      />
    </div>
  );
}
