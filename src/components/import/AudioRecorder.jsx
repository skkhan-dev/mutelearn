import React, { useState, useRef, useCallback } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { useMediaCapture } from '../../hooks/useMediaCapture';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioRecorder({ onTranscribe }) {
  const {
    recording,
    recordingTime,
    startRecording,
    stopRecording,
    transcription,
    setTranscription,
    resetTranscription,
  } = useMediaCapture();

  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleStart = async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      resetTranscription();
      await startRecording();
    } catch {
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    if (blob) {
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleUseTranscription = useCallback(() => {
    if (transcription.trim()) {
      onTranscribe?.(transcription.trim());
    }
  }, [transcription, onTranscribe]);

  const handleEditTranscription = (e) => {
    setTranscription(e.target.value);
  };

  const handleReset = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    resetTranscription();
    setIsPlaying(false);
  };

  const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Status Indicator */}
          <div
            className={[
              'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
              recording
                ? 'bg-red-500/20 ring-4 ring-red-500/30 animate-pulse'
                : audioBlob
                  ? 'bg-green-500/10'
                  : 'bg-[var(--accent,#6366f1)]/10',
            ].join(' ')}
          >
            {recording ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            ) : audioBlob ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--accent,#6366f1)]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Timer */}
          {(recording || audioBlob) && (
            <p className="text-2xl font-mono font-bold text-[var(--text-primary,#111827)]">
              {formatTime(recordingTime)}
            </p>
          )}

          {/* Status Text */}
          <p className="text-sm text-[var(--text-secondary,#6b7280)]">
            {recording
              ? 'Recording... Speak clearly into your microphone'
              : audioBlob
                ? 'Recording complete!'
                : 'Record a voice memo of your study notes'
            }
          </p>

          {/* Controls */}
          <div className="flex gap-3">
            {!recording && !audioBlob && (
              <Button onClick={handleStart} size="lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="6" />
                </svg>
                Start Recording
              </Button>
            )}
            {recording && (
              <Button variant="danger" onClick={handleStop} size="lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="6" y="6" width="8" height="8" rx="1" />
                </svg>
                Stop
              </Button>
            )}
            {audioBlob && (
              <>
                <Button variant="outline" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Pause
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Play
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  Record Again
                </Button>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </div>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </Card>

      {/* Transcription */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary,#111827)]">
              Transcription
            </h3>
            {!hasSpeechRecognition && (
              <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                Manual mode - Speech Recognition not supported
              </span>
            )}
          </div>

          {hasSpeechRecognition && (
            <p className="text-xs text-[var(--text-secondary,#6b7280)]">
              Real-time transcription appears here while recording. You can edit the text afterwards.
            </p>
          )}

          <textarea
            value={transcription}
            onChange={handleEditTranscription}
            rows={6}
            placeholder={
              hasSpeechRecognition
                ? 'Your speech will be transcribed here automatically as you record...'
                : 'Type or paste your voice memo transcription here...'
            }
            className={[
              'w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)]',
              'px-3 py-2 text-sm text-[var(--text-primary,#111827)]',
              'placeholder:text-[var(--text-secondary,#6b7280)]/60',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent,#6366f1)] focus:border-transparent',
              'resize-y',
            ].join(' ')}
          />

          {transcription.trim() && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary,#6b7280)]">
                {transcription.trim().split(/\s+/).length} words
              </span>
              <Button size="sm" onClick={handleUseTranscription}>
                Use This Transcription
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
