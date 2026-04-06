import React, { useState, useCallback } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import CameraCapture from './CameraCapture';
import AudioRecorder from './AudioRecorder';
import VideoImporter from './VideoImporter';
import ImportProcessor from './ImportProcessor';
import { useStudy } from '../../contexts/StudyContext';
import { useGamification } from '../../contexts/GamificationContext';
import { extractFromImage, extractFromText, isGeminiConfigured } from '../../lib/gemini';

const TABS = [
  { id: 'text', label: 'Text', icon: '📝' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'audio', label: 'Audio', icon: '🎤' },
  { id: 'video', label: 'YouTube', icon: '🎬' },
  { id: 'file', label: 'File', icon: '📁' },
  { id: 'url', label: 'URL', icon: '🌐' },
];

function heuristicProcess(text) {
  if (!text || !text.trim()) return null;
  const sentences = text.replace(/\n+/g, '. ').split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
  const termSet = new Set();
  const termPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  let match;
  while ((match = termPattern.exec(text)) !== null) {
    if (match[0].length > 3) termSet.add(match[0]);
  }
  return {
    summary: sentences.slice(0, 2).join('. ') + '.' || text.slice(0, 200),
    keyTerms: [...termSet].slice(0, 12).map((t) => ({ term: t, definition: '' })),
    concepts: sentences.filter((s) => s.length > 30).slice(0, 6),
    facts: sentences.filter((s) => s.length > 15 && s.length <= 80).slice(0, 8),
    flashcards: [],
  };
}

export default function NoteImporter() {
  const [activeTab, setActiveTab] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [rawContent, setRawContent] = useState('');
  const [processedData, setProcessedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [ocrText, setOcrText] = useState('');

  const { createDeck, addCardsFromImport, createNote, saveImport } = useStudy();
  const { updateStats } = useGamification();

  const handleCapture = useCallback((imageData) => {
    setCapturedImage(imageData);
    setOcrText('');
    setRawContent('');
  }, []);

  const handleTranscribe = useCallback((text) => {
    setRawContent(text);
    setStatus({ type: 'success', message: 'Transcription received!' });
  }, []);

  const handleVideoImport = useCallback((text) => {
    setRawContent(text);
    setStatus({ type: 'success', message: 'Video content imported!' });
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCapturedImage(ev.target.result);
        setActiveTab('camera');
      };
      reader.readAsDataURL(file);
      return;
    }

    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text();
      setFileContent(text);
      setStatus({ type: 'success', message: `Loaded ${file.name} (${text.split(/\s+/).length} words)` });
      return;
    }

    setStatus({ type: 'error', message: 'Supported formats: .txt, .md, and image files (PNG, JPG). For PDFs, take a photo or paste the text.' });
  }, []);

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    setStatus({ type: 'info', message: 'Fetching page content...' });

    try {
      const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(urlInput.trim())}`);
      if (!res.ok) throw new Error('Could not fetch the page');
      const data = await res.json();
      setRawContent(data.text || data.content || '');
      setStatus({ type: 'success', message: `Fetched content from ${urlInput} (${(data.text || '').split(/\s+/).length} words)` });
    } catch {
      setStatus({ type: 'error', message: 'Could not fetch that URL. Try pasting the content directly in the Text tab.' });
    }
  }, [urlInput]);

  const getContentForProcessing = () => {
    if (activeTab === 'text') return textContent;
    if (activeTab === 'file') return fileContent;
    if (activeTab === 'camera' && ocrText) return ocrText;
    return rawContent;
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessedData(null);
    setStatus(null);

    try {
      // OCR for camera images
      if (activeTab === 'camera' && capturedImage && !ocrText) {
        if (isGeminiConfigured()) {
          setStatus({ type: 'info', message: 'Running OCR on image...' });
          const extracted = await extractFromImage(capturedImage);
          setOcrText(extracted);
          setRawContent(extracted);
          setStatus({ type: 'success', message: 'Text extracted from image! Processing...' });
        } else {
          setStatus({ type: 'error', message: 'Add your Gemini API key in Settings to enable photo OCR.' });
          setIsProcessing(false);
          return;
        }
      }

      const content = activeTab === 'camera' && !ocrText
        ? (await extractFromImage(capturedImage))
        : getContentForProcessing();

      if (!content?.trim()) {
        setStatus({ type: 'error', message: 'No content to process. Add some text, take a photo, or record audio first.' });
        setIsProcessing(false);
        return;
      }

      saveImport({ type: activeTab, rawContent: content, imageData: capturedImage || null });

      let result;
      if (isGeminiConfigured()) {
        setStatus({ type: 'info', message: 'AI is analyzing your content...' });
        result = await extractFromText(content);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        result = heuristicProcess(content);
      }

      setProcessedData(result);
      setStatus({ type: 'success', message: isGeminiConfigured() ? 'AI processing complete!' : 'Basic processing complete. Add a Gemini API key in Settings for smarter extraction.' });
      updateStats({ totalImports: 1 });
    } catch (err) {
      if (err.message === 'NO_GEMINI_KEY') {
        const content = getContentForProcessing();
        if (content?.trim()) {
          const result = heuristicProcess(content);
          setProcessedData(result);
          setStatus({ type: 'success', message: 'Basic processing done. Add Gemini API key in Settings for AI-powered extraction.' });
        } else {
          setStatus({ type: 'error', message: 'Add a Gemini API key in Settings for this feature.' });
        }
      } else {
        setStatus({ type: 'error', message: err.message || 'Processing failed. Try again.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateFlashcards = () => {
    if (!processedData) return;
    const deck = createDeck('Imported Notes', 'Imported');
    const cards = [];

    if (processedData.flashcards?.length) {
      processedData.flashcards.forEach((c) => {
        if (c.front && c.back) cards.push({ front: c.front, back: c.back });
      });
    }

    processedData.keyTerms?.forEach((t) => {
      const term = typeof t === 'string' ? t : t.term;
      const def = typeof t === 'string' ? '' : t.definition;
      if (term) cards.push({ front: `Define: ${term}`, back: def || `[Add definition for ${term}]` });
    });

    if (cards.length === 0) {
      processedData.concepts?.forEach((c) => cards.push({ front: 'Explain:', back: c }));
      processedData.facts?.forEach((f) => cards.push({ front: 'What is this?', back: f }));
    }

    if (cards.length > 0) {
      addCardsFromImport(deck.id, cards);
      setStatus({ type: 'success', message: `Created "${deck.name}" with ${cards.length} flashcards!` });
    }
  };

  const handleSaveAsNotes = () => {
    if (!processedData) return;
    const sections = [];
    if (processedData.summary) sections.push(`## Summary\n${processedData.summary}`);
    if (processedData.keyTerms?.length) {
      const terms = processedData.keyTerms.map((t) =>
        typeof t === 'string' ? `- ${t}` : `- **${t.term}**: ${t.definition}`
      ).join('\n');
      sections.push(`\n## Key Terms\n${terms}`);
    }
    if (processedData.concepts?.length) sections.push(`\n## Concepts\n${processedData.concepts.map((c) => `- ${c}`).join('\n')}`);
    if (processedData.facts?.length) sections.push(`\n## Facts\n${processedData.facts.map((f) => `- ${f}`).join('\n')}`);

    const sourceTag = activeTab === 'camera' ? 'photo' : activeTab === 'audio' ? 'audio' : activeTab === 'video' ? 'youtube' : activeTab === 'url' ? 'web' : activeTab === 'file' ? 'file' : 'text';
    createNote('Imported Notes', sections.join('\n'), ['import', sourceTag]);
    setStatus({ type: 'success', message: 'Notes saved!' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary,#111827)]">Import Notes</h1>
        <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
          Bring in study material from any source — AI will extract key concepts
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setStatus(null); }}
            className={[
              'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'text' && (
          <Card>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-800">Type or Paste Your Notes</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
                placeholder="Paste lecture notes, textbook content, or any study material..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[200px]"
              />
              {textContent.trim() && (
                <p className="text-xs text-gray-400 text-right">{textContent.trim().split(/\s+/).length} words</p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-4">
            <CameraCapture onCapture={handleCapture} />
            {ocrText && (
              <Card>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Extracted Text (editable)</label>
                <textarea
                  value={ocrText}
                  onChange={(e) => { setOcrText(e.target.value); setRawContent(e.target.value); }}
                  rows={6}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </Card>
            )}
          </div>
        )}

        {activeTab === 'audio' && <AudioRecorder onTranscribe={handleTranscribe} />}

        {activeTab === 'video' && <VideoImporter onImport={handleVideoImport} />}

        {activeTab === 'file' && (
          <Card>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-800">Upload a File</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-colors">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm text-gray-600 mb-3">Drop a file here or click to browse</p>
                <input
                  type="file"
                  accept=".txt,.md,image/*"
                  onChange={handleFileSelect}
                  className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-medium hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-3">Supports: .txt, .md, and images (PNG, JPG). For PDFs, take a photo or paste the text.</p>
              </div>
              {fileContent && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">File Content (editable)</label>
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                  <p className="text-xs text-gray-400 text-right">{fileContent.split(/\s+/).length} words</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'url' && (
          <Card>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-800">Import from a Website</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 text-sm"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim()}
                  className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  Fetch
                </button>
              </div>
              <p className="text-xs text-gray-400">Paste any article, blog post, or documentation URL. The text content will be extracted for processing.</p>
              {rawContent && activeTab === 'url' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">Page Content (editable)</label>
                  <textarea
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                  <p className="text-xs text-gray-400 text-right">{rawContent.split(/\s+/).length} words</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {status && (
        <div className={[
          'px-4 py-3 rounded-lg text-sm font-medium',
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
          status.type === 'info' ? 'bg-indigo-50 text-indigo-700' :
          'bg-red-50 text-red-700',
        ].join(' ')}>
          {status.message}
        </div>
      )}

      <Button onClick={handleProcess} disabled={isProcessing} size="lg" className="w-full">
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {isGeminiConfigured() ? 'AI Processing...' : 'Processing...'}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>⚡</span>
            {isGeminiConfigured() ? 'Process with AI' : 'Process Notes'}
          </span>
        )}
      </Button>

      {!isGeminiConfigured() && (
        <p className="text-xs text-center text-gray-400">
          Add a <a href="/settings" className="text-indigo-500 underline">Gemini API key</a> for AI-powered OCR, smart extraction, and flashcard generation
        </p>
      )}

      <ImportProcessor
        rawContent={getContentForProcessing()}
        processedData={processedData}
        isProcessing={isProcessing}
        onCreateFlashcards={handleCreateFlashcards}
        onSaveAsNotes={handleSaveAsNotes}
      />
    </div>
  );
}
