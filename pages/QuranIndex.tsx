
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QURAN_META } from '../data/quranMeta';
import { normalizeArabic } from '../utils';
import { Search, Book, Bookmark as BookmarkIcon, Layers, Grid, ChevronLeft, PlayCircle, Trash2, Clock } from 'lucide-react';
import * as quranService from '../services/quranService';

const QuranIndex: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [bookmarks, setBookmarks] = useState<quranService.Bookmark[]>([]);
  
  useEffect(() => {
      setBookmarks(quranService.getBookmarks());
  }, []);

  const handleDeleteBookmark = (e: React.MouseEvent, surah: number, ayah: number) => {
      e.stopPropagation();
      const updated = quranService.removeBookmark(surah, ayah);
      setBookmarks(updated);
  };

  // Generate Juz List (Static for now, 1-30)
  const juzList = Array.from({ length: 30 }, (_, i) => ({
      number: i + 1,
      name: `الجزء ${i + 1}`,
      description: `الحزب ${(i * 2) + 1} - ${(i * 2) + 2}`
  }));

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
    navigate(`/quran/detail/${number}`);
  };

  const handleContinueReading = (bookmark: quranService.Bookmark) => {
    navigate(`/quran/read/${bookmark.surahNumber}`, { state: { scrollToAyah: bookmark.ayahNumber }});
  };

  const lastRead = bookmarks.length > 0 ? bookmarks[0] : null;
  const savedBookmarks = bookmarks.length > 1 ? bookmarks.slice(1) : [];

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-6">
      
      {/* Header & Search */}
      <div className="sticky top-0 bg-gray-50/95 dark:bg-dark-bg/95 backdrop-blur-xl z-20 pt-4 pb-2 px-4 -mx-4">
          <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white font-arabicHead">القرآن الكريم</h1>
              <div className="flex bg-gray-200 dark:bg-dark-surface p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('surah')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'surah' ? 'bg-white dark:bg-dark-elevated text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                  >
                      السور
                  </button>
                  <button 
                    onClick={() => setActiveTab('juz')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'juz' ? 'bg-white dark:bg-dark-elevated text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                  >
                      الأجزاء
                  </button>
              </div>
          </div>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white dark:bg-dark-surface border-none shadow-sm focus:ring-2 focus:ring-emerald-500 dark:text-white font-arabic placeholder-gray-400"
              placeholder={activeTab === 'surah' ? "بحث باسم السورة..." : "بحث عن جزء..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
      </div>

      {/* Bookmarks Section */}
      {bookmarks.length > 0 && (
        <div className="px-4 md:px-0 space-y-4">
            
            {/* Last Read Banner */}
            {lastRead && (
                <div 
                    onClick={() => handleContinueReading(lastRead)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/20 cursor-pointer relative overflow-hidden group"
                >
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <Book size={180} />
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1 text-emerald-100 text-xs font-bold uppercase tracking-wider">
                                <Clock size={14} />
                                <span>آخر قراءة</span>
                            </div>
                            <h3 className="text-xl font-bold font-arabicHead mb-1">
                                سورة {QURAN_META[lastRead.surahNumber - 1].name}
                            </h3>
                            <p className="text-emerald-100 text-sm">
                                الآية <span className="font-mono font-bold">{lastRead.ayahNumber}</span>
                            </p>
                        </div>
                        <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <ChevronLeft className="rtl:rotate-0" />
                        </div>
                    </div>
                </div>
            )}

            {/* Other Bookmarks List */}
            {savedBookmarks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 px-2 flex items-center gap-2">
                        <BookmarkIcon size={14} />
                        محفوظات أخرى
                    </h3>
                    <div className="grid gap-2">
                        {savedBookmarks.map((bm, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleContinueReading(bm)}
                                className="bg-white dark:bg-dark-surface p-3 rounded-xl border border-gray-100 dark:border-dark-border flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <BookmarkIcon size={16} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-800 dark:text-white font-arabicHead text-sm block">
                                            سورة {QURAN_META[bm.surahNumber - 1].name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            الآية {bm.ayahNumber}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteBookmark(e, bm.surahNumber, bm.ayahNumber)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Content List */}
      <div className="px-4 md:px-0">
        {activeTab === 'surah' ? (
            <div className="space-y-3">
                {filteredSurahs.map((surah) => (
                <button
                    key={surah.number}
                    onClick={() => handleSurahClick(surah.number)}
                    className="w-full bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-100 dark:border-dark-border hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all shadow-sm flex items-center gap-4 group"
                >
                    <div className="w-10 h-10 flex-shrink-0 bg-gray-50 dark:bg-dark-bg rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold font-english relative group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                        <span className="relative z-10 text-sm">{surah.number}</span>
                        <div className="absolute inset-0 border border-emerald-100 dark:border-emerald-900/30 rounded-lg rotate-45 scale-75"></div>
                    </div>
                    
                    <div className="flex-1 text-right">
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
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {juzList.map((juz) => (
                    <button
                        key={juz.number}
                        className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-100 dark:border-dark-border hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all shadow-sm text-center flex flex-col items-center justify-center gap-2"
                        onClick={() => alert('ميزة التصفح بالأجزاء قادمة قريباً')}
                    >
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
                            <Grid size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white font-arabicHead">{juz.name}</h3>
                        <span className="text-xs text-gray-400">{juz.description}</span>
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default QuranIndex;
