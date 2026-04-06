import React from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';

export default function ImportProcessor({
  rawContent,
  processedData,
  isProcessing,
  onCreateFlashcards,
  onSaveAsNotes,
}) {
  if (!rawContent && !processedData && !isProcessing) return null;

  return (
    <div className="space-y-4">
      {isProcessing && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-800">Processing your content...</p>
              <p className="text-sm text-gray-500 mt-1">Extracting key terms, concepts, and flashcards</p>
            </div>
          </div>
        </Card>
      )}

      {processedData && !isProcessing && (
        <>
          {processedData.summary && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{processedData.summary}</p>
            </Card>
          )}

          {processedData.keyTerms?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Key Terms ({processedData.keyTerms.length})
              </h3>
              <div className="space-y-2">
                {processedData.keyTerms.map((term, i) => {
                  const termText = typeof term === 'string' ? term : term.term;
                  const defText = typeof term === 'string' ? '' : term.definition;
                  return (
                    <div key={i} className="rounded-xl bg-gray-50 px-3 py-2">
                      <span className="font-medium text-sm text-indigo-700">{termText}</span>
                      {defText && <span className="text-sm text-gray-600"> — {defText}</span>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {processedData.concepts?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Concepts ({processedData.concepts.length})
              </h3>
              <ul className="space-y-2">
                {processedData.concepts.map((concept, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {concept}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {processedData.facts?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Facts ({processedData.facts.length})
              </h3>
              <ul className="space-y-2">
                {processedData.facts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {fact}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {processedData.flashcards?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Generated Flashcards ({processedData.flashcards.length})
              </h3>
              <div className="space-y-2">
                {processedData.flashcards.slice(0, 5).map((card, i) => (
                  <div key={i} className="rounded-xl bg-indigo-50 px-3 py-2">
                    <p className="text-sm font-medium text-gray-800">Q: {card.front}</p>
                    <p className="text-sm text-gray-600 mt-1">A: {card.back}</p>
                  </div>
                ))}
                {processedData.flashcards.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">
                    +{processedData.flashcards.length - 5} more flashcards
                  </p>
                )}
              </div>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={onCreateFlashcards} className="flex-1">
              <span className="mr-1">🃏</span>
              Create Flashcards
            </Button>
            <Button variant="outline" onClick={onSaveAsNotes} className="flex-1">
              <span className="mr-1">📝</span>
              Save as Notes
            </Button>
          </div>
        </>
      )}

      {rawContent && !processedData && !isProcessing && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Content Preview</h3>
          <p className="text-sm text-gray-500 line-clamp-4 whitespace-pre-wrap">{rawContent}</p>
          <p className="text-xs text-gray-400 mt-2">{rawContent.split(/\s+/).length} words captured</p>
        </Card>
      )}
    </div>
  );
}
