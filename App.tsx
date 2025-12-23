
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import Layout from './components/Layout';
import Home from './pages/Home';
import NotificationManager from './components/NotificationManager';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import * as storage from './services/storage';
import { RadioProvider } from './contexts/RadioContext';

// Lazy load pages
const CategoryView = React.lazy(() => import('./pages/CategoryView'));
const Tasbeeh = React.lazy(() => import('./pages/Tasbeeh'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Stats = React.lazy(() => import('./pages/Stats'));
const Settings = React.lazy(() => import('./pages/Settings'));
const PrayerTimes = React.lazy(() => import('./pages/PrayerTimes'));
const CalendarPage = React.lazy(() => import('./pages/Calendar'));
const NamesOfAllah = React.lazy(() => import('./pages/NamesOfAllah'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Duas = React.lazy(() => import('./pages/Duas'));
const Radio = React.lazy(() => import('./pages/Radio'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// New Pages
const MoreMenu = React.lazy(() => import('./pages/MoreMenu'));
const AthkarIndex = React.lazy(() => import('./pages/AthkarIndex'));
const QuranIndex = React.lazy(() => import('./pages/QuranIndex'));
const QuranReader = React.lazy(() => import('./pages/QuranReader'));

// Component to handle back button logic which needs access to Router hooks
const AppUrlListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only register listener on native platforms
    if (!Capacitor.isNativePlatform()) return;

    try {
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // Exit app if on main tabs or home
        if (['/', '/home', '/athkar', '/prayers', '/more', '/quran'].includes(location.pathname)) {
            CapacitorApp.exitApp();
        } else {
            // Otherwise go back in history
            navigate(-1);
        }
        });
  } catch (e) {
        console.warn('Back button listener failed', e);
    }

    return () => {
      try {
        CapacitorApp.removeAllListeners();
      } catch(e) {}
    };
  }, [navigate, location]);

  return null;
};

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nour_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [accentTheme, setAccentTheme] = useState<storage.AccentTheme>(() => storage.getAccentTheme());

  // Function to apply accent to DOM
  const applyAccent = useCallback((theme: storage.AccentTheme) => {
    document.documentElement.setAttribute('data-accent', theme);
  }, []);

  useEffect(() => {
    storage.resetTodayProgress();
    applyAccent(accentTheme);
    
    // Initial Status Bar Config for Android
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      } catch (e) { console.warn('StatusBar error', e); }
    }

    // Listen for Home Screen Quick Toggles
    const handleGlobalThemeToggle = () => {
        const saved = localStorage.getItem('nour_theme');
        setDarkMode(saved === 'dark');
    };

    const handleAccentThemeChange = () => {
        const saved = storage.getAccentTheme();
        setAccentTheme(saved);
        applyAccent(saved);
    };

    window.addEventListener('appearance-changed', handleGlobalThemeToggle);
    window.addEventListener('accent-changed', handleAccentThemeChange);
    return () => {
        window.removeEventListener('appearance-changed', handleGlobalThemeToggle);
        window.removeEventListener('accent-changed', handleAccentThemeChange);
    };
  }, [accentTheme, applyAccent]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      if (Capacitor.isNativePlatform()) {
        try {
            StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
            StatusBar.setBackgroundColor({ color: '#121212' }).catch(() => {});
        } catch(e) {}
      }
    } else {
      root.classList.remove('dark');
      if (Capacitor.isNativePlatform()) {
        try {
            StatusBar.setStyle({ style: Style.Light }).catch(() => {});
            StatusBar.setBackgroundColor({ color: '#F9FAFB' }).catch(() => {});
        } catch(e) {}
      }
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('nour_theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('appearance-changed'));
  };

  const PageLoader = () => (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
    </div>
  );

  return (
    <RadioProvider>
      <Router>
        <ErrorBoundary>
          <AppUrlListener />
          <NotificationManager />
          
          <Layout darkMode={darkMode} toggleTheme={toggleTheme}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Tab Routes */}
                <Route path="/" element={<Home darkMode={darkMode} onToggleTheme={toggleTheme} />} />
                <Route path="/athkar" element={<AthkarIndex />} />
                <Route path="/quran" element={<QuranIndex />} />
                <Route path="/prayers" element={<PrayerTimes />} />
                <Route path="/more" element={<MoreMenu />} />

                {/* Athkar Sub-routes */}
                <Route path="/category/:id" element={<CategoryView />} />
                <Route path="/favorites" element={<Favorites />} />

                {/* Quran Sub-routes */}
                <Route path="/quran/:surahId" element={<QuranReader />} />

                {/* Feature Routes */}
                <Route path="/radio" element={<Radio />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/tasbeeh" element={<Tasbeeh />} />
                <Route path="/names" element={<NamesOfAllah />} />
                <Route path="/duas" element={<Duas />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/settings" element={<Settings darkMode={darkMode} toggleTheme={toggleTheme} currentAccent={accentTheme} />} />
                <Route path="/contact" element={<Contact />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </ErrorBoundary>
      </Router>
    </RadioProvider>
  );
};

export default App;
