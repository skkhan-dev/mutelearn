import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModeProvider } from './contexts/ModeContext';
import { StudyProvider } from './contexts/StudyContext';
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
import LevelUpModal from './components/gamification/LevelUpModal';
import ProfessorFAB from './components/professor/ProfessorFAB';
import ProfessorChat from './components/professor/ProfessorChat';
import IdleNudge from './components/accessibility/IdleNudge';

function AppRoutes() {
  const { user } = useUser();
  const [professorOpen, setProfessorOpen] = useState(false);

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
          <Route path="/study" element={<StudySession />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/quizzes" element={<QuizPage />} />
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
      <ProfessorFAB onClick={() => setProfessorOpen(true)} />
      <ProfessorChat isOpen={professorOpen} onClose={() => setProfessorOpen(false)} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ModeProvider>
          <StudyProvider>
            <GamificationProvider>
              <ProfessorProvider>
                <AppRoutes />
              </ProfessorProvider>
            </GamificationProvider>
          </StudyProvider>
        </ModeProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
