import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModeProvider } from './contexts/ModeContext';
import { StudyProvider } from './contexts/StudyContext';
import { LMSProvider } from './contexts/LMSContext';
import { PlatformProvider } from './contexts/PlatformContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { ProfessorProvider } from './contexts/ProfessorContext';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import FlashcardsPage from './pages/FlashcardsPage';
import StudySession from './pages/StudySession';
import NotesPage from './pages/NotesPage';
import QuizPage from './pages/QuizPage';
import GamesPage from './pages/GamesPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import PlannerPage from './pages/PlannerPage';
import StudyPacksPage from './pages/StudyPacksPage';
import StudyPackDetailPage from './pages/StudyPackDetailPage';
import LevelUpModal from './components/gamification/LevelUpModal';
import ProfessorFAB from './components/professor/ProfessorFAB';
import ProfessorChat from './components/professor/ProfessorChat';
import IdleNudge from './components/accessibility/IdleNudge';
import { useProfessor } from './contexts/ProfessorContext';

function AppRoutes() {
  const { user } = useUser();
  const { isOpen: professorOpen, openProfessor, closeProfessor, promptSuggestions } = useProfessor();

  if (!user.hasOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/flashcards/:deckId" element={<FlashcardsPage />} />
          <Route path="/study" element={<StudySession />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/quizzes" element={<QuizPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/study-packs" element={<StudyPacksPage />} />
          <Route path="/study-packs/:packId" element={<StudyPackDetailPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Global overlays */}
      <LevelUpModal />
      <IdleNudge />
      <ProfessorFAB onClick={() => openProfessor()} hasUnread={!professorOpen && promptSuggestions.length > 0} />
      <ProfessorChat isOpen={professorOpen} onClose={closeProfessor} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PlatformProvider>
        <UserProvider>
          <ModeProvider>
            <StudyProvider>
              <LMSProvider>
                <GamificationProvider>
                  <ProfessorProvider>
                    <AppRoutes />
                  </ProfessorProvider>
                </GamificationProvider>
              </LMSProvider>
            </StudyProvider>
          </ModeProvider>
        </UserProvider>
      </PlatformProvider>
    </BrowserRouter>
  );
}

export default App;
