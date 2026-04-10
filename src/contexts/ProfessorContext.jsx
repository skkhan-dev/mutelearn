import { createContext, useContext, useCallback, useMemo, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMode } from './ModeContext';
import { useUser } from './UserContext';
import { useStudy } from './StudyContext';
import { useLMS } from './LMSContext';
import { getSystemPrompt } from '../config/professorPrompts';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const ProfessorContext = createContext();

// Development API key — leave empty; the UI will prompt the user to configure it.
const ANTHROPIC_API_KEY = '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm Professor, your study buddy. Ask me anything about what you're studying, and I'll help you feel confident in what you know! \uD83C\uDF93",
  timestamp: new Date().toISOString(),
};

export function ProfessorProvider({ children }) {
  const { mode } = useMode();
  const { user } = useUser();
  const { decks, quizHistory } = useStudy();
  const {
    weakAreas,
    upcomingAssignments,
    courses,
    files,
    studyPacks,
    dashboardInsights,
  } = useLMS();
  const location = useLocation();

  const [conversations, setConversations] = useLocalStorage(
    'mutelearn-professor-conversations',
    {}
  );
  const [activeSubject, setActiveSubject] = useLocalStorage(
    'mutelearn-professor-subject',
    'general'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');

  // Keep a ref so async callbacks always see latest history
  const historyRef = useRef([]);

  const routeStudyContext = useMemo(() => {
    const courseMatch = location.pathname.match(/^\/courses\/([^/]+)$/);
    const packMatch = location.pathname.match(/^\/study-packs\/([^/]+)$/);
    const routeCourse = courseMatch
      ? courses.find((course) => course.id === courseMatch[1]) || null
      : null;
    const routePack = packMatch
      ? studyPacks.find((pack) => pack.id === packMatch[1]) || null
      : null;
    const routePackCourse =
      routePack && routePack.courseId
        ? courses.find((course) => course.id === routePack.courseId) || null
        : null;

    return {
      currentCourse: routePackCourse || routeCourse || null,
      currentPack: routePack || null,
    };
  }, [courses, location.pathname, studyPacks]);

  const getHistory = useCallback(() => {
    const subjectHistory = conversations[activeSubject];
    if (subjectHistory && subjectHistory.length > 0) {
      historyRef.current = subjectHistory;
      return subjectHistory;
    }
    historyRef.current = [WELCOME_MESSAGE];
    return [WELCOME_MESSAGE];
  }, [conversations, activeSubject]);

  const history = getHistory();

  const persistHistory = useCallback(
    (newHistory) => {
      historyRef.current = newHistory;
      setConversations((prev) => ({
        ...prev,
        [activeSubject]: newHistory,
      }));
    },
    [activeSubject, setConversations]
  );

  const buildStudyContext = useCallback(() => {
    const recentScores = quizHistory
      .slice(-5)
      .map((q) => ({ name: q.deckName || 'Quiz', score: q.score }));

    const routeCourse = routeStudyContext.currentCourse;
    const routePack = routeStudyContext.currentPack;
    const activeCourse =
      routeCourse ||
      courses.find((course) => course.id === activeSubject || course.name === activeSubject) ||
      upcomingAssignments[0]?.course ||
      null;
    const currentDeck =
      decks.find((deck) =>
        activeCourse?.name
          ? deck.subject?.toLowerCase() === activeCourse.name.toLowerCase()
          : false
      ) || null;
    const focusedFiles = activeCourse
      ? files
          .filter((file) => file.courseId === activeCourse.id)
          .slice(0, 3)
          .map((file) => file.title)
      : [];
    const focusedWeakAreas =
      routePack?.weakTopics?.length > 0 ? routePack.weakTopics : weakAreas;

    return {
      recentScores,
      weakAreas: focusedWeakAreas,
      currentSubject: activeCourse?.name || (activeSubject !== 'general' ? activeSubject : null),
      currentAssignment: routePack?.assignment?.title || null,
      currentPack: routePack?.title || null,
      currentCourseCode: activeCourse?.code || null,
      currentDeck: currentDeck?.name || null,
      relatedMaterials: focusedFiles,
      checklistProgress:
        routePack && routePack.totalChecklistItems
          ? `${routePack.completedCount}/${routePack.totalChecklistItems}`
          : null,
      focusReflection: routePack?.focusReflection || null,
      upcomingDeadlines: upcomingAssignments
        .slice(0, 3)
        .map((assignment) => `${assignment.title} (${assignment.course?.name || 'course'})`),
    };
  }, [
    activeSubject,
    courses,
    decks,
    files,
    quizHistory,
    routeStudyContext,
    upcomingAssignments,
    weakAreas,
  ]);

  const currentContextLabel = useMemo(() => {
    if (routeStudyContext.currentPack?.title) {
      return routeStudyContext.currentPack.title;
    }

    if (routeStudyContext.currentCourse?.name) {
      return routeStudyContext.currentCourse.name;
    }

    if (activeSubject !== 'general') {
      return activeSubject;
    }

    return 'General study help';
  }, [activeSubject, routeStudyContext]);

  const promptSuggestions = useMemo(() => {
    if (routeStudyContext.currentPack) {
      const pack = routeStudyContext.currentPack;
      const firstWeakTopic = pack.weakTopics?.[0];

      return [
        `Help me break down ${pack.assignment?.title || pack.title} into the next two study blocks.`,
        firstWeakTopic
          ? `Quiz me on ${firstWeakTopic} before I keep working on this pack.`
          : `What should I focus on first in this study pack?`,
        `Explain the most important thing I should understand before I submit ${pack.assignment?.title || 'this assignment'}.`,
      ];
    }

    if (routeStudyContext.currentCourse) {
      const course = routeStudyContext.currentCourse;
      return [
        `What should I focus on first in ${course.name} this week?`,
        `Help me build a simple recovery plan for ${course.name}.`,
        `Quiz me on one key topic from ${course.name}.`,
      ];
    }

    const suggestions = [];

    if (dashboardInsights?.nextStep) {
      suggestions.push(`Help me start ${dashboardInsights.nextStep.title} without getting overwhelmed.`);
    }

    if (dashboardInsights?.nextExam) {
      suggestions.push(`Make me a short prep plan for ${dashboardInsights.nextExam.title}.`);
    }

    if (dashboardInsights?.recoveryQueue?.[0]) {
      suggestions.push(`Help me catch up on ${dashboardInsights.recoveryQueue[0].title} step by step.`);
    }

    if (suggestions.length === 0) {
      suggestions.push('Help me figure out what to study next.');
    }

    return suggestions.slice(0, 3);
  }, [dashboardInsights, routeStudyContext]);

  const openProfessor = useCallback(
    ({ prompt = '', subject = '' } = {}) => {
      if (subject) {
        setActiveSubject(subject);
      }

      if (prompt) {
        setDraftMessage(prompt);
      }

      setIsOpen(true);
    },
    [setActiveSubject]
  );

  const closeProfessor = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim()) return;

      const userEntry = {
        role: 'user',
        content: userMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...historyRef.current, userEntry];
      persistHistory(updatedHistory);
      setIsLoading(true);

      // Build the messages array for the API (exclude welcome / non-user/assistant)
      const apiMessages = updatedHistory
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const systemPrompt = getSystemPrompt({
        mode,
        gradeLevel: user.gradeLevel,
        studyContext: buildStudyContext(),
      });

      try {
        if (!ANTHROPIC_API_KEY) {
          throw new Error('NO_API_KEY');
        }

        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: apiMessages,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`API error ${response.status}: ${err}`);
        }

        const data = await response.json();
        const assistantContent =
          data.content?.[0]?.text || 'Hmm, I didn\'t quite get that. Could you rephrase?';

        const assistantEntry = {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date().toISOString(),
        };

        persistHistory([...updatedHistory, assistantEntry]);
      } catch (error) {
        let errorContent;

        if (error.message === 'NO_API_KEY') {
          errorContent =
            "Professor is not connected yet. To enable AI-powered study help, you'll need to add your API key in Settings.";
        } else if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('CORS') ||
          error.name === 'TypeError'
        ) {
          // CORS or network error fallback
          errorContent =
            "Professor is not connected yet. To enable AI-powered study help, you'll need to set up a proxy server or add your API key in Settings.";
        } else {
          errorContent = `Oops, something went wrong. Let's try again in a moment. (${error.message})`;
        }

        const errorEntry = {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date().toISOString(),
        };

        persistHistory([...updatedHistory, errorEntry]);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, user.gradeLevel, buildStudyContext, persistHistory]
  );

  const clearHistory = useCallback(() => {
    persistHistory([WELCOME_MESSAGE]);
  }, [persistHistory]);

  const switchSubject = useCallback(
    (subject) => {
      setActiveSubject(subject || 'general');
    },
    [setActiveSubject]
  );

  return (
    <ProfessorContext.Provider
      value={{
        history,
        isLoading,
        activeSubject,
        sendMessage,
        clearHistory,
        switchSubject,
        currentContextLabel,
        promptSuggestions,
        isOpen,
        openProfessor,
        closeProfessor,
        draftMessage,
        setDraftMessage,
      }}
    >
      {children}
    </ProfessorContext.Provider>
  );
}

export function useProfessor() {
  const context = useContext(ProfessorContext);
  if (!context) throw new Error('useProfessor must be used within ProfessorProvider');
  return context;
}
