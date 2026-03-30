import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudy } from '../contexts/StudyContext';
import { useGamification } from '../contexts/GamificationContext';

function QuizCard({ quiz }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const scoreColor =
    quiz.score >= 90
      ? 'text-emerald-600 bg-emerald-50'
      : quiz.score >= 70
      ? 'text-blue-600 bg-blue-50'
      : quiz.score >= 50
      ? 'text-amber-600 bg-amber-50'
      : 'text-red-600 bg-red-50';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{quiz.deckName || 'Quiz'}</h3>
          <p className="text-sm text-gray-500 mt-1">{formatDate(quiz.completedAt)}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold text-lg ${scoreColor}`}>
          {quiz.score}%
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-gray-500">
        <span>{quiz.totalQuestions} questions</span>
        <span>{quiz.correctAnswers} correct</span>
        {quiz.score === 100 && <span className="text-amber-500 font-medium">Perfect!</span>}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { decks, quizHistory, saveQuizResult } = useStudy();
  const { addXP, updateStats, addSessionHistory } = useGamification();
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const eligibleDecks = decks.filter((d) => d.cards.length >= 4);

  const generateQuestions = (deck) => {
    const cards = [...deck.cards].sort(() => Math.random() - 0.5);
    return cards.slice(0, Math.min(10, cards.length)).map((card) => {
      const wrongAnswers = deck.cards
        .filter((c) => c.id !== card.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.back);

      const options = [...wrongAnswers, card.back].sort(() => Math.random() - 0.5);

      return {
        id: card.id,
        question: card.front,
        correctAnswer: card.back,
        options,
      };
    });
  };

  const handleStartQuiz = () => {
    const deck = decks.find((d) => d.id === selectedDeckId);
    if (!deck) return;

    const qs = generateQuestions(deck);
    setQuestions(qs);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setQuizInProgress(true);
    setShowResult(false);
  };

  const handleAnswer = (answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex + 1 >= questions.length) {
      // Quiz complete
      const correctCount = newAnswers.filter(
        (a, i) => a === questions[i].correctAnswer
      ).length;
      const score = Math.round((correctCount / questions.length) * 100);
      const deck = decks.find((d) => d.id === selectedDeckId);

      const result = {
        deckId: selectedDeckId,
        deckName: deck?.name,
        score,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
      };

      saveQuizResult(result);
      setQuizResult(result);
      setShowResult(true);
      setQuizInProgress(false);

      const xpEarned = 25 + correctCount * 5;
      addXP(xpEarned, 'Quiz completed');
      updateStats({ totalQuizzes: 1, ...(score === 100 ? { perfectQuizzes: 1 } : {}) });
      addSessionHistory({
        type: 'quiz',
        description: `Quiz on "${deck?.name}" - ${score}%`,
        xpEarned,
      });
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Quiz result screen
  if (showResult && quizResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="text-7xl mb-4">
          {quizResult.score === 100 ? '🏆' : quizResult.score >= 70 ? '🎉' : '💪'}
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Quiz Complete!</h1>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <p className="text-6xl font-bold text-indigo-600 mb-2">{quizResult.score}%</p>
          <p className="text-gray-500">
            {quizResult.correctAnswers} out of {quizResult.totalQuestions} correct
          </p>

          {quizResult.score === 100 && (
            <div className="mt-4 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl inline-block font-medium">
              Perfect Score! Amazing work!
            </div>
          )}
          {quizResult.score >= 70 && quizResult.score < 100 && (
            <p className="mt-4 text-gray-500">Great job! Keep practicing to get a perfect score!</p>
          )}
          {quizResult.score < 70 && (
            <p className="mt-4 text-gray-500">Nice try! Review your flashcards and try again!</p>
          )}
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Link
            to="/dashboard"
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => {
              setShowResult(false);
              setQuizResult(null);
            }}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  // Active quiz
  if (quizInProgress && currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <button
            onClick={() => {
              setQuizInProgress(false);
              setQuestions([]);
              setAnswers([]);
            }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Exit Quiz
          </button>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <p className="text-xl font-bold text-gray-800 text-center mb-8">
            {currentQuestion.question}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                className="w-full text-left px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all text-gray-700 font-medium"
              >
                <span className="text-gray-400 mr-3">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quiz setup
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Quizzes</h1>
        <p className="text-gray-500 mt-1">Test your knowledge with auto-generated quizzes</p>
      </div>

      {/* Start New Quiz */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Start a New Quiz</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select a deck with at least 4 cards to generate a quiz
        </p>

        {eligibleDecks.length > 0 ? (
          <div className="space-y-4">
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 bg-white"
            >
              <option value="">Choose a deck...</option>
              {eligibleDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.cards.length} cards)
                </option>
              ))}
            </select>
            <button
              onClick={handleStartQuiz}
              disabled={!selectedDeckId}
              className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Quiz
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-gray-500 mb-2">No eligible decks</p>
            <p className="text-sm text-gray-400 mb-4">
              Create a flashcard deck with at least 4 cards to start taking quizzes
            </p>
            <Link
              to="/flashcards"
              className="inline-block px-6 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
            >
              Create a Deck
            </Link>
          </div>
        )}
      </div>

      {/* Quiz History */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quiz History</h2>
        {quizHistory.length > 0 ? (
          <div className="space-y-3">
            {[...quizHistory].reverse().map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-500 font-medium">No quizzes taken yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your quiz scores will appear here after you take your first quiz
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
