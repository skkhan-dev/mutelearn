import React from 'react';

export default function ProfessorFAB({ onClick, hasUnread = false }) {
  return (
    <button
      onClick={onClick}
      className="fixed z-30 flex items-center justify-center
        w-14 h-14 rounded-full shadow-lg
        bg-[var(--accent)] text-white
        hover:shadow-xl hover:scale-105 active:scale-95
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
        bottom-24 right-5 sm:bottom-6 sm:right-6"
      aria-label="Open Professor chat"
      style={{ willChange: 'transform' }}
    >
      {/* Graduation cap emoji */}
      <span className="text-2xl leading-none" role="img" aria-hidden="true">
        🎓
      </span>

      {/* Pulse ring when there is a suggestion */}
      {hasUnread && (
        <>
          <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-40 animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--error)] border-2 border-[var(--bg-primary)] flex items-center justify-center">
            <span className="sr-only">Unread messages</span>
          </span>
        </>
      )}
    </button>
  );
}
