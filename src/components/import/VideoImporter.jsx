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
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const videoId = useMemo(() => extractVideoId(url), [url]);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  const handleFetchTranscript = async () => {
    if (!videoId) return;
    setFetching(true);
    setFetchError('');

    try {
      const res = await fetch(`/api/youtube-transcript?videoId=${videoId}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error || 'Could not fetch transcript');
        return;
      }

      setTranscript(data.transcript || '');
    } catch {
      setFetchError('Could not reach the server. Try pasting the transcript manually.');
    } finally {
      setFetching(false);
    }
  };

  const handleImport = () => {
    if (transcript.trim()) {
      onImport?.(transcript.trim());
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">YouTube Video URL</label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {videoId && (
              <button
                onClick={handleFetchTranscript}
                disabled={fetching}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {fetching ? 'Fetching...' : 'Get Transcript'}
              </button>
            )}
          </div>
          {fetchError && <p className="text-sm text-amber-600">{fetchError}</p>}
        </div>
      </Card>

      {videoId && (
        <Card>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative group"
          >
            <img src={thumbnailUrl} alt="Video thumbnail" className="w-full rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </a>
        </Card>
      )}

      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Video Transcript</h3>
          <p className="text-xs text-gray-500">
            {videoId
              ? 'Click "Get Transcript" above, or paste the transcript manually below.'
              : 'Paste a YouTube URL above, then fetch the transcript automatically.'}
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            placeholder="Transcript will appear here, or paste it manually..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          {transcript.trim() && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{transcript.trim().split(/\s+/).length} words</span>
              <Button size="sm" onClick={handleImport}>Use This Content</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
