
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AZKAR_DATA, CATEGORIES } from '../data';
import { Search, X, AlertCircle, BookOpenText, ArrowLeft } from 'lucide-react';
import DhikrCard from '../components/DhikrCard';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import DailySahabi from '../components/DailySahabi';
import SmartAzkarSuggestion from '../components/SmartAzkarSuggestion';
import * as storage from '../services/storage';
import { normalizeArabic } from '../utils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>(storage.getFavorites());
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Advanced Search Logic with Memoization
  const filteredAzkar = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];

    const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

    return AZKAR_DATA
      .map(item => {
          let score = 0;
          const normalizedText = normalizeArabic(item.text);
          const normalizedBenefit = item.benefit ? normalizeArabic(item.benefit) : '';
          const normalizedSource = item.source ? normalizeArabic(item.source) : '';

          // 1. Exact Phrase Match (Highest Priority)
          if (normalizedText.includes(normalizedQuery)) score += 100;
          if (normalizedSource.includes(normalizedQuery)) score += 80;

          // 2. Word Scoring
          let matchedWordsCount = 0;
          queryWords.forEach(word => {
            let wordMatch = false;
            // Text Match
            if (normalizedText.includes(word)) {
              score += 20;
              wordMatch = true;
            }
            // Source Match
            if (normalizedSource.includes(word)) {
              score += 15;
              wordMatch = true;
            }
            // Benefit Match (Lower priority)
            if (normalizedBenefit.includes(word)) {
              score += 5;
              wordMatch = true;
            }

            if (wordMatch) matchedWordsCount++;
          });

          // 3. Completeness Bonus (If all typed words exist somewhere in the item)
          if (matchedWordsCount === queryWords.length && queryWords.length > 0) {
            score += 50;
          }

          return { item, score };
      })
      .filter(result => result.score > 0) // Remove items with 0 score
      .sort((a, b) => b.score - a.score) // Sort highest score first
      .map(result => result.item)
      .slice(0, 50); // Limit results for performance
  }, [searchQuery]);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      <div className="text-center py-6 md:py-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">إختر الأذكار التي تريد قراءتها</h2>
      </div>

      {/* Sticky Search Section */}
      <div className="sticky top-0 z-30 pt-2 pb-1 -mx-4 px-4 md:mx-0 md:px-0 bg-gray-50/95 dark:bg-dark-bg/95 backdrop-blur-md transition-all duration-300">
        <div className="max-w-xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-3">
            <label htmlFor="search-input" className="sr-only">ابحث عن ذكر</label>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="search-input"
              type="text"
              className="block w-full p-4 pr-11 text-base rounded-2xl border-none bg-white dark:bg-dark-surface shadow-sm focus:ring-2 focus:ring-primary-400 placeholder-gray-400 dark:text-white transition-shadow"
              placeholder="ابحث عن ذكر، دعاء، أو كلمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:text-primary-500"
                aria-label="مسح البحث"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Smart Suggestion (Only show when not searching) */}
      {!searchQuery && <SmartAzkarSuggestion />}

      {/* Search Results or Hisn Al Muslim */}
      {searchQuery ? (
        <div className="space-y-4" role="region" aria-label="نتائج البحث">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300" aria-live="polite">
               {filteredAzkar.length > 0 ? `نتائج البحث (${filteredAzkar.length})` : 'لا توجد نتائج'}
             </h3>
             {filteredAzkar.length > 0 && (
               <span className="text-xs text-gray-400">تظهر أفضل النتائج</span>
             )}
          </div>
          
          {filteredAzkar.length > 0 ? (
            <div className="space-y-6">
              {filteredAzkar.map(item => (
                <DhikrCard
                  key={item.id}
                  item={item}
                  isFavorite={favorites.includes(item.id)}
                  initialCount={0}
                  onToggleFavorite={handleToggleFavorite}
                  highlightQuery={searchQuery}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
              <div className="bg-gray-100 dark:bg-dark-surface p-6 rounded-full mb-4">
                 <AlertCircle size={48} className="text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-600 dark:text-gray-300">لا توجد نتائج مطابقة لـ "{searchQuery}"</p>
              <p className="text-gray-400 mt-2 text-sm">حاول البحث باستخدام كلمات مختلفة أو تأكد من الكتابة الصحيحة</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                مسح البحث
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
            {/* Hisn Al Muslim Main Card */}
            <button
                onClick={() => navigate('/duas')}
                className="group relative w-full bg-white dark:bg-dark-surface p-8 rounded-3xl border border-gray-100 dark:border-dark-border shadow-md hover:shadow-lg transition-all duration-300 text-right focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-[0.98] flex items-center justify-between gap-5 overflow-hidden"
                aria-label="حصن المسلم - جميع الأذكار والأدعية"
            >
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
                            أذكار الصباح، المساء، النوم، الصلاة، وكافة الأدعية
                        </p>
                    </div>
                </div>
                
                <div className="pl-2 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors relative z-10">
                    <ArrowLeft size={28} className="rtl:rotate-0" />
                </div>
            </button>
        </div>
      )}

      {/* Widgets (Only if no search) */}
      {!searchQuery && (
        <div className="max-w-2xl mx-auto mt-16 mb-12 space-y-10 md:space-y-10">
            <RandomNameCard />
            <DailyWisdom />
            <DailySahabi />
        </div>
      )}
    </div>
  );
};

export default Home;
