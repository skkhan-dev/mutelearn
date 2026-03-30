import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMode } from '../contexts/ModeContext';
import { useStudy } from '../contexts/StudyContext';
import { useGamification } from '../contexts/GamificationContext';

const PACING_OPTIONS = [
  {
    id: 'overload',
    label: 'Overload',
    icon: '🔥',
    description: 'Cram mode: all cards, no breaks',
    color: 'bg-red-50 border-red-200 text-red-700',
    activeColor: 'bg-red-500 text-white border-red-500',
  },
  {
    id: 'pacing',
    label: 'Pacing',
    icon: '🎯',
    description: 'Structured sessions with spaced breaks',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    activeColor: 'bg-blue-500 text-white border-blue-500',
  },
  {
    id: 'regular',
    label: 'Regular',
    icon: '📚',
    description: 'Standard study at your own pace',
    color: 'bg-green-50 border-green-200 text-green-700',
    activeColor: 'bg-green-500 text-white border-green-500',
  },
];

function PacingSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PACING_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
            selected === option.id ? option.activeColor : option.color
          }`}
        >
          <span className="text-2xl block mb-1">{option.icon}</span>
          <span className="font-bold block">{option.label}</span>
          <span className={`text-xs block mt-1 ${selected === option.id ? 'opacity-90' : 'opacity-70'}`}>
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
}

function TimerDisplay({ minutes, seconds }) {
  return (
    <div className="text-center">
      <div className="text-7xl font-mono font-bold text-gray-800 tracking-wide">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}

export default function StudySession() {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get('deck');
  const { modeConfig } = useMode();
  const { decks, getDeck } = useStudy();
  const { addXP, updateStreak, updateStats, addSessionHistory } = useGamification();

  const [pacing, setPacing] = useState('regular');
  const [isActive, setIsActive] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const deck = deckId ? getDeck(deckId) : null;
  const cards = deck?.cards || [];
  const currentCard = cards[currentCardIndex];

  const focusMinutes = modeConfig?.timer?.focus || 25;

  const handleStartSession = () => {
    if (!deck || cards.length === 0) return;
    setIsActive(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setReviewedCount(0);
    setSessionComplete(false);
    updateStreak();
  };

  const handleFlipCard = () => {
    setShowAnswer(!showAnswer);
  };

  const handleNextCard = () => {
    setReviewedCount((prev) => prev + 1);
    setShowAnswer(false);

    if (currentCardIndex + 1 >= cards.length) {
      handleCompleteSession();
    } else {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handleCompleteSession = () => {
    setSessionComplete(true);
    setIsActive(false);

    const xpEarned =
      (modeConfig?.gamification?.xpPerSession || 30) +
      reviewedCount * (modeConfig?.gamification?.xpPerCard || 10);

    addXP(xpEarned, 'Study session completed');
    updateStats({ totalSessions: 1, totalCardsReviewed: reviewedCount + 1 });

    if (pacing === 'overload') {
      updateStats({ overloadSessions: 1 });
    } else if (pacing === 'pacing') {
      updateStats({ pacingCompleted: 1 });
    }

    addSessionHistory({
      type: 'session',
      description: `Studied "${deck.name}" - ${reviewedCount + 1} cards`,
      xpEarned,
      deckId: deck.id,
      cardsReviewed: reviewedCount + 1,
      pacing,
    });
  };

  const handleEndSession = () => {
    if (reviewedCount > 0) {
      handleCompleteSession();
    } else {
      setIsActive(false);
    }
  };

  // No deck selected
  if (!deckId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Start a Study Session</h1>
        <p className="text-gray-500">Choose a deck to study:</p>

        {decks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {decks.map((d) => (
              <Link
                key={d.id}
                to={`/study?deck=${d.id}`}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🃏</span>
                  <div>
                    <h3 className="font-bold text-gray-800">{d.name}</h3>
                    <p className="text-sm text-gray-500">{d.cards.length} cards</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">📚</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No decks to study</h2>
            <p className="text-gray-500 mb-6">Create a flashcard deck first, then come back to study!</p>
            <Link
              to="/flashcards"
              className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
            >
              Create a Deck
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Session complete
  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800">Session Complete!</h1>
        <p className="text-gray-500 text-lg">
          You reviewed {reviewedCount + 1} cards from &quot;{deck.name}&quot;
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 inline-block">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-indigo-600">
                {reviewedCount + 1}
              </p>
              <p className="text-sm text-gray-500">Cards Reviewed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">
                +{(modeConfig?.gamification?.xpPerSession || 30) +
                  (reviewedCount + 1) * (modeConfig?.gamification?.xpPerCard || 10)}
              </p>
              <p className="text-sm text-gray-500">XP Earned</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Link
            to="/dashboard"
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={handleStartSession}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Study Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isActive ? `Studying: ${deck?.name}` : 'Study Session'}
          </h1>
          {deck && (
            <p className="text-gray-500 text-sm">
              {deck.cards.length} cards in deck
            </p>
          )}
        </div>
        {isActive && (
          <button
            onClick={handleEndSession}
            className="px-4 py-2 text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
          >
            End Session
          </button>
        )}
      </div>

      {/* Pre-session Setup */}
      {!isActive && !sessionComplete && (
        <div className="space-y-6">
          {/* Pacing Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Choose Your Pace</h2>
            <p className="text-sm text-gray-500 mb-4">How do you want to study today?</p>
            <PacingSelector selected={pacing} onSelect={setPacing} />
          </div>

          {/* Timer Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-2">Focus Time</p>
            <TimerDisplay
              minutes={pacing === 'overload' ? 0 : focusMinutes}
              seconds={0}
            />
            <p className="text-xs text-gray-400 mt-2">
              {pacing === 'overload'
                ? 'No timer - study until you finish all cards'
                : `${focusMinutes} minute focus session`}
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartSession}
            disabled={!deck || cards.length === 0}
            className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cards.length === 0 ? 'No Cards to Study' : 'Start Studying'}
          </button>
        </div>
      )}

      {/* Active Study Area */}
      {isActive && currentCard && (
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <span className="text-sm text-gray-400">
                {currentCardIndex + 1} / {cards.length}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{
                  width: `${((currentCardIndex + 1) / cards.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Flashcard */}
          <div
            onClick={handleFlipCard}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
          >
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-4">
              {showAnswer ? 'Answer' : 'Question'}
            </p>
            <p className="text-2xl font-medium text-gray-800 text-center leading-relaxed">
              {showAnswer ? currentCard.back : currentCard.front}
            </p>
            <p className="text-sm text-gray-400 mt-6">
              {showAnswer ? 'Click to see question' : 'Click to reveal answer'}
            </p>
          </div>

          {/* Actions */}
          {showAnswer && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAnswer(false);
                }}
                className="flex-1 py-3 bg-orange-50 text-orange-700 rounded-xl font-medium hover:bg-orange-100 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleNextCard}
                className="flex-1 py-3 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors"
              >
                Got It!
              </button>
              <button
                onClick={handleNextCard}
                className="flex-1 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors"
              >
                Easy!
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
