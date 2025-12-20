
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Menu, Sun, Moon, ArrowRight, Maximize2, Square, Play, Pause, Radio, Calendar, BookOpen } from 'lucide-react';
import Logo from './Logo';
import { useRadio } from '../contexts/RadioContext';
import * as storage from '../services/storage';

// Custom Icons Exported for Reuse in Settings
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

// Define All Possible Nav Items
export const ALL_NAV_ITEMS: Record<string, { path: string; label: string; icon: React.ReactNode }> = {
    'home': { path: '/', label: 'الرئيسية', icon: <Home size={22} /> },
    'athkar': { path: '/athkar', label: 'الأذكار', icon: <AthkarIcon size={22} /> },
    'quran': { path: '/quran', label: 'المصحف', icon: <BookOpen size={22} /> },
    'prayers': { path: '/prayers', label: 'الصلاة', icon: <PrayerIcon size={22} /> },
    'tasbeeh': { path: '/tasbeeh', label: 'السبحة', icon: <TasbeehIcon size={22} /> },
    'radio': { path: '/radio', label: 'الإذاعة', icon: <Radio size={22} /> },
    'calendar': { path: '/calendar', label: 'التقويم', icon: <Calendar size={22} /> },
    'more': { path: '/more', label: 'المزيد', icon: <Menu size={22} /> }
};

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStation, isPlaying, togglePlay, stop, isBuffering } = useRadio();
  
  // State for dynamic navigation items
  const [activeNavIds, setActiveNavIds] = useState<string[]>(storage.getNavOrder());
  const [headerDate, setHeaderDate] = useState<string>('');

  // Listen for navigation updates from Settings page
  useEffect(() => {
      const handleNavUpdate = () => {
          setActiveNavIds(storage.getNavOrder());
      };
      
      const updateHeaderDate = () => {
          const date = new Date();
          const offset = storage.getHijriOffset();
          const hijriDate = new Date();
          hijriDate.setDate(hijriDate.getDate() + offset);

          try {
              const miladi = new Intl.DateTimeFormat('ar-SA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
              }).format(date);

              const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
              }).format(hijriDate);

              setHeaderDate(`${miladi} | ${hijri}`);
          } catch (e) {
              setHeaderDate(date.toLocaleDateString('ar-SA'));
          }
      };

      updateHeaderDate();
      window.addEventListener('nav-settings-updated', handleNavUpdate);
      return () => window.removeEventListener('nav-settings-updated', handleNavUpdate);
  }, []);

  const isAuthPage = location.pathname === '/auth';
  
  // Immersive Mode Logic: Hide nav when inside a Surah (Reader)
  const isReaderMode = location.pathname.startsWith('/quran/') && location.pathname !== '/quran';

  // Determine if we should show navigation
  const showNav = !isAuthPage && !isReaderMode;
  
  const showMiniPlayer = currentStation && showNav && location.pathname !== '/radio';

  // Helper to determine if we are in a detail view (to show back button on mobile)
  const isDetailView = !isAuthPage && !isReaderMode && (
                       location.pathname.startsWith('/category/') ||
                       (location.pathname.startsWith('/quran/') && location.pathname !== '/quran') || 
                       location.pathname === '/settings' ||
                       location.pathname === '/favorites' ||
                       location.pathname === '/stats' ||
                       location.pathname === '/names' || 
                       location.pathname === '/duas' ||
                       location.pathname === '/contact'
                       );

  const navTabs = activeNavIds.map(id => ALL_NAV_ITEMS[id]).filter(Boolean);

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] dark:bg-[#121212] transition-colors duration-200 font-arabic text-body text-gray-900 dark:text-dark-text">
      
      {/* --- DESKTOP SIDEBAR --- */}
      {showNav && (
        <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-white dark:bg-[#1E1E1E] border-l border-gray-100 dark:border-[#2A2A2A] z-50 shadow-sm">
            {/* Logo Area */}
            <div className="p-8 flex items-center gap-3">
            <Logo size={36} className="text-primary-600 dark:text-primary-500" />
            </div>
            
            {/* Nav Links */}
            <nav className="flex-1 px-4 space-y-2 py-4">
            {navTabs.map((item) => (
                <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                    flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 font-bold group
                    ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-gray-200'}
                `}
                >
                <div className={`transition-transform duration-200 group-hover:scale-110`}>
                    {item.icon}
                </div>
                <span className="text-base">{item.label}</span>
                {/* Active Indicator */}
                <NavLink to={item.path} className={({ isActive }) => `absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </NavLink>
            ))}
            </nav>

            {/* Theme Toggle */}
            <div className="p-6 border-t border-gray-100 dark:border-[#2A2A2A]">
            <button 
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-bold text-sm">{darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            </button>
            </div>
        </aside>
      )}

      {/* --- MAIN CONTENT --- */}
      <div className={`flex-1 flex flex-col min-h-screen relative max-w-full ${isAuthPage || isReaderMode ? 'h-screen overflow-hidden pb-0' : 'pb-24 md:pb-0'}`}>
        
        {/* Mobile Header (Only on Detail Views) */}
        {isDetailView && (
            <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#2A2A2A] px-4 py-3 flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full"
                >
                    <ArrowRight size={24} className="rtl:rotate-0" />
                </button>
                <div className="font-bold text-lg text-gray-800 dark:text-white">ريان</div>
                <div className="w-8"></div> {/* Spacer */}
            </header>
        )}

        {/* Desktop Header - Hide in auth or reader mode */}
        {showNav && (
            <header className="hidden md:flex sticky top-0 z-40 bg-[#F9FAFB]/95 dark:bg-[#121212]/95 backdrop-blur px-8 py-6 justify-between items-center border-b border-transparent">
                <div className="text-gray-400 dark:text-gray-500 font-medium text-sm flex items-center gap-2">
                    <Calendar size={16} />
                    {headerDate}
                </div>
            </header>
        )}

        {/* Adjust Main Container */}
        <main 
            className={`flex-1 w-full mx-auto transition-all duration-300 
            ${isAuthPage || isReaderMode
                ? 'p-0 max-w-full h-full overflow-y-auto overflow-x-hidden' 
                : 'p-4 md:p-8 max-w-7xl'
            }`}
        >
          <div className="animate-fadeIn w-full h-full">
            {children}
          </div>
        </main>

        {/* --- MOBILE BOTTOM TAB BAR --- */}
        {showNav && (
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
                <nav className="bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl border border-gray-200 dark:border-[#333] rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-black/50 px-2 py-2">
                    <div className="flex items-center justify-around">
                        {navTabs.slice(0, 5).map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center py-2 px-1 rounded-2xl w-full transition-all duration-300 relative
                                    ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* Background highlight for active tab */}
                                        <div className={`absolute inset-x-1 inset-y-1 bg-primary-50 dark:bg-primary-500/10 rounded-2xl transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}></div>
                                        
                                        <div className={`relative z-10 transition-all duration-300 ${isActive ? '-translate-y-1.5' : ''}`}>
                                            {item.icon}
                                        </div>
                                        
                                        <div className={`relative z-10 h-0 transition-all duration-300 ${isActive ? 'opacity-100 mt-0.5' : 'opacity-0'}`}>
                                            {isActive && (
                                                <span className="text-[10px] font-bold whitespace-nowrap animate-slideUp">
                                                    {item.label}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </div>
        )}

        {/* --- MINI PLAYER (Global) --- */}
        {showMiniPlayer && (
            <div 
                onClick={() => navigate('/radio')}
                className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:w-96 md:right-8 z-40 animate-slideUp cursor-pointer group"
            >
                <div className="bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl border border-gray-200 dark:border-[#333] rounded-2xl p-3 shadow-2xl flex items-center justify-between hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0 relative">
                             <div className="flex gap-0.5 h-4 items-end">
                                <div className={`w-1 bg-current rounded-sm ${isPlaying ? 'animate-[pulse_0.6s_ease-in-out_infinite]' : 'h-2'}`}></div>
                                <div className={`w-1 bg-current rounded-sm ${isPlaying ? 'animate-[pulse_0.8s_ease-in-out_infinite]' : 'h-3'}`}></div>
                                <div className={`w-1 bg-current rounded-sm ${isPlaying ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : 'h-1.5'}`}></div>
                             </div>
                        </div>
                        
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

                    <div className="flex items-center gap-2 pl-2 border-r border-gray-100 dark:border-gray-700 mr-2 pr-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#333] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-800 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all shadow-sm"
                        >
                            {isBuffering ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? (
                                <Pause size={18} fill="currentColor" />
                            ) : (
                                <Play size={18} fill="currentColor" className="ml-0.5" />
                            )}
                        </button>

                        <button 
                            onClick={stop}
                            className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 flex items-center justify-center transition-all shadow-sm"
                        >
                            <Square size={16} fill="currentColor" />
                        </button>
                    </div>

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
