import React, { useState, useMemo } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';

function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VideoImporter({ onImport }) {
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');

  const videoId = useMemo(() => extractVideoId(url), [url]);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  const handleImport = () => {
    if (transcript.trim()) {
      onImport?.(transcript.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <Card>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--text-primary,#111827)]">
            YouTube Video URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={[
              'w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)]',
              'px-3 py-2 text-sm text-[var(--text-primary,#111827)]',
              'placeholder:text-[var(--text-secondary,#6b7280)]/60',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] focus:border-transparent',
            ].join(' ')}
          />
          <p className="text-xs text-[var(--text-secondary,#6b7280)]">
            Paste a YouTube video URL to import lecture or tutorial content
          </p>
        </div>
      </Card>

      {/* Video Preview */}
      {videoId && (
        <Card>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text-secondary,#6b7280)]">
              Video Preview
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative group"
            >
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg group-hover:bg-black/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </a>
            <p className="text-xs text-[var(--text-secondary,#6b7280)]">
              Video ID: {videoId}
            </p>
          </div>
        </Card>
      )}

      {/* Transcript Input */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary,#111827)]">
            Video Transcript / Notes
          </h3>
          <p className="text-xs text-[var(--text-secondary,#6b7280)]">
            Paste the video transcript or key notes from the video. You can get
            transcripts from YouTube by clicking the "..." menu below a video, then
            "Show transcript".
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            placeholder="Paste the video transcript or your notes from the video here..."
            className={[
              'w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)]',
              'px-3 py-2 text-sm text-[var(--text-primary,#111827)]',
              'placeholder:text-[var(--text-secondary,#6b7280)]/60',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] focus:border-transparent',
              'resize-y',
            ].join(' ')}
          />

          {transcript.trim() && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary,#6b7280)]">
                {transcript.trim().split(/\s+/).length} words
              </span>
              <Button size="sm" onClick={handleImport}>
                Use This Content
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
