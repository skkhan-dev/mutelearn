import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { v4 as uuid } from 'uuid';

const StudyContext = createContext();

export function StudyProvider({ children }) {
  const [decks, setDecks] = useLocalStorage('mutelearn-decks', []);
  const [notes, setNotes] = useLocalStorage('mutelearn-notes', []);
  const [folders, setFolders] = useLocalStorage('mutelearn-folders', []);
  const [quizHistory, setQuizHistory] = useLocalStorage('mutelearn-quiz-history', []);
  const [imports, setImports] = useLocalStorage('mutelearn-imports', []);

  // Deck CRUD
  const createDeck = (name, subject = '') => {
    const deck = { id: uuid(), name, subject, cards: [], createdAt: new Date().toISOString() };
    setDecks((prev) => [...prev, deck]);
    return deck;
  };

  const updateDeck = (deckId, updates) => {
    setDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, ...updates } : d)));
  };

  const deleteDeck = (deckId) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  // Card CRUD
  const addCard = (deckId, front, back) => {
    const card = { id: uuid(), front, back, sm2: null, createdAt: new Date().toISOString() };
    setDecks((prev) =>
      prev.map((d) => (d.id === deckId ? { ...d, cards: [...d.cards, card] } : d))
    );
    return card;
  };

  const updateCard = (deckId, cardId, updates) => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)) }
          : d
      )
    );
  };

  const deleteCard = (deckId, cardId) => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
      )
    );
  };

  const addCardsFromImport = (deckId, cards) => {
    const newCards = cards.map((c) => ({
      id: uuid(),
      front: c.front || c.term,
      back: c.back || c.definition,
      sm2: null,
      createdAt: new Date().toISOString(),
    }));
    setDecks((prev) =>
      prev.map((d) => (d.id === deckId ? { ...d, cards: [...d.cards, ...newCards] } : d))
    );
  };

  // Notes CRUD
  const createNote = (title, content = '', tags = [], folderId = null) => {
    const note = {
      id: uuid(),
      title,
      content,
      tags,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, note]);
    return note;
  };

  const updateNote = (noteId, updates) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    );
  };

  const deleteNote = (noteId) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Folders
  const createFolder = (name) => {
    const folder = { id: uuid(), name, createdAt: new Date().toISOString() };
    setFolders((prev) => [...prev, folder]);
    return folder;
  };

  const deleteFolder = (folderId) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setNotes((prev) => prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n)));
  };

  // Quiz history
  const saveQuizResult = (result) => {
    const entry = { id: uuid(), ...result, completedAt: new Date().toISOString() };
    setQuizHistory((prev) => [...prev, entry]);
    return entry;
  };

  // Imports
  const saveImport = (importData) => {
    const entry = { id: uuid(), ...importData, importedAt: new Date().toISOString() };
    setImports((prev) => [...prev, entry]);
    return entry;
  };

  const getDeck = (deckId) => decks.find((d) => d.id === deckId);

  return (
    <StudyContext.Provider
      value={{
        decks, notes, folders, quizHistory, imports,
        createDeck, updateDeck, deleteDeck, getDeck,
        addCard, updateCard, deleteCard, addCardsFromImport,
        createNote, updateNote, deleteNote,
        createFolder, deleteFolder,
        saveQuizResult, saveImport,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy must be used within StudyProvider');
  return context;
}
