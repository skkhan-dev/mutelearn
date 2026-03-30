import React, { useState, useMemo, useCallback } from 'react';
import FlashcardCard from './FlashcardCard';
import DifficultyButtons from './DifficultyButtons';
import SessionSummary from './SessionSummary';
import ProgressBar from '../shared/ProgressBar';
import Button from '../shared/Button';
import { useStudy } from '../../contexts/StudyContext';
import { useMode } from '../../contexts/ModeContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';

export default function FlashcardStudy({ deckId, onComplete }) {
  const { getDeck, updateCard } = useStudy();
  const { modeConfig } = useMode();
  const { addXP, updateStats, updateStreak, checkBadges } = useGamification();
  const { practice, getDueCards, mapDifficulty } = useSpacedRepetition();

  const deck = getDeck(deckId);
  const cardsPerSession = modeConfig.flashcards?.cardsPerSession || 20;
  const difficultyLevels = modeConfig.flashcards?.difficultyLevels || 5;
  const xpPerCard = modeConfig.gamification?.xpPerCard || 10;
  const xpPerSession = modeConfig.gamification?.xpPerSession || 30;

  // Build the session queue from due cards
  const sessionCards = useMemo(() => {
    if (!deck) return [];
    const due = getDueCards(deck.cards);
    return due.slice(0, cardsPerSession);
  }, [deck, cardsPerSession, getDueCards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const totalCards = sessionCards.length;
  const currentCard = sessionCards[currentIndex];
  const progress = totalCards > 0 ? ((currentIndex + (isComplete ? 1 : 0)) / totalCards) * 100 : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback((difficultyIndex) => {
    if (!currentCard || !deck) return;

    // Map to supermemo quality and update spaced repetition data
    const quality = mapDifficulty(difficultyIndex, difficultyLevels);
    const updatedCard = practice(currentCard, quality);
    updateCard(deck.id, currentCard.id, { sm2: updatedCard.sm2 });

    // Award XP for reviewing a card
    const cardXp = xpPerCard;
    addXP(cardXp, 'Flashcard review');
    setXpEarned((prev) => prev + cardXp);

    // Track rating
    const newRatings = [...ratings, difficultyIndex];
    setRatings(newRatings);

    // Move to next card or finish
    if (currentIndex + 1 >= totalCards) {
      // Session complete
      const sessionXp = xpPerSession;
      addXP(sessionXp, 'Session complete');
      setXpEarned((prev) => prev + sessionXp);

      updateStats({ totalSessions: 1, totalCardsReviewed: totalCards });
      updateStreak();
      checkBadges();

      setIsComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [
    currentCard, deck, currentIndex, totalCards, ratings, difficultyLevels,
    xpPerCard, xpPerSession, mapDifficulty, practice, updateCard,
    addXP, updateStats, updateStreak, checkBadges,
  ]);

  const handleStudyAgain = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings([]);
    setIsComplete(false);
    setXpEarned(0);
  }, []);

  const handleFinish = useCallback(() => {
    onComplete?.({ cardsReviewed: totalCards, ratings, xpEarned });
  }, [onComplete, totalCards, ratings, xpEarned]);

  // Edge cases
  if (!deck) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary,#6b7280)]">Deck not found.</p>
        <Button variant="outline" className="mt-4" onClick={handleFinish}>
          Back to Decks
        </Button>
      </div>
    );
  }

  if (totalCards === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-[var(--text-primary,#111827)] mb-2">
          No cards due for review!
        </p>
        <p className="text-sm text-[var(--text-secondary,#6b7280)] mb-6">
          All caught up. Check back later or add new cards.
        </p>
        <Button variant="outline" onClick={handleFinish}>
          Back to Decks
        </Button>
      </div>
    );
  }

  // Session complete view
  if (isComplete) {
    return (
      <SessionSummary
        results={{ cardsReviewed: totalCards, ratings, xpEarned }}
        onStudyAgain={handleStudyAgain}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">
      {/* Progress and counter */}
      <div className="flex items-center justify-between gap-4">
        <ProgressBar value={progress} height={6} />
        <span className="text-sm font-medium text-[var(--text-secondary,#6b7280)] whitespace-nowrap tabular-nums">
          Card {currentIndex + 1} of {totalCards}
        </span>
      </div>

      {/* Flashcard */}
      <FlashcardCard
        front={currentCard.front}
        back={currentCard.back}
        isFlipped={isFlipped}
        onFlip={handleFlip}
      />

      {/* Difficulty buttons (shown after flip) */}
      <div className="min-h-[72px] flex items-center justify-center">
        {isFlipped ? (
          <DifficultyButtons onRate={handleRate} difficultyLevels={difficultyLevels} />
        ) : (
          <p className="text-sm text-[var(--text-secondary,#6b7280)] opacity-60">
            Flip the card to rate your answer
          </p>
        )}
      </div>
    </div>
  );
}
