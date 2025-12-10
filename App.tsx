
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NotificationManager from './components/NotificationManager';
// import OnboardingModal from './components/OnboardingModal'; // Onboarding disabled
import SplashScreen from './components/SplashScreen'; // Import Splash Screen
import ErrorBoundary from './components/ErrorBoundary'; // Import Error Boundary
import { Loader2 } from 'lucide-react';
import * as storage from './services/storage';

// Lazy load secondary pages to reduce initial bundle size
const CategoryView = React.lazy(() => import('./pages/CategoryView'));
const Tasbeeh = React.lazy(() => import('./pages/Tasbeeh'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Stats = React.lazy(() => import('./pages/Stats'));
const Settings = React.lazy(() => import('./pages/Settings'));
const PrayerTimes = React.lazy(() => import('./pages/PrayerTimes'));
const NamesOfAllah = React.lazy(() => import('./pages/NamesOfAllah'));
const Contact = React.lazy(() => import('./pages/Contact'));
const MissedPrayers = React.lazy(() => import('./pages/MissedPrayers')); // New
const Duas = React.lazy(() => import('./pages/Duas')); // New
const NotFound = React.lazy(() => import('./pages/NotFound')); // 404 Page

const App: React.FC = () => {
  // Splash screen disabled for now
  const [showSplash, setShowSplash] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nour_theme');
      if (saved) return saved === 'dark';
      // Fallback to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Default fallback if window is undefined
  });

  // Reset Azkar progress for the current day whenever the app initializes (refresh or open)
  useEffect(() => {
    storage.resetTodayProgress();
  }, []);

  // Apply theme class to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only automatically toggle if the user hasn't manually set a preference
      if (!localStorage.getItem('nour_theme')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Persist manual choice
    localStorage.setItem('nour_theme', newMode ? 'dark' : 'light');
  };

  const PageLoader = () => (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
    </div>
  );

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      <Router>
        <NotificationManager />
        {/* Onboarding disabled
        {!showSplash && <OnboardingModal />} 
        */}
        
        <Layout darkMode={darkMode} toggleTheme={toggleTheme}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:id" element={<CategoryView />} />
              <Route path="/prayers" element={<PrayerTimes />} />
              <Route path="/tasbeeh" element={<Tasbeeh />} />
              <Route path="/names" element={<NamesOfAllah />} />
              <Route path="/qada" element={<MissedPrayers />} /> {/* Route for Qada */}
              <Route path="/duas" element={<Duas />} /> {/* Route for Duas */}
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings darkMode={darkMode} toggleTheme={toggleTheme} />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
