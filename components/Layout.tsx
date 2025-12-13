
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Book, Clock, Menu, Sun, Moon, ArrowRight, LayoutGrid, Maximize2, Square, Play, Pause } from 'lucide-react';
import Logo from './Logo';
import { useRadio } from '../contexts/RadioContext';

// Custom Icons
export const PrayerIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const AthkarIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TasbeehIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
    <path d="M12 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const AllahIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V21M8 7C8 7 10 5 12 5C14 5 16 7 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 10C12 10 16 10 17 14C18 18 12 21 12 21C12 21 6 18 7 14C8 10 12 10 12 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStation, isPlaying, togglePlay, stop, isBuffering } = useRadio();
  const showMiniPlayer = currentStation && location.pathname !== '/radio';

  // Check if we are in Reading Mode (Quran Reader)
  const isReadingMode = location.pathname.includes('/quran/read');

  // Helper to determine if we are in a detail view (to show back button on mobile)
  // Exclude isReadingMode because it handles its own UI
  const isDetailView = !isReadingMode && (
                       location.pathname.startsWith('/quran/detail') || // Fixed: detail, not read
                       location.pathname.startsWith('/category/') ||
                       location.pathname === '/settings');

  const navTabs = [
    { path: '/', icon: <Home size={22} />, label: 'الرئيسية' },
    { path: '/quran', icon: <Book size={22} />, label: 'القرآن' },
    { path: '/athkar', icon: <AthkarIcon size={22} />, label: 'الأذكار' },
    { path: '/prayers', icon: <PrayerIcon size={22} />, label: 'الصلاة' },
    { path: '/more', icon: <Menu size={22} />, label: 'المزيد' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] dark:bg-dark-bg transition-colors duration-200 font-arabic text-body text-gray-900 dark:text-dark-text">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-white dark:bg-dark-panel border-l border-gray-100 dark:border-dark-border z-50">
        {/* Logo Area */}
        <div className="p-8 flex items-center gap-3">
           <Logo size={40} className="text-primary-600 dark:text-primary-500" />
        </div>
        
        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-2 py-4">
          {navTabs.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 p-4 rounded-xl transition-all duration-200 font-bold
                ${isActive 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-gray-500 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-surface hover:text-gray-900 dark:hover:text-dark-text'}
              `}
            >
              {item.icon}
              <span className="text-lg">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="p-6 border-t border-gray-100 dark:border-dark-border">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-50 dark:bg-dark-surface text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors"
          >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="font-bold">{darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className={`flex-1 flex flex-col min-h-screen relative max-w-full ${isReadingMode ? 'h-screen overflow-hidden pb-0' : 'pb-24 md:pb-0'}`}>
        
        {/* Mobile Header (Only on Detail Views or specific pages if needed) */}
        {isDetailView && (
            <header className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-dark-panel/80 backdrop-blur-md border-b border-gray-100 dark:border-dark-border px-4 py-3 flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 -mr-2 text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-full"
                >
                    <ArrowRight size={24} />
                </button>
                <div className="font-bold text-lg">ريان</div>
                <div className="w-8"></div> {/* Spacer */}
            </header>
        )}

        {/* Desktop Header - Hide in reading mode */}
        {!isReadingMode && (
            <header className="hidden md:flex sticky top-0 z-40 bg-[#F9FAFB]/90 dark:bg-dark-bg/90 backdrop-blur px-8 py-6 justify-between items-center border-b border-transparent">
                {/* Contextual Title could go here */}
                <div className="text-gray-400 dark:text-dark-muted font-medium text-sm">
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>
        )}

        {/* Adjust Main Container: Remove padding and max-width if reading mode */}
        <main className={`flex-1 w-full mx-auto ${isReadingMode ? 'p-0 max-w-full h-full' : 'p-4 md:p-8 max-w-5xl'}`}>
          <div className="animate-fadeIn w-full h-full">
            {children}
          </div>
        </main>

        {/* --- MOBILE BOTTOM TAB BAR - Hide in reading mode --- */}
        {!isReadingMode && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-panel border-t border-gray-100 dark:border-dark-border z-50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-around">
                    {navTabs.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex flex-col items-center justify-center py-3 px-2 w-full transition-all duration-200
                                ${isActive 
                                    ? 'text-primary-600 dark:text-primary-500' 
                                    : 'text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-gray-400'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`mb-1 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        )}

        {/* --- MINI PLAYER (Global) - Hide in reading mode --- */}
        {showMiniPlayer && !isReadingMode && (
            <div 
                onClick={() => navigate('/radio')}
                className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:w-96 md:right-8 z-40 animate-slideUp cursor-pointer group"
            >
                <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl border border-gray-200 dark:border-dark-border rounded-2xl p-3 shadow-2xl flex items-center justify-between hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {/* Icon Box */}
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0 relative">
                             {/* Visualizer bars */}
                             <div className="flex gap-0.5 h-4 items-end">
                                <div className={`w-1 bg-current rounded-sm ${isPlaying ? 'animate-[pulse_0.6s_ease-in-out_infinite]' : 'h-2'}`}></div>
                                <div className={`w-1 bg-current rounded-sm ${isPlaying ? 'animate-[pulse_0.8s_ease-in-out_infinite]' : 'h-3'}`}></div>
                                <div className={`w-1 bg-current rounded-sm ${isPlaying ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : 'h-1.5'}`}></div>
                             </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    بث مباشر
                                </span>
                            </div>
                            <span className="font-bold text-sm text-gray-800 dark:text-white truncate font-arabicHead leading-tight mt-0.5">
                                {currentStation.name}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 pl-2 border-r border-gray-100 dark:border-gray-700 mr-2 pr-1" onClick={(e) => e.stopPropagation()}>
                        {/* Play/Pause */}
                        <button 
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-dark-elevated hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-800 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all shadow-sm"
                        >
                            {isBuffering ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? (
                                <Pause size={18} fill="currentColor" />
                            ) : (
                                <Play size={18} fill="currentColor" className="ml-0.5" />
                            )}
                        </button>

                        {/* Stop Button */}
                        <button 
                            onClick={stop}
                            className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 flex items-center justify-center transition-all shadow-sm"
                            title="إيقاف"
                        >
                            <Square size={16} fill="currentColor" />
                        </button>
                    </div>

                    {/* Expand Icon */}
                    <div className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-colors">
                        <Maximize2 size={18} />
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Layout;
