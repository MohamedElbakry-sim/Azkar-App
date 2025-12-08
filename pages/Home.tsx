
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, AZKAR_DATA } from '../data';
import { ChevronLeft, Search, X, AlertCircle } from 'lucide-react';
import DhikrCard from '../components/DhikrCard';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import * as storage from '../services/storage';
import { normalizeArabic } from '../utils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>(storage.getFavorites());
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Advanced Search Logic with Memoization
  const filteredAzkar = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];

    const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

    return AZKAR_DATA
      .filter(item => activeCategory ? item.category === activeCategory : true)
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
  }, [searchQuery, activeCategory]);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  const displayedCategories = activeCategory 
    ? CATEGORIES.filter(c => c.id === activeCategory)
    : CATEGORIES;

  // Logic to show filters: if search is focused, or there is text, or a category is selected
  const showFilters = isSearchFocused || searchQuery.length > 0 || activeCategory !== null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center py-6 md:py-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">حصن المسلم</h2>
        <p className="text-gray-500 dark:text-gray-400 md:text-lg">اختر الأذكار التي تريد قراءتها الآن</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto mb-4">
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
            // Delay hide to allow click on filter chips to register
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

      {/* Filter Chips - Only visible when interacting with search */}
      <div 
        className={`max-w-xl mx-auto transition-all duration-300 overflow-hidden ease-in-out ${showFilters ? 'max-h-20 opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}
      >
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`
              px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200
              ${activeCategory === null 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-dark-border'}
            `}
          >
            الكل
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
              className={`
                px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200
                ${activeCategory === cat.id 
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-dark-border'}
              `}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results or Categories */}
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
              {activeCategory && <p className="text-primary-500 mt-1 text-sm font-medium">في قسم: {CATEGORIES.find(c => c.id === activeCategory)?.title}</p>}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayedCategories.map((cat) => {
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/category/${cat.id}`)}
                className={`
                  relative flex items-end p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl
                  group focus:outline-none focus:ring-2 focus:ring-primary-500 overflow-hidden h-40 md:h-48
                `}
                aria-label={`قسم ${cat.title}`}
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                   {cat.imageUrl && (
                     <img 
                       src={cat.imageUrl} 
                       alt="" 
                       loading="lazy"
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                     />
                   )}
                   {/* Gradient Overlay */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content (z-10 to sit above image) */}
                <div className="relative z-10 flex w-full justify-between items-center">
                   <div className="text-right">
                      <h3 className="text-2xl font-bold text-white mb-1 shadow-sm font-serif">{cat.title}</h3>
                      <p className="text-gray-200 text-xs md:text-sm font-medium opacity-90">{cat.description}</p>
                   </div>
                   <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                      <ChevronLeft size={24} />
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Random Name and Daily Wisdom Widgets (Only if no search and no specific category selected) */}
      {!searchQuery && !activeCategory && (
        <div className="max-w-2xl mx-auto mt-16 mb-12 space-y-10 md:space-y-10">
            <RandomNameCard />
            <DailyWisdom />
        </div>
      )}
    </div>
  );
};

export default Home;
