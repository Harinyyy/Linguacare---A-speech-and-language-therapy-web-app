import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { PronunciationExercisePage } from './pages/PronunciationExercisePage';
import { ListeningExercisePage } from './pages/ListeningExercisePage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { Chatbot } from './components/Chatbot';
import { BreakReminderModal } from './components/BreakReminderModal';
import { OnboardingTour } from './components/OnboardingTour';
import { useOnboarding } from './hooks/useOnboarding';
import { unlockAudio } from './services/soundService';
import type { User, ExerciseSettings, Page, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginRole, setLoginRole] = useState<UserRole | null>(null);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [exerciseSettings, setExerciseSettings] = useState<ExerciseSettings>({
    language: 'english',
    ageGroup: 'kids',
    difficulty: 'easy',
  });
  
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  const [breakInfo, setBreakInfo] = useState<{ isActive: boolean; endTime: number | null }>({
    isActive: false,
    endTime: null,
  });
  const { showTour, completeOnboarding } = useOnboarding();

  const EXERCISE_PAGES: Page[] = ['pronunciation_exercise', 'listening_exercise', 'exercises'];
  const BREAK_REMINDER_DURATION_MS = 45 * 60 * 1000; // 45 minutes
  const FORCED_BREAK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    const unlockAudioAPIs = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
        unlockAudio();
        console.log("Audio APIs unlocked by user gesture.");
    };

    window.addEventListener('click', unlockAudioAPIs, { once: true });
    window.addEventListener('touchstart', unlockAudioAPIs, { once: true });

    return () => {
        window.removeEventListener('click', unlockAudioAPIs);
        window.removeEventListener('touchstart', unlockAudioAPIs);
    };
  }, []);

  useEffect(() => {
    const isExercising = EXERCISE_PAGES.includes(activePage);

    if (isExercising && exerciseStartTime === null) {
      setExerciseStartTime(Date.now());
    } else if (!isExercising && exerciseStartTime !== null) {
      setExerciseStartTime(null);
      setBreakInfo({ isActive: false, endTime: null });
    }
  }, [activePage, exerciseStartTime]);

  useEffect(() => {
    let timerId: number | undefined;

    if (exerciseStartTime !== null && !breakInfo.isActive) {
      timerId = window.setInterval(() => {
        if (Date.now() - exerciseStartTime > BREAK_REMINDER_DURATION_MS) {
          setBreakInfo({ isActive: true, endTime: Date.now() + FORCED_BREAK_DURATION_MS });
        }
      }, 60000); 
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [exerciseStartTime, breakInfo.isActive]);

  useEffect(() => {
    if (!breakInfo.isActive || !breakInfo.endTime) {
      return;
    }
    const remainingTime = breakInfo.endTime - Date.now();
    const timerId = setTimeout(() => {
      setBreakInfo({ isActive: false, endTime: null });
      setExerciseStartTime(Date.now());
    }, remainingTime > 0 ? remainingTime : 0);
    return () => clearTimeout(timerId);
  }, [breakInfo]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setLoginRole(null);
    setActivePage(loggedInUser.role === 'admin' ? 'admin_panel' : 'dashboard');
  };
  
  const handleLogout = () => {
    setUser(null);
    setLoginRole(null);
  };
  
  const handleNavigate = (page: Page, settings?: ExerciseSettings) => {
    if (user?.role === 'admin' && EXERCISE_PAGES.includes(page)) {
      console.warn("Admin navigation to exercise page blocked. Redirecting to admin panel.");
      setActivePage('admin_panel');
      return;
    }
    if (settings) {
      setExerciseSettings(settings);
    }
    setActivePage(page);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (!user) {
    if (!loginRole) {
        return <LandingPage onSelectRole={setLoginRole} />;
    } else {
        return <LoginPage role={loginRole} onLogin={handleLogin} onBack={() => setLoginRole(null)} />;
    }
  }

  const renderActivePage = () => {
    const ADMIN_ALLOWED_PAGES: Page[] = ['admin_panel', 'schedule', 'settings'];
    if (user.role === 'admin' && !ADMIN_ALLOWED_PAGES.includes(activePage)) {
        return <AdminPanelPage />;
    }
      
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage user={user} onNavigate={handleNavigate} />;
      case 'exercises':
        return <ExercisesPage onNavigate={handleNavigate} />;
      case 'pronunciation_exercise':
        return <PronunciationExercisePage user={user} settings={exerciseSettings} startTime={exerciseStartTime} isFrozen={breakInfo.isActive} />;
      case 'listening_exercise':
        return <ListeningExercisePage user={user} settings={exerciseSettings} startTime={exerciseStartTime} isFrozen={breakInfo.isActive} />;
      case 'schedule':
        return <SchedulePage />;
      case 'settings':
        return <SettingsPage user={user} onUpdateUser={handleUpdateUser} />;
      case 'admin_panel':
        return user.role === 'admin' ? <AdminPanelPage /> : <DashboardPage user={user} onNavigate={handleNavigate} />;
      default:
        return <DashboardPage user={user} onNavigate={handleNavigate} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {showTour && user.role !== 'admin' && <OnboardingTour onComplete={completeOnboarding} />}
      <Header 
        user={user} 
        onLogout={handleLogout} 
      />
      <div className="flex flex-1">
        <Sidebar user={user} activePage={activePage} onNavigate={handleNavigate} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>
      <Chatbot user={user} onNavigate={handleNavigate} language={exerciseSettings.language} />
      <BreakReminderModal breakEndTime={breakInfo.endTime} />
    </div>
  );
};

export default App;
