
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText, ArrowLeft } from 'lucide-react';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import DailySahabi from '../components/DailySahabi';
import SmartAzkarSuggestion from '../components/SmartAzkarSuggestion';
import AlKahfAlert from '../components/AlKahfAlert';

/**
 * Home Page Component.
 * 
 * The main landing page of the application. It acts as a dashboard displaying:
 * 1. Alerts (e.g., Al-Kahf on Fridays).
 * 2. Smart Azkar Suggestions based on time/location.
 * 3. Primary navigation to "Hisn Al Muslim" (The Fortress of the Muslim).
 * 4. Daily widgets: Names of Allah, Daily Wisdom (Verse/Hadith), and Sahabi of the Day.
 * 
 * Note: Search functionality has been moved to the 'Duas' (Hisn Al Muslim) page.
 * 
 * @component
 * @returns {JSX.Element} The rendered Home page.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-10">
      <AlKahfAlert />
      
      <div className="text-center py-6 md:py-10 animate-fadeIn">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">
          مرحباً بك في ريان
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
          رفيقك اليومي في الذكر والطاعة
        </p>
      </div>

      {/* Smart Suggestion Widget */}
      <SmartAzkarSuggestion />

      <div className="max-w-2xl mx-auto animate-slideUp">
          {/* Hisn Al Muslim Main Navigation Card */}
          <button
              onClick={() => navigate('/duas')}
              className="group relative w-full bg-white dark:bg-dark-surface p-8 rounded-3xl border border-gray-100 dark:border-dark-border shadow-md hover:shadow-lg transition-all duration-300 text-right focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-[0.98] flex items-center justify-between gap-5 overflow-hidden"
              aria-label="حصن المسلم - جميع الأذكار والأدعية"
          >
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-l from-primary-50/50 to-transparent dark:from-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              <div className="flex items-center gap-6 relative z-10">
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                      <BookOpenText size={40} />
                  </div>
                  <div>
                      <h3 className="text-2xl font-bold font-serif text-gray-800 dark:text-white mb-2">
                          حصن المسلم
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                          ابحث في الأذكار، الأدعية، والمناسبات
                      </p>
                  </div>
              </div>
              
              <div className="pl-2 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors relative z-10">
                  <ArrowLeft size={28} className="rtl:rotate-0" />
              </div>
          </button>
      </div>

      {/* Daily Widgets Section */}
      <div className="max-w-2xl mx-auto mt-16 mb-12 space-y-10 md:space-y-10">
          <RandomNameCard />
          <DailyWisdom />
          <DailySahabi />
      </div>
    </div>
  );
};

export default Home;
