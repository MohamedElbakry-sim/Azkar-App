import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITUATIONAL_DUAS, CATEGORIES, AZKAR_DATA } from '../data';
import { ArrowRight, Copy, Check, Share2, BookOpenText, Search, X, AlertCircle, Heart } from 'lucide-react';
import { DuaCategory, Category } from '../types';
import * as storage from '../services/storage';
import DhikrCard from '../components/DhikrCard';
import { normalizeArabic } from '../utils';

/**
 * Duas (Hisn Al Muslim) Page Component.
 * 
 * This page serves as the central library for all Azkar and Duas.
 * It features:
 * 1. A global search bar to find categories or specific texts.
 * 2. A grid view of all categories (Standard Time-based & Situational).
 * 3. A detailed view for situational dua categories.
 * 
 * @component
 * @returns {JSX.Element} The rendered Duas page.
 */
const Duas: React.FC = () => {
  const navigate = useNavigate();
  
  // -- State Management --
  const [selectedCategory, setSelectedCategory] = useState<DuaCategory | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Load favorites for the DhikrCards in search results
  useEffect(() => {
    setFavorites(storage.getFavorites());
  }, []);

  /**
   * Handles toggling the favorite status of a Dhikr item.
   * @param {number} dhikrId - The unique ID of the Dhikr.
   */
  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  /**
   * Copies text to the clipboard and shows a temporary success state.
   * @param {string} text - The text to copy.
   * @param {number} index - The index of the item to show the checkmark on.
   */
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  /**
   * Uses the Web Share API to share text, falling back to clipboard copy.
   * @param {string} text - The text to share.
   */
  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'دعاء',
          text: `${text}\n\nتطبيق ريان`,
        });
      } catch (err) {
        // Shared cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('تم نسخ الدعاء');
    }
  };

  /**
   * Handles navigation when a category card is clicked.
   * If it's a Standard Category (e.g., Morning Azkar), navigates to its dedicated page.
   * If it's a Situational Category (e.g., Travel), opens it inline.
   * @param {DuaCategory | Category} item - The category object.
   */
  const handleItemClick = (item: DuaCategory | Category) => {
      // Check if it's a standard category (has 'theme' property)
      if ('theme' in item) {
          navigate(`/category/${item.id}`);
      } else {
          // Clear search query so the view switches to the selected category
          setSearchQuery('');
          setSelectedCategory(item as DuaCategory);
      }
  };

  /**
   * Generates a deterministic ID for situational duas based on their position.
   * Formula: 90000 + (CategoryIndex * 1000) + ItemIndex
   * This prevents collision with standard Azkar IDs (100-1000).
   */
  const generateSituationalId = (catIndex: number, itemIndex: number) => {
      return 90000 + (catIndex * 1000) + itemIndex;
  };

  /**
   * Memoized Search Logic.
   * Filters Categories and Individual Items based on the search query.
   * Uses a scoring system to prioritize exact matches.
   */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

    // 1. Filter Categories (Titles matching)
    const matchedCategories = [...CATEGORIES, ...SITUATIONAL_DUAS].filter(cat => {
        const normTitle = normalizeArabic(cat.title);
        return normTitle.includes(normalizedQuery);
    });

    // 2. Filter Standard Azkar (from AZKAR_DATA)
    const matchedAzkar = AZKAR_DATA
      .map(item => {
          let score = 0;
          const normalizedText = normalizeArabic(item.text);
          const normalizedSource = item.source ? normalizeArabic(item.source) : '';

          if (normalizedText.includes(normalizedQuery)) score += 100;
          if (normalizedSource.includes(normalizedQuery)) score += 80;

          let matchedWordsCount = 0;
          queryWords.forEach(word => {
            if (normalizedText.includes(word)) { score += 20; matchedWordsCount++; }
            if (normalizedSource.includes(word)) { score += 15; matchedWordsCount++; }
          });

          if (matchedWordsCount === queryWords.length && queryWords.length > 0) score += 50;

          return { item, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.item);

    // 3. Filter Situational Duas (Flattened)
    const matchedSituational: { item: any, category: string, id: number }[] = [];
    SITUATIONAL_DUAS.forEach((cat, cIdx) => {
        cat.items.forEach((dua, dIdx) => {
            const normText = normalizeArabic(dua.text);
            if (normText.includes(normalizedQuery)) {
                const id = generateSituationalId(cIdx, dIdx);
                matchedSituational.push({ item: dua, category: cat.title, id });
            }
        });
    });

    return {
        categories: matchedCategories,
        azkar: matchedAzkar,
        situational: matchedSituational
    };
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* Sticky Search Bar Container */}
      <div className="sticky top-0 z-30 pt-4 pb-2 transition-all duration-300">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <label htmlFor="duas-search" className="sr-only">ابحث في حصن المسلم</label>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="duas-search"
              type="text"
              className="block w-full p-4 pr-11 text-base rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface shadow-md focus:ring-2 focus:ring-primary-400 placeholder-gray-400 dark:text-white transition-all font-arabic"
              placeholder="ابحث عن ذكر، دعاء، أو شعور..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                aria-label="مسح البحث"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- Search Results View --- */}
      {searchQuery && searchResults ? (
          <div className="space-y-8 animate-fadeIn">
              {/* 1. Matched Categories */}
              {searchResults.categories.length > 0 && (
                  <div>
                      <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-4 px-2 font-arabicHead">الأقسام</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {searchResults.categories.map((cat: any) => (
                              <button
                                  key={cat.id}
                                  onClick={() => handleItemClick(cat)}
                                  className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:border-primary-300 transition-colors text-center"
                              >
                                  <span className="font-bold text-gray-800 dark:text-gray-100 font-arabicHead">{cat.title}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {/* 2. Matched Standard Azkar */}
              {searchResults.azkar.length > 0 && (
                  <div>
                      <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-4 px-2 font-arabicHead">الأذكار ({searchResults.azkar.length})</h3>
                      <div className="space-y-4">
                          {searchResults.azkar.slice(0, 10).map(item => (
                              <DhikrCard
                                  key={item.id}
                                  item={item}
                                  isFavorite={favorites.includes(item.id)}
                                  initialCount={0}
                                  onToggleFavorite={handleToggleFavorite}
                                  highlightQuery={searchQuery}
                              />
                          ))}
                          {searchResults.azkar.length > 10 && (
                              <p className="text-center text-sm text-gray-400 mt-2">عرض أول 10 نتائج</p>
                          )}
                      </div>
                  </div>
              )}

              {/* 3. Matched Situational Duas */}
              {searchResults.situational.length > 0 && (
                  <div>
                      <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-4 px-2 font-arabicHead">أدعية متنوعة</h3>
                      <div className="space-y-4">
                          {searchResults.situational.map((res, idx) => (
                              <div key={idx} className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
                                  <div className="flex items-center justify-between mb-3">
                                      <span className="text-xs bg-gray-100 dark:bg-dark-bg px-2 py-1 rounded text-gray-500 font-arabic">{res.category}</span>
                                      <button 
                                          onClick={() => handleToggleFavorite(res.id)}
                                          className={`p-2 rounded-full transition-colors ${favorites.includes(res.id) ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                                      >
                                          <Heart size={18} fill={favorites.includes(res.id) ? "currentColor" : "none"} />
                                      </button>
                                  </div>
                                  <p className="font-arabic text-xl leading-[3] text-gray-800 dark:text-gray-100 text-center mb-4" dir="rtl">
                                      {res.item.text}
                                  </p>
                                  <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-dark-border pt-3">
                                      <button 
                                          onClick={() => handleCopy(res.item.text, 9000 + idx)}
                                          className="text-gray-400 hover:text-primary-500"
                                      >
                                          {copiedIndex === 9000 + idx ? <Check size={18} /> : <Copy size={18} />}
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* No Results State */}
              {searchResults.categories.length === 0 && searchResults.azkar.length === 0 && searchResults.situational.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-gray-100 dark:bg-dark-surface p-6 rounded-full mb-4">
                          <AlertCircle size={48} className="text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-600 dark:text-gray-300">لا توجد نتائج مطابقة لـ "{searchQuery}"</p>
                  </div>
              )}
          </div>
      ) : !selectedCategory ? (
        // --- Categories Grid View (Default) ---
        <div className="animate-fadeIn">
            <div className="text-center py-6 md:py-10">
                <div className="inline-flex items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-4 text-amber-600 dark:text-amber-400">
                    <BookOpenText size={32} />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-arabicHead">حصن المسلم</h2>
                <p className="text-gray-500 dark:text-gray-400 md:text-lg font-arabic">
                أذكار اليوم والليلة وأدعية لكل الأحوال
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* 1. Standard Azkar Categories (Sabah, Masaa, etc.) */}
                {CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => handleItemClick(category)}
                        className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900 transition-all group text-center flex flex-col items-center justify-center min-h-[140px]"
                    >
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 font-arabicHead mb-2">
                            {category.title}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium line-clamp-2 font-arabic">
                            {category.description}
                        </p>
                    </button>
                ))}

                {/* 2. Situational Dua Categories */}
                {SITUATIONAL_DUAS.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => handleItemClick(category)}
                        className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900 transition-all group text-center flex flex-col items-center justify-center min-h-[140px]"
                    >
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 font-arabicHead mb-2">
                            {category.title}
                        </h3>
                        <span className="text-xs text-gray-400 font-medium bg-gray-50 dark:bg-dark-bg px-2 py-1 rounded-md">
                            {category.items.length} دعاء
                        </span>
                    </button>
                ))}
            </div>
        </div>
      ) : (
        // --- Single Category List View (Situational Duas) ---
        <div className="animate-slideUp">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => setSelectedCategory(null)}
                    className="p-2 rounded-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="العودة للقائمة"
                >
                    <ArrowRight size={24} />
                </button>
                <h2 className="text-2xl font-bold font-arabicHead text-gray-800 dark:text-white">
                    أدعية {selectedCategory.title}
                </h2>
            </div>

            {/* List */}
            <div className="space-y-4">
                {selectedCategory.items.map((dua, index) => {
                    // Generate ID based on category index and item index
                    // We need to find the category index in the main array
                    const catIndex = SITUATIONAL_DUAS.findIndex(c => c.id === selectedCategory.id);
                    const duaId = generateSituationalId(catIndex, index);
                    const isFav = favorites.includes(duaId);

                    return (
                        <div key={index} className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
                            <p className="font-arabic text-2xl md:text-3xl leading-[3.5] text-gray-800 dark:text-gray-100 text-center mb-6" dir="rtl">
                                {dua.text}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                                <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-bg px-3 py-1 rounded-lg font-arabic">
                                    {dua.source || 'حصن المسلم'}
                                </span>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleToggleFavorite(duaId)}
                                        className={`p-2 rounded-full transition-colors ${isFav ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                                        title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                                    >
                                        <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                    <button 
                                        onClick={() => handleCopy(dua.text, index)}
                                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                                        title="نسخ"
                                    >
                                        {copiedIndex === index ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                    </button>
                                    <button 
                                        onClick={() => handleShare(dua.text)}
                                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                                        title="مشاركة"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default Duas;