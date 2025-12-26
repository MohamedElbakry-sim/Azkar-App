
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import DailySahabi from '../components/DailySahabi';
import SmartAzkarSuggestion from '../components/SmartAzkarSuggestion';
import AlKahfAlert from '../components/AlKahfAlert';
import PrayerSummaryCard from '../components/PrayerSummaryCard';
import { Sun, Moon, Pin, ChevronLeft, Bookmark, Sparkles, BookOpen } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import * as storage from '../services/storage';

const HomeSkeleton = () => (
    <div className="space-y-8 animate-pulse px-2">
        <div className="flex justify-between items-center py-4">
            <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-dark-elevated rounded-xl w-40" />
                <div className="h-4 bg-gray-100 dark:bg-dark-surface rounded-lg w-60" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-dark-elevated rounded-2xl" />
        </div>
        <div className="h-32 bg-gray-100 dark:bg-dark-surface rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="h-40 bg-gray-100 dark:bg-dark-surface rounded-[2.5rem]" />
                <div className="h-60 bg-gray-100 dark:bg-dark-surface rounded-[2.5rem]" />
            </div>
            <div className="space-y-6">
                <div className="h-64 bg-gray-100 dark:bg-dark-surface rounded-[2.5rem]" />
                <div className="h-64 bg-gray-100 dark:bg-dark-surface rounded-[2.5rem]" />
            </div>
        </div>
    </div>
);

interface HomeProps {
    darkMode?: boolean;
    onToggleTheme?: () => void;
}

const Home: React.FC<HomeProps> = ({ darkMode, onToggleTheme }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pinnedItems, setPinnedItems] = useState<storage.PinnedItem[]>([]);

  useEffect(() => {
    // Simulate initial loading for perceived performance stability
    const timer = setTimeout(() => {
        setPinnedItems(storage.getPinnedItems());
        setLoading(false);
    }, 600);

    const handlePinsUpdate = () => {
        setPinnedItems(storage.getPinnedItems());
    };
    window.addEventListener('pins-updated', handlePinsUpdate);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('pins-updated', handlePinsUpdate);
    };
  }, []);

  const handleThemeToggle = async () => {
    if (onToggleTheme) onToggleTheme();
    
    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) {}
    }
  };

  if (loading) return <HomeSkeleton />;

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      <AlKahfAlert />
      
      {/* Welcome Header */}
      <div className="flex justify-between items-start px-2 pt-2 gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-arabicHead mb-2">
            السلام عليكم
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-arabic">
            طبت وطاب يومك بذكر الله
            </p>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
            <button 
                onClick={handleThemeToggle}
                className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-dark-panel rounded-2xl flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-soft border border-gray-100 dark:border-dark-border transition-all active:scale-90 hover:shadow-md"
                title={darkMode ? "تبديل للوضع النهاري" : "تبديل للوضع الليلي"}
            >
                <div className="relative w-6 h-6 flex items-center justify-center">
                    <Sun className={`absolute transition-all duration-500 transform ${darkMode ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
                    <Moon className={`absolute transition-all duration-500 transform ${darkMode ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'}`} />
                </div>
            </button>
        </div>
      </div>

      {/* Pinned Content Section */}
      {pinnedItems.length > 0 && (
          <div className="space-y-4 px-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Pin size={16} className="rotate-45" />
                  <h3 className="text-sm font-bold font-arabicHead uppercase tracking-wider">الوصول السريع</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {pinnedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="flex-shrink-0 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-4 flex items-center gap-4 min-w-[160px] md:min-w-[200px] hover:border-primary-300 dark:hover:border-primary-800 transition-all shadow-sm group"
                      >
                          <div className={`p-2.5 rounded-xl transition-colors ${item.type === 'quran' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'}`}>
                              {item.type === 'quran' ? <BookOpen size={20} /> : item.type === 'azkar' ? <Sparkles size={20} /> : <Bookmark size={20} />}
                          </div>
                          <div className="text-right">
                              <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">{item.type === 'quran' ? 'سورة' : 'ذكر'}</span>
                              <span className="font-bold text-gray-800 dark:text-white font-arabicHead whitespace-nowrap">{item.title}</span>
                          </div>
                          <ChevronLeft size={16} className="text-gray-300 group-hover:text-primary-500 mr-auto transition-colors rtl:rotate-0" />
                      </button>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              <PrayerSummaryCard />
              <SmartAzkarSuggestion />
              <div className="space-y-4">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white px-2 font-arabicHead flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
                    قطوف اليوم
                 </h3>
                 <DailyWisdom />
              </div>
          </div>
          <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                 <RandomNameCard />
                 <DailySahabi />
              </div>
          </div>
      </div>
    </div>
  );
};

export default Home;
