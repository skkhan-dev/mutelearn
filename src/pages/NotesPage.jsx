import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../contexts/StudyContext';
import { generateFlashcards, isGeminiConfigured } from '../lib/gemini';
import NoteImporter from '../components/import/NoteImporter';

function FolderSidebar({ folders, activeFolder, onSelectFolder, onCreateFolder, onDeleteFolder }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowInput(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Folders</h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-indigo-500 hover:text-indigo-700 text-lg"
          aria-label="Add folder"
        >
          +
        </button>
      </div>

      {showInput && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
          >
            Add
          </button>
        </form>
      )}

      <button
        onClick={() => onSelectFolder(null)}
        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          activeFolder === null
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        📋 All Notes
      </button>

      <button
        onClick={() => onSelectFolder('unfiled')}
        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          activeFolder === 'unfiled'
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        📁 Unfiled
      </button>

      {folders.map((folder) => (
        <div key={folder.id} className="flex items-center group">
          <button
            onClick={() => onSelectFolder(folder.id)}
            className={`flex-1 text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeFolder === folder.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📂 {folder.name}
          </button>
          <button
            onClick={() => onDeleteFolder(folder.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 px-2 transition-opacity"
            aria-label="Delete folder"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function NotePreviewCard({ note, onClick, onDelete, onGenerate, isGenerating }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const preview = note.content
    ? note.content.substring(0, 120) + (note.content.length > 120 ? '...' : '')
    : 'No content yet';

  return (
    <div
      onClick={() => onClick(note)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-800 truncate flex-1">{note.title || 'Untitled Note'}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity ml-2"
          aria-label="Delete note"
        >
          🗑️
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-2 line-clamp-3">{preview}</p>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5 flex-wrap">
          {note.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onGenerate && (
            <button
              onClick={(e) => { e.stopPropagation(); onGenerate(note); }}
              disabled={isGenerating}
              className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              title="Generate flashcards from this note"
            >
              {isGenerating ? '...' : '🃏 Cards'}
            </button>
          )}
          <span className="text-xs text-gray-400">{formatDate(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function NoteEditorModal({ note, isOpen, onClose, onSave }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(note?.tags || []);

  if (!isOpen) return null;

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    onSave({
      title: title.trim() || 'Untitled Note',
      content,
      tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium text-gray-800"
            autoFocus
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your notes..."
            rows={12}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 resize-none"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </form>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const navigate = useNavigate();
  const { notes, folders, createNote, updateNote, deleteNote, createFolder, deleteFolder, createDeck, addCardsFromImport } = useStudy();
  const [activeFolder, setActiveFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState(undefined);
  const [showEditor, setShowEditor] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [generatingFor, setGeneratingFor] = useState(null);

  const handleGenerateFlashcards = async (note) => {
    if (!note.content?.trim()) return;
    setGeneratingFor(note.id);
    try {
      let cards;
      if (isGeminiConfigured()) {
        cards = await generateFlashcards(note.content, 8);
      } else {
        cards = note.content.split(/[.!?]+/).filter((s) => s.trim().length > 15).slice(0, 8).map((s) => ({
          front: `What does this mean: "${s.trim().slice(0, 60)}..."?`,
          back: s.trim(),
        }));
      }
      if (cards.length > 0) {
        const deck = createDeck(note.title || 'Notes Deck', 'Generated');
        addCardsFromImport(deck.id, cards);
        navigate(`/flashcards/${deck.id}`);
      }
    } catch {
      // Silently fall back
    } finally {
      setGeneratingFor(null);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesFolder =
      activeFolder === null ||
      (activeFolder === 'unfiled' && !note.folderId) ||
      note.folderId === activeFolder;

    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFolder && matchesSearch;
  });

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowEditor(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleSaveNote = (data) => {
    if (editingNote) {
      updateNote(editingNote.id, data);
    } else {
      createNote(data.title, data.content, data.tags, activeFolder === 'unfiled' ? null : activeFolder);
    }
  };

  const handleDeleteNote = (noteId) => {
    deleteNote(noteId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notes</h1>
          <p className="text-gray-500 mt-1">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImporter(true)}
            className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span>📥</span>
            Import
          </button>
          <button
            onClick={handleCreateNote}
            className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            New Note
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <FolderSidebar
            folders={folders}
            activeFolder={activeFolder}
            onSelectFolder={setActiveFolder}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
            />
          </div>

          {/* Notes Grid */}
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <NotePreviewCard
                  key={note.id}
                  note={note}
                  onClick={handleEditNote}
                  onDelete={handleDeleteNote}
                  onGenerate={handleGenerateFlashcards}
                  isGenerating={generatingFor === note.id}
                />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">📝</p>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No notes yet</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Start taking notes to organize your study material. You can tag them and sort them into folders!
              </p>
              <button
                onClick={handleCreateNote}
                className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
              >
                Create Your First Note
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500">No notes match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Note Editor Modal */}
      <NoteEditorModal
        note={editingNote}
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingNote(undefined);
        }}
        onSave={handleSaveNote}
      />

      {showImporter && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowImporter(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl mb-12">
            <button
              onClick={() => setShowImporter(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg"
            >
              x
            </button>
            <NoteImporter />
          </div>
        </div>
      )}
    </div>
  );
}
