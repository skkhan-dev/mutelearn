import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useProfessor } from '../../contexts/ProfessorContext';
import ProfessorMessage from './ProfessorMessage';

export default function ProfessorChat({ isOpen, onClose }) {
  const { history, isLoading, sendMessage, clearHistory } = useProfessor();
  const [input, setInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  // Focus the input when the panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  }, [onClose]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        onClick={handleClose}
      />

      {/* Chat panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col
          w-full sm:w-[400px] md:w-[440px]
          bg-[var(--bg-primary)] shadow-2xl
          ${isClosing ? 'slide-out' : 'slide-in'}`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="graduation cap">
              🎓
            </span>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] leading-tight">
                Professor
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">Your study buddy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--bg-card)]"
              title="Clear conversation"
            >
              Clear
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-card)] transition-colors text-[var(--text-secondary)] text-lg"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {history.map((msg, i) => (
            <ProfessorMessage key={`${msg.timestamp}-${i}`} message={msg} />
          ))}
          {isLoading && <ProfessorMessage isTyping />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--border)] px-3 py-3 bg-[var(--bg-secondary)]">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Professor anything..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              style={{ maxHeight: 120 }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 text-center">
            Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
