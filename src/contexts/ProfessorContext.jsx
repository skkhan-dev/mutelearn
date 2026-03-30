import { createContext, useContext, useCallback, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMode } from './ModeContext';
import { useUser } from './UserContext';
import { useStudy } from './StudyContext';
import { getSystemPrompt } from '../config/professorPrompts';
import { useState } from 'react';

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

  const [conversations, setConversations] = useLocalStorage(
    'mutelearn-professor-conversations',
    {}
  );
  const [activeSubject, setActiveSubject] = useLocalStorage(
    'mutelearn-professor-subject',
    'general'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Keep a ref so async callbacks always see latest history
  const historyRef = useRef([]);

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

    return {
      recentScores,
      weakAreas: [],
      currentSubject: activeSubject !== 'general' ? activeSubject : null,
      currentDeck: null,
    };
  }, [quizHistory, activeSubject]);

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
