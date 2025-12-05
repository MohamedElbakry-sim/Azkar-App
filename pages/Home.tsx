
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, AZKAR_DATA } from '../data';
import { ChevronLeft, Sunrise, Sunset, Moon, Sun, BookHeart, Search, X, AlertCircle } from 'lucide-react';
import DhikrCard from '../components/DhikrCard';
import * as storage from '../services/storage';
import { normalizeArabic } from '../utils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>(storage.getFavorites());

  const getIcon = (name: string) => {
    switch (name) {
      case 'sunrise': return <Sunrise size={32} strokeWidth={1.5} />;
      case 'sunset': return <Sunset size={32} strokeWidth={1.5} />;
      case 'moon': return <Moon size={32} strokeWidth={1.5} />;
      case 'sun': return <Sun size={32} strokeWidth={1.5} />;
      case 'prayer': return <BookHeart size={32} strokeWidth={1.5} />;
      default: return <Sun size={32} strokeWidth={1.5} />;
    }
  };

  const filteredAzkar = searchQuery.trim().length > 0 
    ? AZKAR_DATA
        .map(item => {
           let score = 0;
           const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
           const normalizedText = normalizeArabic(item.text);
           const normalizedBenefit = item.benefit ? normalizeArabic(item.benefit) : '';
           const normalizedSource = item.source ? normalizeArabic(item.source) : '';
           
           const queryWords = normalizedQuery.split(' ').filter(w => w.trim().length > 0);
           
           // Calculate matches for each field
           const textMatches = queryWords.filter(w => normalizedText.includes(w)).length;
           const benefitMatches = queryWords.filter(w => normalizedBenefit.includes(w)).length;
           const sourceMatches = queryWords.filter(w => normalizedSource.includes(w)).length;

           // STRICT MODE: All words must appear somewhere in the item (AND logic)
           // This ensures relevance. If you type "Morning Prayer", you don't want everything with just "Morning".
           const isMatch = queryWords.every(w => 
             normalizedText.includes(w) || 
             normalizedBenefit.includes(w) || 
             normalizedSource.includes(w)
           );

           if (isMatch) {
              // Base score for match
              score += 100;
              
              // Relevance Boosting
              score += textMatches * 20; // Text matches are more valuable
              score += benefitMatches * 10; // Benefit matches are secondary
              score += sourceMatches * 5; 
              
              // Exact Phrase Bonus (Very High)
              if (normalizedText.includes(normalizedQuery)) score += 50;
              if (normalizedText.startsWith(normalizedQuery)) score += 30; // Starts with query

              return { item, score };
           }
           
           return null;
        })
        .filter((result): result is { item: typeof AZKAR_DATA[0], score: number } => result !== null)
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .map(result => result.item)
        .slice(0, 20) // Limit results
    : [];

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      <div className="text-center py-6 md:py-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">حصن المسلم</h2>
        <p className="text-gray-500 dark:text-gray-400 md:text-lg">اختر الأذكار التي تريد قراءتها الآن</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto mb-8">
        <label htmlFor="search-input" className="sr-only">ابحث عن ذكر</label>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id="search-input"
          type="text"
          className="block w-full p-4 pr-11 text-base rounded-2xl border-none bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-primary-400 placeholder-gray-400 dark:text-white transition-shadow"
          placeholder="ابحث عن ذكر، دعاء، أو كلمة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
              <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-full mb-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              className={`
                relative flex items-center p-4 md:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500
                ${cat.color} group
              `}
              aria-label={`قسم ${cat.title}. ${cat.description}`}
            >
              <div className="ml-4 p-3 bg-white/20 rounded-xl transition-transform group-hover:rotate-6">
                {getIcon(cat.icon)}
              </div>
              <div className="flex-1 text-right">
                <h3 className="text-lg md:text-xl font-bold mb-1">{cat.title}</h3>
                <p className="text-sm md:text-base opacity-80">{cat.description}</p>
              </div>
              <ChevronLeft size={24} className="opacity-50 transition-transform group-hover:-translate-x-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
