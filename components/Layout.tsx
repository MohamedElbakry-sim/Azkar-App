
import React from 'react';
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { Home, Heart, Activity, Moon, Sun, ArrowRight, BarChart2, Settings, Clock, Scroll, Mail, MessageCircle } from 'lucide-react';
import { CATEGORIES } from '../data';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  
  // Hide navigation elements when inside a category for immersive reading
  const isCategoryView = location.pathname.startsWith('/category/');

  // Determine page title based on route
  let pageTitle = 'حصن المسلم';
  const categoryMatch = matchPath('/category/:id', location.pathname);
  if (categoryMatch) {
    const currentCategory = CATEGORIES.find(c => c.id === categoryMatch.params.id);
    if (currentCategory) {
      pageTitle = currentCategory.title;
    }
  }

  const navItems = [
    { path: '/', icon: <Home size={22} />, label: 'الرئيسية' },
    { path: '/prayers', icon: <Clock size={22} />, label: 'المواقيت' },
    { path: '/tasbeeh', icon: <Activity size={22} />, label: 'السبحة' },
    { path: '/names', icon: <Scroll size={22} />, label: 'الأسماء' },
    { path: '/stats', icon: <BarChart2 size={22} />, label: 'إحصائيات' },
    { path: '/favorites', icon: <Heart size={22} />, label: 'المفضلة' },
    { path: '/settings', icon: <Settings size={22} />, label: 'إعدادات' },
    { path: '/contact', icon: <Mail size={22} />, label: 'تواصل معنا' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      
      {/* Desktop Sidebar Navigation */}
      {!isCategoryView && (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-dark-surface border-l border-gray-100 dark:border-dark-border z-50 transition-colors shadow-sm">
          <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-dark-border">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-xl">
               <Logo size={32} className="text-primary-600 dark:text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight font-serif">نور</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg hover:text-gray-900 dark:hover:text-gray-200'}
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
              className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={darkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-medium">{darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative max-w-full">
        
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-gray-100 dark:border-dark-border px-4 py-3 flex items-center justify-between transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            {!isHome && (
              <button onClick={() => navigate('/')} className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full active:scale-95 transition-transform" aria-label="رجوع">
                <ArrowRight size={24} />
              </button>
            )}
            <div className="flex items-center gap-2">
                <Logo size={28} className="text-primary-600 dark:text-primary-500" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-white font-serif mt-1">نور</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/contact')}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="تواصل معنا"
            >
              <MessageCircle size={22} />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={darkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </header>

        {/* Desktop Header Spacer / Title Bar */}
        <header className="hidden md:flex sticky top-0 z-40 bg-gray-50/90 dark:bg-dark-bg/90 backdrop-blur px-8 py-6 justify-between items-center">
            {/* Page title depending on category */}
            <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">
               {!isHome && pageTitle}
            </div>
            
             {/* Back button for desktop sub-pages */}
             {!isHome && (
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-surface rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="رجوع للصفحة الرئيسية"
              >
                <ArrowRight size={18} />
                <span>الرئيسية</span>
              </button>
            )}
        </header>

        <main className="flex-1 p-4 md:p-8 w-full">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {!isCategoryView && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border px-2 py-2 pb-safe z-40 transition-colors shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center pb-1">
              {navItems.filter(item => item.path !== '/contact').map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[50px] focus:outline-none focus:ring-2 focus:ring-primary-500
                    ${isActive 
                      ? 'text-primary-700 dark:text-primary-400 scale-105 bg-primary-50 dark:bg-primary-900/10' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
                  `}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}
        
        {/* Bottom spacer for mobile nav */}
        {!isCategoryView && <div className="h-20 md:hidden"></div>}
      </div>
    </div>
  );
};

export default Layout;
