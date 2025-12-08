import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryView from './pages/CategoryView';
import Tasbeeh from './pages/Tasbeeh';
import Favorites from './pages/Favorites';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import PrayerTimes from './pages/PrayerTimes';
import OnboardingModal from './components/OnboardingModal';
import NotificationManager from './components/NotificationManager';

const App: React.FC = () => {
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

  return (
    <Router>
      <NotificationManager />
      <Layout darkMode={darkMode} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:id" element={<CategoryView />} />
          <Route path="/prayers" element={<PrayerTimes />} />
          <Route path="/tasbeeh" element={<Tasbeeh />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings darkMode={darkMode} toggleTheme={toggleTheme} />} />
        </Routes>
      </Layout>
      <OnboardingModal />
    </Router>
  );
};

export default App;