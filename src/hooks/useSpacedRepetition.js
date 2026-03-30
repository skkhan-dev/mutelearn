import { supermemo } from 'supermemo';

export function useSpacedRepetition() {
  const practice = (card, quality) => {
    // quality: 0-5 (supermemo scale)
    const { interval, repetition, efactor } = supermemo({
      interval: card.sm2?.interval || 0,
      repetition: card.sm2?.repetition || 0,
      efactor: card.sm2?.efactor || 2.5,
    }, quality);

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + interval);

    return {
      ...card,
      sm2: {
        interval,
        repetition,
        efactor,
        dueDate: dueDate.toISOString().split('T')[0],
        lastReviewed: now.toISOString(),
      },
    };
  };

  const getDueCards = (cards) => {
    const today = new Date().toISOString().split('T')[0];
    return cards
      .filter((card) => {
        if (!card.sm2?.dueDate) return true; // never reviewed
        return card.sm2.dueDate <= today;
      })
      .sort((a, b) => {
        if (!a.sm2?.dueDate) return -1;
        if (!b.sm2?.dueDate) return 1;
        return a.sm2.dueDate.localeCompare(b.sm2.dueDate);
      });
  };

  const mapDifficulty = (difficultyIndex, totalLevels) => {
    // Maps difficulty button index to supermemo quality (0-5)
    if (totalLevels === 3) return [1, 3, 5][difficultyIndex];
    if (totalLevels === 4) return [1, 2, 4, 5][difficultyIndex];
    return [0, 1, 3, 4, 5][difficultyIndex]; // 5 levels
  };

  return { practice, getDueCards, mapDifficulty };
}
