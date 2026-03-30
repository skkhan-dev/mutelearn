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
      {/* Processing State */}
      {isProcessing && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-8">
            {/* Animated spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--accent,#6366f1)]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--accent,#6366f1)] animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-medium text-[var(--text-primary,#111827)]">
                Processing your notes...
              </p>
              <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
                Extracting key terms, concepts, and facts
              </p>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--accent,#6366f1)]"
                  style={{
                    animation: 'pulse 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Processed Results */}
      {processedData && !isProcessing && (
        <>
          {/* Key Terms */}
          {processedData.keyTerms?.length > 0 && (
            <Card>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary,#111827)] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--accent,#6366f1)]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Key Terms
                  <span className="text-xs font-normal text-[var(--text-secondary,#6b7280)]">
                    ({processedData.keyTerms.length})
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {processedData.keyTerms.map((term, i) => (
                    <span
                      key={i}
                      className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--accent,#6366f1)]/10 text-[var(--accent,#6366f1)]"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Concepts */}
          {processedData.concepts?.length > 0 && (
            <Card>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary,#111827)] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  Concepts
                  <span className="text-xs font-normal text-[var(--text-secondary,#6b7280)]">
                    ({processedData.concepts.length})
                  </span>
                </h3>
                <ul className="space-y-2">
                  {processedData.concepts.map((concept, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-primary,#111827)]"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {concept}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Facts */}
          {processedData.facts?.length > 0 && (
            <Card>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary,#111827)] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Key Facts
                  <span className="text-xs font-normal text-[var(--text-secondary,#6b7280)]">
                    ({processedData.facts.length})
                  </span>
                </h3>
                <ul className="space-y-2">
                  {processedData.facts.map((fact, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-primary,#111827)]"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Summary */}
          {processedData.summary && (
            <Card>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary,#111827)]">
                  Summary
                </h3>
                <p className="text-sm text-[var(--text-secondary,#6b7280)] leading-relaxed">
                  {processedData.summary}
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={onCreateFlashcards} className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Create Flashcards
            </Button>
            <Button variant="outline" onClick={onSaveAsNotes} className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              Save as Notes
            </Button>
          </div>
        </>
      )}

      {/* Raw Content Preview (shown when not yet processed and not processing) */}
      {rawContent && !processedData && !isProcessing && (
        <Card>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary,#111827)]">
              Raw Content Preview
            </h3>
            <p className="text-sm text-[var(--text-secondary,#6b7280)] line-clamp-4 whitespace-pre-wrap">
              {rawContent}
            </p>
            <p className="text-xs text-[var(--text-secondary,#6b7280)]">
              {rawContent.split(/\s+/).length} words captured
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
