import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText, ArrowLeft, Book, Bookmark } from 'lucide-react';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import DailySahabi from '../components/DailySahabi';
import SmartAzkarSuggestion from '../components/SmartAzkarSuggestion';
import AlKahfAlert from '../components/AlKahfAlert';
import * as quranService from '../services/quranService';
import { QURAN_META } from '../data/quranMeta';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [bookmark, setBookmark] = useState<quranService.Bookmark | null>(null);

  useEffect(() => {
    setBookmark(quranService.getBookmark());
  }, []);

  const handleContinueReading = () => {
    if (bookmark) {
      navigate(`/quran/${bookmark.surahNumber}`, { state: { scrollToAyah: bookmark.ayahNumber }});
    } else {
        navigate('/quran');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-10">
      <AlKahfAlert />
      
      <div className="text-center py-6 md:py-10 animate-fadeIn">
        <h1 className="text-h1 text-gray-800 dark:text-white mb-3 font-arabicHead">
          مرحباً بك في ريان
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-body-md md:text-body-lg font-arabic">
          رفيقك اليومي في الذكر والطاعة
        </p>
      </div>

      {/* Smart Suggestion Widget */}
      <SmartAzkarSuggestion />

      {/* Continue Reading Widget (If bookmark exists) */}
      {bookmark && (
        <div className="max-w-2xl mx-auto animate-slideUp mb-6">
            <button
                onClick={handleContinueReading}
                className="w-full bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-900/20 dark:to-dark-surface p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex items-center justify-between group hover:shadow-md transition-all text-right"
            >
                <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                         <Book size={24} />
                     </div>
                     <div>
                         <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-1">متابعة القراءة</h3>
                         <h2 className="font-bold text-lg text-gray-800 dark:text-white font-arabicHead">
                             سورة {QURAN_META[bookmark.surahNumber - 1].name} <span className="text-sm font-sans text-gray-400 mx-1">|</span> آية {bookmark.ayahNumber}
                         </h2>
                     </div>
                </div>
                <div className="text-emerald-500 group-hover:translate-x-[-4px] transition-transform">
                    <ArrowLeft size={20} className="rtl:rotate-0" />
                </div>
            </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto animate-slideUp grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quran Navigation Card */}
          <button
              onClick={() => navigate('/quran')}
              className="group relative w-full bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-300 text-right focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-[0.98] flex items-center justify-between gap-3 overflow-hidden"
          >
              <div className="flex items-center gap-4 relative z-10">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      <Book size={32} />
                  </div>
                  <div>
                      <h2 className="text-xl font-bold font-arabicHead text-gray-800 dark:text-white mb-1">
                          القرآن الكريم
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-arabic">
                          تلاوة واستماع
                      </p>
                  </div>
              </div>
          </button>

          {/* Hisn Al Muslim Main Navigation Card */}
          <button
              onClick={() => navigate('/duas')}
              className="group relative w-full bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-300 text-right focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-[0.98] flex items-center justify-between gap-3 overflow-hidden"
          >
              <div className="flex items-center gap-4 relative z-10">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                      <BookOpenText size={32} />
                  </div>
                  <div>
                      <h2 className="text-xl font-bold font-arabicHead text-gray-800 dark:text-white mb-1">
                          حصن المسلم
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-arabic">
                          أذكار وأدعية
                      </p>
                  </div>
              </div>
          </button>
      </div>

      {/* Daily Widgets Section */}
      <div className="max-w-2xl mx-auto mt-12 mb-12 space-y-8">
          <RandomNameCard />
          <DailyWisdom />
          <DailySahabi />
      </div>
    </div>
  );
};

export default Home;
