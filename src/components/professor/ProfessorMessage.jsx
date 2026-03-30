import React, { useMemo } from 'react';

/**
 * Format a simple markdown-like string into React elements.
 * Supports **bold**, *italic*, and bullet lists (lines starting with - or *).
 */
function formatContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-1 space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i}>{inlineFormat(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);

    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
    } else {
      flushList();
      if (line.trim() === '') {
        elements.push(<br key={`br-${i}`} />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="my-0.5">
            {inlineFormat(line)}
          </p>
        );
      }
    }
  }

  flushList();
  return elements;
}

function inlineFormat(text) {
  // Split on **bold** and *italic* markers
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // **bold**
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={match.index} className="italic">
          {match[3]}
        </em>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Returns a human-friendly relative timestamp.
 */
function relativeTime(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Typing indicator — three animated dots.
 */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[var(--text-secondary)]"
          style={{
            animation: 'typingBounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function ProfessorMessage({ message, isTyping = false }) {
  const timeLabel = useMemo(
    () => (message?.timestamp ? relativeTime(message.timestamp) : ''),
    [message?.timestamp]
  );

  if (isTyping) {
    return (
      <div className="flex justify-start mb-3">
        <div
          className="max-w-[80%] rounded-2xl rounded-bl-sm bg-[var(--bg-card)] border border-[var(--border)]"
          style={{ minWidth: 64 }}
        >
          <TypingDots />
        </div>
      </div>
    );
  }

  if (!message) return null;

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={[
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-[var(--accent)] text-white'
            : 'rounded-bl-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]',
        ].join(' ')}
      >
        <div className="whitespace-pre-wrap break-words">
          {isUser ? message.content : formatContent(message.content)}
        </div>
        {timeLabel && (
          <div
            className={`text-[10px] mt-1 ${
              isUser ? 'text-white/60 text-right' : 'text-[var(--text-secondary)]'
            }`}
          >
            {timeLabel}
          </div>
        )}
      </div>
    </div>
  );
}
