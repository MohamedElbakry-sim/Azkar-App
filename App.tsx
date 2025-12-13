
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NotificationManager from './components/NotificationManager';
import SplashScreen from './components/SplashScreen';
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
const MissedPrayers = React.lazy(() => import('./pages/MissedPrayers'));
const Duas = React.lazy(() => import('./pages/Duas'));
const QuranIndex = React.lazy(() => import('./pages/QuranIndex')); 
const SurahDetail = React.lazy(() => import('./pages/SurahDetail')); 
const QuranReader = React.lazy(() => import('./pages/QuranReader')); 
const Radio = React.lazy(() => import('./pages/Radio'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// New Pages
const MoreMenu = React.lazy(() => import('./pages/MoreMenu'));
const AthkarIndex = React.lazy(() => import('./pages/AthkarIndex'));

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nour_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    storage.resetTodayProgress();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
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
      
      <RadioProvider>
        <Router>
            <NotificationManager />
            
            <Layout darkMode={darkMode} toggleTheme={toggleTheme}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Tab Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/quran" element={<QuranIndex />} />
                  <Route path="/athkar" element={<AthkarIndex />} />
                  <Route path="/prayers" element={<PrayerTimes />} />
                  <Route path="/more" element={<MoreMenu />} />

                  {/* Quran Sub-routes */}
                  <Route path="/quran/detail/:id" element={<SurahDetail />} />
                  <Route path="/quran/read/:surahId" element={<QuranReader />} />

                  {/* Athkar Sub-routes */}
                  <Route path="/category/:id" element={<CategoryView />} />
                  <Route path="/favorites" element={<Favorites />} />

                  {/* Feature Routes (Accessible via More) */}
                  <Route path="/radio" element={<Radio />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/tasbeeh" element={<Tasbeeh />} />
                  <Route path="/names" element={<NamesOfAllah />} />
                  <Route path="/qada" element={<MissedPrayers />} />
                  <Route path="/duas" element={<Duas />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/settings" element={<Settings darkMode={darkMode} toggleTheme={toggleTheme} />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            </Layout>
        </Router>
      </RadioProvider>
    </ErrorBoundary>
  );
};

export default App;
