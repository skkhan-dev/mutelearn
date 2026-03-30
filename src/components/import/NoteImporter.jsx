import React, { useState, useCallback } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import CameraCapture from './CameraCapture';
import AudioRecorder from './AudioRecorder';
import VideoImporter from './VideoImporter';
import ImportProcessor from './ImportProcessor';
import { useStudy } from '../../contexts/StudyContext';
import { useGamification } from '../../contexts/GamificationContext';

const TABS = [
  {
    id: 'text',
    label: 'Text Notes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'video',
    label: 'Video',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
];

// Simple client-side processing that extracts terms, concepts, and facts from text
function processContent(text) {
  if (!text || !text.trim()) return null;

  const sentences = text
    .replace(/\n+/g, '. ')
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  // Extract capitalized multi-word terms and standalone capitalized words as key terms
  const termSet = new Set();
  const termPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  let match;
  while ((match = termPattern.exec(text)) !== null) {
    if (match[0].length > 3) termSet.add(match[0]);
  }
  const keyTerms = [...termSet].slice(0, 12);

  // Pick longer sentences as concepts
  const concepts = sentences
    .filter((s) => s.length > 30)
    .slice(0, 6);

  // Pick medium-length sentences as facts
  const facts = sentences
    .filter((s) => s.length > 15 && s.length <= 80)
    .slice(0, 8);

  const summary =
    sentences.length > 0
      ? sentences.slice(0, 2).join('. ') + '.'
      : text.slice(0, 200);

  return { keyTerms, concepts, facts, summary };
}

export default function NoteImporter() {
  const [activeTab, setActiveTab] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [rawContent, setRawContent] = useState('');
  const [processedData, setProcessedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);

  const { createDeck, addCardsFromImport, createNote, saveImport } = useStudy();
  const { updateStats } = useGamification();

  // Handlers for sub-components
  const handleCapture = useCallback((imageData) => {
    setCapturedImage(imageData);
    setRawContent('[Image captured - OCR processing would extract text here]');
  }, []);

  const handleTranscribe = useCallback((text) => {
    setRawContent(text);
    setStatus({ type: 'success', message: 'Transcription received!' });
  }, []);

  const handleVideoImport = useCallback((text) => {
    setRawContent(text);
    setStatus({ type: 'success', message: 'Video content imported!' });
  }, []);

  // Process the collected content
  const handleProcess = async () => {
    const content = activeTab === 'text' ? textContent : rawContent;
    if (!content.trim()) {
      setStatus({ type: 'error', message: 'Please add some content before processing.' });
      return;
    }

    setIsProcessing(true);
    setProcessedData(null);
    setStatus(null);

    // Save the raw import
    saveImport({
      type: activeTab,
      rawContent: content,
      imageData: capturedImage || null,
    });

    // Simulate processing delay for UX
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = processContent(content);
    setProcessedData(result);
    setIsProcessing(false);
    setStatus({ type: 'success', message: 'Notes processed successfully!' });
    updateStats({ totalImports: 1 });
  };

  // Action handlers
  const handleCreateFlashcards = () => {
    if (!processedData) return;

    const deck = createDeck('Imported Notes', 'Imported');
    const cards = [];

    // Create flashcards from concepts
    processedData.concepts?.forEach((concept) => {
      cards.push({ front: 'Explain this concept:', back: concept });
    });

    // Create flashcards from facts
    processedData.facts?.forEach((fact) => {
      cards.push({ front: 'What is this fact?', back: fact });
    });

    // Create flashcards from key terms
    processedData.keyTerms?.forEach((term) => {
      cards.push({ front: `Define: ${term}`, back: `[Add definition for ${term}]` });
    });

    if (cards.length > 0) {
      addCardsFromImport(deck.id, cards);
      setStatus({
        type: 'success',
        message: `Created deck "${deck.name}" with ${cards.length} flashcards!`,
      });
    }
  };

  const handleSaveAsNotes = () => {
    if (!processedData) return;

    const content = [
      processedData.summary && `## Summary\n${processedData.summary}`,
      processedData.keyTerms?.length && `\n## Key Terms\n${processedData.keyTerms.join(', ')}`,
      processedData.concepts?.length && `\n## Concepts\n${processedData.concepts.map((c) => `- ${c}`).join('\n')}`,
      processedData.facts?.length && `\n## Facts\n${processedData.facts.map((f) => `- ${f}`).join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n');

    createNote('Imported Notes', content, ['import']);
    setStatus({ type: 'success', message: 'Notes saved successfully!' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
          Import Notes
        </h1>
        <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
          Bring in your study material from multiple sources
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setStatus(null);
            }}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-[var(--bg-card,#ffffff)] text-[var(--accent,#6366f1)] shadow-sm'
                : 'text-[var(--text-secondary,#6b7280)] hover:text-[var(--text-primary,#111827)]',
            ].join(' ')}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'text' && (
          <Card>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-primary,#111827)]">
                Type or Paste Your Notes
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
                placeholder={
                  'Paste your lecture notes, textbook excerpts, or study material here...\n\n' +
                  'Tips:\n' +
                  '- Include definitions and key terms\n' +
                  '- Add important facts and concepts\n' +
                  '- Use clear sentences for better processing'
                }
                className={[
                  'w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)]',
                  'px-4 py-3 text-sm text-[var(--text-primary,#111827)]',
                  'placeholder:text-[var(--text-secondary,#6b7280)]/60',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] focus:border-transparent',
                  'resize-y min-h-[200px]',
                ].join(' ')}
              />
              {textContent.trim() && (
                <p className="text-xs text-[var(--text-secondary,#6b7280)] text-right">
                  {textContent.trim().split(/\s+/).length} words
                </p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'camera' && (
          <CameraCapture onCapture={handleCapture} />
        )}

        {activeTab === 'audio' && (
          <AudioRecorder onTranscribe={handleTranscribe} />
        )}

        {activeTab === 'video' && (
          <VideoImporter onImport={handleVideoImport} />
        )}
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={[
            'px-4 py-3 rounded-lg text-sm font-medium',
            status.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
          ].join(' ')}
        >
          {status.message}
        </div>
      )}

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={isProcessing}
        size="lg"
        className="w-full"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 01.12-.381z" clipRule="evenodd" />
            </svg>
            Process Notes
          </>
        )}
      </Button>

      {/* Processor Output */}
      <ImportProcessor
        rawContent={activeTab === 'text' ? textContent : rawContent}
        processedData={processedData}
        isProcessing={isProcessing}
        onCreateFlashcards={handleCreateFlashcards}
        onSaveAsNotes={handleSaveAsNotes}
      />
    </div>
  );
}
