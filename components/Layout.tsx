
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { Home, Heart, Moon, Sun, ArrowRight, BarChart2, Settings, Clock, Sparkles, Mail, Menu, X, ListTodo, BookOpenText } from 'lucide-react';
import { CATEGORIES } from '../data';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

/**
 * Custom SVG component for the Tasbeeh/Rosary icon.
 */
export const TasbeehIcon = ({ size = 24, className = "" }: {size?: number, className?: string}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* The Beads Loop (Dashed Circle) */}
    <circle 
      cx="12" 
      cy="13" 
      r="8" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeDasharray="1 3.5" 
      strokeLinecap="round" 
    />
    {/* The Imam/Tassel Top */}
    <path 
      d="M12 5V2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    <path 
      d="M9.5 2H14.5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
  </svg>
);

/**
 * Custom SVG component for the Allah (God) name calligraphy icon.
 */
export const AllahIcon = ({ size = 24, className = "" }: {size?: number, className?: string}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
     <text 
       x="12" 
       y="19" 
       textAnchor="middle" 
       fontSize="19" 
       fontFamily="IBM Plex Sans Arabic, sans-serif" 
       fontWeight="bold" 
       fill="currentColor"
     >
       الله
     </text>
  </svg>
);

/**
 * Main Layout component wrapper for the application.
 * Handles responsive navigation (sidebar/hamburger), theming, and layout structure.
 */
const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHome = location.pathname === '/';
  
  // Hide navigation elements when inside a category for immersive reading
  const isCategoryView = location.pathname.startsWith('/category/');

  // Determine page title based on route
  let pageTitle = 'ريان';
  const categoryMatch = matchPath('/category/:id', location.pathname);
  if (categoryMatch) {
    const currentCategory = CATEGORIES.find(c => c.id === categoryMatch.params.id);
    if (currentCategory) {
      pageTitle = currentCategory.title;
    }
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: <Home size={22} />, label: 'الرئيسية' },
    { path: '/prayers', icon: <Clock size={22} />, label: 'مواقيت الصلاة' },
    { path: '/tasbeeh', icon: <TasbeehIcon size={22} />, label: 'السبحة' },
    { path: '/names', icon: <AllahIcon size={24} />, label: 'أسماء الله الحسني' },
    { path: '/duas', icon: <BookOpenText size={22} />, label: 'حصن المسلم' },
    { path: '/qada', icon: <ListTodo size={22} />, label: 'الصلوات الفائتة' },
    { path: '/stats', icon: <BarChart2 size={22} />, label: 'إحصائيات' },
    { path: '/favorites', icon: <Heart size={22} />, label: 'المفضلة' },
    { path: '/settings', icon: <Settings size={22} />, label: 'إعدادات' },
    { path: '/contact', icon: <Mail size={22} />, label: 'تواصل معنا' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg transition-colors duration-300 font-arabic">
      
      {/* Desktop Sidebar Navigation */}
      {!isCategoryView && (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-dark-panel border-l border-gray-100 dark:border-dark-border z-50 transition-colors shadow-sm">
          <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-dark-border">
            <div className="p-1">
               <Logo size={60} className="text-primary-600 dark:text-primary-500" />
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-btn focus:outline-none focus:ring-2 focus:ring-primary-500
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-dark-text border-r-2 border-primary-500' 
                    : 'text-gray-500 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-elevated hover:text-gray-900 dark:hover:text-dark-text'}
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-dark-border">
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-500 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-btn"
              aria-label={darkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative max-w-full">
        
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-dark-panel/90 backdrop-blur-md border-b border-gray-100 dark:border-dark-border px-4 py-3 flex items-center justify-between transition-colors shadow-sm relative">
          {/* Left Side: Navigation/Back */}
          <div className="flex items-center gap-3 z-10">
            {!isHome && !isCategoryView ? (
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -mr-2 text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-full active:scale-95 transition-transform" 
                aria-label="رجوع"
              >
                <ArrowRight size={24} />
              </button>
            ) : (
               // Hamburger Menu Button
               <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -mr-2 text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-full active:scale-95 transition-transform"
                aria-label="القائمة"
               >
                 <Menu size={24} />
               </button>
            )}
          </div>
          
          {/* Center: Logo (Absolute) */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <Logo size={50} className="text-primary-600 dark:text-primary-500" />
          </div>
          
          {/* Right Side: Actions */}
          <div className="flex items-center gap-1 z-10">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-dark-secondary hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={darkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer (Hamburger Menu) */}
        {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>

                {/* Drawer Content */}
                <div className="relative w-4/5 max-w-[300px] h-full bg-white dark:bg-dark-panel shadow-2xl flex flex-col animate-slideRight border-l border-gray-200 dark:border-dark-border">
                    <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-dark-border">
                        <div className="flex items-center gap-3">
                            <Logo size={60} className="text-primary-600 dark:text-primary-500" />
                        </div>
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-full dark:text-dark-secondary"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => `
                                flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-h4
                                ${isActive 
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-dark-text' 
                                    : 'text-gray-600 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-elevated'}
                                `}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="p-5 border-t border-gray-100 dark:border-dark-border">
                        <div className="flex items-center justify-center gap-2 text-caption text-gray-400 dark:text-dark-muted font-english">
                             <span>Version 1.4.0</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Desktop Header Spacer / Title Bar */}
        <header className="hidden md:flex sticky top-0 z-40 bg-gray-50/90 dark:bg-dark-bg/90 backdrop-blur px-8 py-6 justify-between items-center">
            {/* Page title depending on category */}
            <div className="text-body-sm text-gray-400 dark:text-dark-muted font-medium">
               {!isHome && pageTitle}
            </div>
            
             {/* Back button for desktop sub-pages */}
             {!isHome && (
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 px-4 py-2 text-btn text-gray-600 dark:text-dark-secondary hover:bg-gray-200 dark:hover:bg-dark-elevated rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="رجوع"
              >
                <ArrowRight size={18} />
                <span>رجوع</span>
              </button>
            )}
        </header>

        <main className="flex-1 p-4 md:p-8 w-full">
          {/* Animated Page Transition Wrapper */}
          <div className="animate-slideUp w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
