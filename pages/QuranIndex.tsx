import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QURAN_META } from '../data/quranMeta';
import { normalizeArabic } from '../utils';
import { Search, Book, Bookmark as BookmarkIcon } from 'lucide-react';
import * as quranService from '../services/quranService';

const QuranIndex: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const bookmark = quranService.getBookmark();

  // Filter Surahs based on search
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return QURAN_META;
    
    const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
    
    return QURAN_META.filter(surah => {
      const normArabic = normalizeArabic(surah.name);
      const normEnglish = surah.englishName.toLowerCase();
      
      return normArabic.includes(normalizedQuery) || normEnglish.includes(normalizedQuery);
    });
  }, [searchQuery]);

  const handleSurahClick = (number: number) => {
    navigate(`/quran/${number}`);
  };

  const handleContinueReading = () => {
    if (bookmark) {
      navigate(`/quran/${bookmark.surahNumber}`, { state: { scrollToAyah: bookmark.ayahNumber }});
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      
      {/* Header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-4 text-emerald-600 dark:text-emerald-400">
           <Book size={40} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2 font-arabicHead">القرآن الكريم</h1>
        <p className="text-gray-500 dark:text-gray-400 font-arabic">المصحف الشريف برواية حفص عن عاصم</p>
      </div>

      {/* Continue Reading Card */}
      {bookmark && (
        <div 
            onClick={handleContinueReading}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden group"
        >
             <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                 <Book size={200} />
             </div>
             
             <div className="relative z-10 flex items-center justify-between">
                 <div>
                     <div className="flex items-center gap-2 mb-2 text-emerald-100">
                         <BookmarkIcon size={18} />
                         <span className="text-sm font-bold">متابعة القراءة</span>
                     </div>
                     <h3 className="text-2xl font-bold font-arabicHead mb-1">
                         سورة {QURAN_META[bookmark.surahNumber - 1].name}
                     </h3>
                     <p className="text-emerald-100">
                         توقفت عند الآية {bookmark.ayahNumber}
                     </p>
                 </div>
                 <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                     <span className="font-english font-bold text-lg px-2">Go</span>
                 </div>
             </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-4 pr-11 text-base rounded-2xl border-none bg-white dark:bg-dark-surface shadow-sm focus:ring-2 focus:ring-emerald-400 placeholder-gray-400 dark:text-white transition-shadow font-arabic"
          placeholder="ابحث عن السورة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Surah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSurahs.map((surah) => (
          <button
            key={surah.number}
            onClick={() => handleSurahClick(surah.number)}
            className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-100 dark:border-dark-border hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-sm group text-right flex items-center gap-4"
          >
            <div className="w-12 h-12 flex-shrink-0 bg-gray-50 dark:bg-dark-bg rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold font-english relative group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                 {/* Star shape or simple box */}
                 <span className="relative z-10">{surah.number}</span>
                 <div className="absolute inset-0 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-lg rotate-45 scale-75"></div>
            </div>
            
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 font-arabicHead">{surah.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${surah.revelationType === 'Meccan' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20'}`}>
                        {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                    <span className="font-english">{surah.englishName}</span>
                    <span>{surah.numberOfAyahs} آية</span>
                </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuranIndex;
