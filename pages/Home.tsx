
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
    ? AZKAR_DATA.filter(item => {
        const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
        const normalizedText = normalizeArabic(item.text);
        const normalizedBenefit = item.benefit ? normalizeArabic(item.benefit) : '';
        const normalizedSource = item.source ? normalizeArabic(item.source) : '';

        // Check if query exists in text (exact match normalized)
        // OR break query into words and check if ALL words exist in text (fuzzy sentence match)
        const queryWords = normalizedQuery.split(' ').filter(w => w.trim().length > 0);
        
        const textMatch = queryWords.every(word => normalizedText.includes(word));
        const benefitMatch = queryWords.every(word => normalizedBenefit.includes(word));
        
        return textMatch || benefitMatch || normalizedSource.includes(normalizedQuery);
      }).slice(0, 10) // Limit results
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
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-4 pr-11 text-base rounded-2xl border-none bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-primary-400 placeholder-gray-400 dark:text-white transition-shadow"
          placeholder="ابحث عن ذكر، دعاء، أو كلمة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results or Categories */}
      {searchQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">نتائج البحث ({filteredAzkar.length})</h3>
             {filteredAzkar.length > 0 && (
               <span className="text-xs text-gray-400">تظهر أفضل 10 نتائج</span>
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
                className="mt-6 px-6 py-2 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-medium"
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
                relative flex items-center p-4 md:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md
                ${cat.color} group
              `}
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
