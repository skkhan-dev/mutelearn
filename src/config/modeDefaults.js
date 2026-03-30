export const modeDefaults = {
  default: {
    label: 'Default',
    description: 'Standard study experience',
    icon: '📚',
    timer: { focus: 25, shortBreak: 5, longBreak: 15, sessionsBeforeLong: 4 },
    flashcards: { cardsPerSession: 20, difficultyLevels: 5 },
    ui: { singleTaskView: false, showSidebar: true, sessionPlanner: false, idleTimeout: 0 },
    gamification: { enabled: true, xpPerCard: 10, xpPerSession: 30, xpPerQuiz: 25, xpPerGame: 20 },
    accessibility: { ttsEnabled: false, readingRuler: false, colorOverlay: null, idleNudge: false },
  },
  adhd: {
    label: 'ADHD',
    description: 'Short sessions, rewards, focused view',
    icon: '⚡',
    timer: { focus: 10, shortBreak: 5, longBreak: 15, sessionsBeforeLong: 3 },
    flashcards: { cardsPerSession: 6, difficultyLevels: 3 },
    ui: { singleTaskView: true, showSidebar: false, sessionPlanner: false, idleTimeout: 0 },
    gamification: { enabled: true, xpPerCard: 15, xpPerSession: 50, xpPerQuiz: 40, xpPerGame: 35 },
    accessibility: { ttsEnabled: false, readingRuler: false, colorOverlay: null, idleNudge: false },
    breaks: [
      'Do 10 jumping jacks! 🏃',
      'Walk around the room 🚶',
      'Stretch your arms up high 🙆',
      'Get a drink of water 💧',
      'Do 5 deep breaths 🌬️',
      'Wiggle your fingers and toes 👋',
      'Look out the window for 30 seconds 🪟',
      'Do a silly dance for 15 seconds 💃',
    ],
  },
  dyslexia: {
    label: 'Dyslexia',
    description: 'Easy-read fonts, text-to-speech, warm colors',
    icon: '👁️',
    timer: { focus: 20, shortBreak: 5, longBreak: 15, sessionsBeforeLong: 4 },
    flashcards: { cardsPerSession: 10, difficultyLevels: 3 },
    ui: { singleTaskView: false, showSidebar: true, sessionPlanner: false, idleTimeout: 0 },
    gamification: { enabled: true, xpPerCard: 10, xpPerSession: 40, xpPerQuiz: 30, xpPerGame: 25 },
    accessibility: { ttsEnabled: true, readingRuler: false, colorOverlay: null, idleNudge: false },
  },
  add: {
    label: 'ADD',
    description: 'Structured flow, task chunking, gentle nudges',
    icon: '🎯',
    timer: { focus: 20, shortBreak: 5, longBreak: 15, sessionsBeforeLong: 4 },
    flashcards: { cardsPerSession: 12, difficultyLevels: 4 },
    ui: { singleTaskView: false, showSidebar: true, sessionPlanner: true, idleTimeout: 120 },
    gamification: { enabled: true, xpPerCard: 10, xpPerSession: 40, xpPerQuiz: 30, xpPerGame: 25 },
    accessibility: { ttsEnabled: false, readingRuler: false, colorOverlay: null, idleNudge: true },
  },
};

export const difficultyLabels = {
  3: ['Try Again', 'Got It', 'Easy!'],
  4: ['Again', 'Hard', 'Good', 'Easy'],
  5: ['Again', 'Hard', 'Good', 'Easy', 'Perfect'],
};

export const difficultyColors = {
  3: ['bg-orange-100 text-orange-700', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700'],
  4: ['bg-orange-100 text-orange-700', 'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700'],
  5: ['bg-orange-100 text-orange-700', 'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700'],
};

export const levelNames = [
  'Study Seedling',    // 1
  'Curious Caterpillar', // 2
  'Page Turner',        // 3
  'Quiz Whiz',          // 4
  'Knowledge Sprout',   // 5
  'Fact Finder',        // 6
  'Brain Builder',      // 7
  'Study Star',         // 8
  'Mind Explorer',      // 9
  'Brain Explorer',     // 10
  'Wisdom Seeker',      // 11
  'Focus Champion',     // 12
  'Learning Legend',    // 13
  'Knowledge Knight',  // 14
  'Study Sage',         // 15
  'Memory Wizard',      // 16
  'Brain Boss',         // 17
  'Scholar Supreme',    // 18
  'Genius Guardian',    // 19
  'Memory Master',      // 20
];

export const xpPerLevel = (level) => 100 + (level - 1) * 50;

export const encouragingMessages = [
  "You're doing great! Keep it up!",
  "Every card you review makes your brain stronger!",
  "Nice focus session! You're building good habits!",
  "Way to go! Consistency is the key to success!",
  "You're on a roll! Your future self will thank you!",
  "Great work! Learning takes courage and you've got it!",
  "Awesome effort! Small steps lead to big knowledge!",
  "You showed up today and that's what matters!",
  "Look at you go! Your brain is growing stronger!",
  "Fantastic! You're becoming a better learner every day!",
];
