import React from 'react';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import DailySahabi from '../components/DailySahabi';
import SmartAzkarSuggestion from '../components/SmartAzkarSuggestion';
import AlKahfAlert from '../components/AlKahfAlert';
import PrayerSummaryCard from '../components/PrayerSummaryCard';
import { Sun, Moon } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface HomeProps {
    darkMode?: boolean;
    onToggleTheme?: () => void;
}

const Home: React.FC<HomeProps> = ({ darkMode, onToggleTheme }) => {
  const handleThemeToggle = async () => {
    if (onToggleTheme) onToggleTheme();
    
    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) {}
    }
  };

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
        
        {/* Theme Toggle: Hidden on mobile as it's available in the top bar */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Prayer Times Summary (New) */}
              <PrayerSummaryCard />

              {/* Smart Suggestion */}
              <SmartAzkarSuggestion />

              {/* Daily Wisdom Section */}
              <div className="space-y-4">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white px-2 font-arabicHead flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
                    قطوف اليوم
                 </h3>
                 <DailyWisdom />
              </div>
          </div>

          {/* Side Column (1/3) - Desktop / Bottom - Mobile */}
          <div className="space-y-6">
              {/* Discovery Cards */}
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