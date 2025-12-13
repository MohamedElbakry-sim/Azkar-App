
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Bookmark, Eye, EyeOff, Type, Settings, Sun, Moon, Coffee } from 'lucide-react';
import * as quranService from '../services/quranService';
import * as habitService from '../services/habitService';
import { toArabicNumerals } from '../utils';
import { Ayah } from '../types';

const TOTAL_PAGES = 604;
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

interface MushafPagesViewerProps {
  initialPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

type PageTheme = 'light' | 'sepia' | 'dark';

const MushafPagesViewer: React.FC<MushafPagesViewerProps> = ({ initialPage, onPageChange, onClose }) => {
  const [page, setPage] = useState(initialPage);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // UI State
  const [showOverlay, setShowOverlay] = useState(true);
  const [fontSize, setFontSize] = useState(28); 
  const [showSettings, setShowSettings] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [pageTheme, setPageTheme] = useState<PageTheme>('light');
  const [bookmarks, setBookmarks] = useState<quranService.Bookmark[]>([]);
  
  // Swipe State
  const touchStartX = useRef<number | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Load initial data
  useEffect(() => {
    fetchPage(initialPage);
    setBookmarks(quranService.getBookmarks());
    // Check system preference for initial theme if needed, or default to light
    if (document.documentElement.classList.contains('dark')) {
        setPageTheme('dark');
    }
  }, []);

  // Sync internal state if prop changes
  useEffect(() => {
    if (page !== initialPage) {
        setPage(initialPage);
        fetchPage(initialPage);
    }
  }, [initialPage]);

  // Auto-hide overlay logic
  const resetOverlayTimer = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (showOverlay) {
        overlayTimerRef.current = setTimeout(() => {
            setShowOverlay(false);
            setShowSettings(false);
        }, 4000);
    }
  }, [showOverlay]);

  useEffect(() => {
    resetOverlayTimer();
    return () => {
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [showOverlay, resetOverlayTimer]);

  const fetchPage = async (pageNumber: number) => {
    setLoading(true);
    setError(false);
    try {
        const data = await quranService.getPageContent(pageNumber);
        setAyahs(data);
        
        // Log Habit Activity (1 page read)
        habitService.logSystemActivity('quran_reading', 1);

        // Preload adjacent pages
        if (pageNumber < TOTAL_PAGES) quranService.getPageContent(pageNumber + 1);
        if (pageNumber > 1) quranService.getPageContent(pageNumber - 1);
    } catch (e) {
        setError(true);
    } finally {
        setLoading(false);
    }
  };

  const changePage = useCallback((newPage: number) => {
      if (newPage < 1 || newPage > TOTAL_PAGES) return;
      setPage(newPage);
      onPageChange(newPage);
      fetchPage(newPage);
      window.scrollTo(0,0);
  }, [onPageChange]);

  const goToNext = useCallback(() => changePage(page + 1), [page, changePage]);
  const goToPrev = useCallback(() => changePage(page - 1), [page, changePage]);

  // Keyboard Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') goToNext();
        if (e.key === 'ArrowRight') goToPrev();
        if (e.key === 'Escape') onClose();
        if (e.key === ' ') {
            e.preventDefault();
            setShowOverlay(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;

    if (Math.abs(diff) > 50) {
        if (diff > 0) goToPrev(); 
        else goToNext(); 
    }
  };

  const handleInteraction = () => {
      resetOverlayTimer();
  };

  // Bookmark Logic
  const isBookmarked = useMemo(() => {
      if (ayahs.length === 0) return false;
      const firstAyah = ayahs[0];
      return bookmarks.some(b => b.surahNumber === firstAyah.surah.number && b.ayahNumber === firstAyah.numberInSurah);
  }, [bookmarks, ayahs]);

  const toggleBookmark = () => {
      if (ayahs.length === 0) return;
      const firstAyah = ayahs[0];
      
      if (isBookmarked) {
          const updated = quranService.removeBookmark(firstAyah.surah.number, firstAyah.numberInSurah);
          setBookmarks(updated);
      } else {
          const newBookmark: quranService.Bookmark = {
              surahNumber: firstAyah.surah.number,
              ayahNumber: firstAyah.numberInSurah,
              pageNumber: page,
              timestamp: Date.now()
          };
          const updated = quranService.addBookmark(newBookmark);
          setBookmarks(updated);
      }
      resetOverlayTimer();
  };

  const getThemeStyles = () => {
      switch (pageTheme) {
          case 'sepia':
              return {
                  container: 'bg-[#f4e4bc]',
                  sheet: 'bg-[#fbf0d6] border-[#d0c0a0]',
                  text: 'text-[#5c4b37]',
                  surahHeaderBg: 'bg-[#eaddcf]',
                  surahHeaderBorder: 'border-[#d0c0a0]',
                  surahHeaderText: 'text-[#5c4b37]',
                  marker: 'text-[#8a6d3b]',
                  secondaryText: 'text-[#8a7d6b]'
              };
          case 'dark':
              return {
                  container: 'bg-[#1a1a1a]',
                  sheet: 'bg-[#2a2a2a] border-[#444]',
                  text: 'text-[#E0E0E0]',
                  surahHeaderBg: 'bg-[#333]',
                  surahHeaderBorder: 'border-[#555]',
                  surahHeaderText: 'text-[#E8E4D2]',
                  marker: 'text-[#E5C355]',
                  secondaryText: 'text-[#999]'
              };
          default: // Light
              return {
                  container: 'bg-[#f3f4f6]',
                  sheet: 'bg-[#FFFCF5] border-[#D4CFBA]',
                  text: 'text-[#111]',
                  surahHeaderBg: 'bg-[#EFEAD5]',
                  surahHeaderBorder: 'border-[#D4CFBA]',
                  surahHeaderText: 'text-black',
                  marker: 'text-[#D4AF37]',
                  secondaryText: 'text-[#A59F85]'
              };
      }
  };

  const themeStyles = getThemeStyles();

  const renderPageContent = useMemo(() => {
      if (!ayahs || ayahs.length === 0) return null;

      // Group by Surah
      const groups: { surah: any; ayahs: Ayah[] }[] = [];
      let currentSurahNum = -1;

      ayahs.forEach(ayah => {
          if (ayah.surah.number !== currentSurahNum) {
              currentSurahNum = ayah.surah.number;
              groups.push({ surah: ayah.surah, ayahs: [] });
          }
          groups[groups.length - 1].ayahs.push(ayah);
      });

      return (
          <div className="flex flex-col w-full h-full" dir="rtl">
              {groups.map((group, idx) => {
                  const isFatiha = group.surah.number === 1;
                  const isTawbah = group.surah.number === 9;
                  const isStartOfSurah = group.ayahs[0].numberInSurah === 1;

                  return (
                      <div key={`${page}-${group.surah.number}`} className="relative mb-2">
                          {/* Surah Header */}
                          {isStartOfSurah && (
                              <div className="my-8 w-full">
                                  <div className={`flex items-center justify-center relative py-3 border-y-2 shadow-sm w-full overflow-visible ${themeStyles.surahHeaderBg} ${themeStyles.surahHeaderBorder}`}>
                                      {/* Decorative Ends */}
                                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                                      
                                      <div className="flex items-center gap-4 px-2 relative z-10">
                                          <span className={`${themeStyles.secondaryText} text-2xl shrink-0`}>۞</span>
                                          <h3 className={`font-quran text-2xl md:text-3xl font-bold drop-shadow-sm leading-relaxed text-center px-2 py-1 ${themeStyles.surahHeaderText}`}>
                                              {group.surah.name}
                                          </h3>
                                          <span className={`${themeStyles.secondaryText} text-2xl shrink-0`}>۞</span>
                                      </div>
                                  </div>
                                  
                                  {/* Bismillah */}
                                  {!isFatiha && !isTawbah && (
                                      <div className={`text-center font-quran text-2xl md:text-3xl my-8 opacity-90 leading-loose ${themeStyles.text}`}>
                                          {BISMILLAH}
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* Ayahs Block */}
                          <div 
                            className={`font-quran break-words text-justify leading-[2.7] ${themeStyles.text} ${hideText ? 'blur-[6px]' : ''} transition-all duration-300`} 
                            dir="rtl"
                            style={{ textAlignLast: 'center' }}
                          >
                              {group.ayahs.map((ayah) => {
                                  let text = ayah.text;
                                  if (ayah.numberInSurah === 1 && !isFatiha && text.startsWith(BISMILLAH)) {
                                      text = text.replace(BISMILLAH, '').trim();
                                  }

                                  return (
                                      <span key={ayah.number} className="inline relative" style={{ fontSize: `${fontSize}px` }}>
                                          <span aria-label={`Ayah ${ayah.numberInSurah}`}>
                                              {text}
                                          </span>
                                          {/* Verse Marker (Standard QuranReader Style) */}
                                          <span className={`inline-block mx-1 font-quran select-none ${themeStyles.marker}`} style={{ fontSize: '0.9em' }}>
                                              ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                                          </span>
                                          {" "}
                                      </span>
                                  );
                              })}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  }, [ayahs, page, fontSize, hideText, pageTheme]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col h-full w-full overflow-hidden select-text transition-colors duration-300 ${themeStyles.container}`}>
        
        {/* --- Header Overlay --- */}
        <div 
            className={`
                absolute top-0 left-0 right-0 z-30 transition-transform duration-300 
                ${showOverlay ? 'translate-y-0' : '-translate-y-full'}
            `}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`backdrop-blur-md border-b px-4 py-3 flex items-center justify-between shadow-sm ${pageTheme === 'dark' ? 'bg-[#1a1a1a]/95 border-[#333]' : 'bg-white/95 border-gray-200'}`}>
                <button onClick={onClose} className={`p-2 rounded-full hover:opacity-80 transition-opacity ${pageTheme === 'dark' ? 'bg-[#333] text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center">
                    <span className={`font-bold font-arabicHead text-sm ${pageTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>القرآن الكريم</span>
                    {ayahs.length > 0 && (
                        <div className={`flex gap-2 text-[10px] ${pageTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>جزء {toArabicNumerals(ayahs[0].juz)}</span>
                            <span>•</span>
                            <span>{ayahs[0].surah.name}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={toggleBookmark}
                        className={`p-2 rounded-full transition-colors ${isBookmarked ? 'bg-red-50 text-red-500' : (pageTheme === 'dark' ? 'bg-[#333] text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                        title="حفظ الصفحة"
                    >
                        <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                    <button 
                        onClick={() => setHideText(!hideText)}
                        className={`p-2 rounded-full transition-colors ${hideText ? 'bg-indigo-50 text-indigo-500' : (pageTheme === 'dark' ? 'bg-[#333] text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                        title="إخفاء النص (مراجعة)"
                    >
                        {hideText ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-emerald-50 text-emerald-500' : (pageTheme === 'dark' ? 'bg-[#333] text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                        title="الإعدادات"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Settings Dropdown */}
            {showSettings && (
                <div className={`absolute top-full left-0 right-0 border-b p-4 animate-slideUp ${pageTheme === 'dark' ? 'bg-[#1a1a1a]/95 border-[#333]' : 'bg-white/95 border-gray-200'}`}>
                    <div className="flex flex-col gap-4 max-w-md mx-auto">
                        
                        {/* Font Size */}
                        <div className="flex items-center gap-4">
                            <Type size={18} className="text-gray-500" />
                            <input 
                                type="range" 
                                min="20" 
                                max="42" 
                                step="2"
                                value={fontSize}
                                onChange={(e) => {
                                    setFontSize(parseInt(e.target.value));
                                    resetOverlayTimer();
                                }}
                                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] ${pageTheme === 'dark' ? 'bg-[#444]' : 'bg-gray-200'}`}
                            />
                            <span className={`text-sm font-bold w-8 text-center ${themeStyles.text}`}>{fontSize}</span>
                        </div>

                        {/* Theme Selection */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-gray-500">لون الصفحة:</span>
                            <div className={`flex gap-1 p-1 rounded-lg ${pageTheme === 'dark' ? 'bg-[#333]' : 'bg-gray-100'}`}>
                                <button 
                                    onClick={() => { setPageTheme('light'); resetOverlayTimer(); }}
                                    className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-bold ${pageTheme === 'light' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Sun size={14} />
                                    فاتح
                                </button>
                                <button 
                                    onClick={() => { setPageTheme('sepia'); resetOverlayTimer(); }}
                                    className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-bold ${pageTheme === 'sepia' ? 'bg-[#fbf0d6] text-[#5c4b37] shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Coffee size={14} />
                                    كريمي
                                </button>
                                <button 
                                    onClick={() => { setPageTheme('dark'); resetOverlayTimer(); }}
                                    className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-bold ${pageTheme === 'dark' ? 'bg-[#444] text-white shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Moon size={14} />
                                    داكن
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>

        {/* --- Main Content --- */}
        <div 
            className="flex-1 relative w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
                setShowOverlay(prev => !prev);
                setShowSettings(false);
            }}
        >
            {/* The Page Sheet */}
            <div 
                className={`w-full max-w-[800px] min-h-full mx-auto shadow-2xl relative flex flex-col my-0 md:my-4 md:rounded-lg border-x ${themeStyles.sheet}`}
                style={{ 
                    backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.02) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%)"
                }}
            >
                {/* Inner Border Frame */}
                <div className={`absolute inset-2 md:inset-4 border-2 pointer-events-none z-0 rounded-sm ${themeStyles.surahHeaderBorder}`}></div>
                <div className={`absolute inset-[10px] md:inset-[18px] border pointer-events-none z-0 rounded-sm opacity-50 ${themeStyles.surahHeaderBorder}`}></div>

                <div className="relative z-10 flex-1 px-4 py-6 md:px-12 md:py-12 flex flex-col">
                    
                    {/* Top Info (Surah/Juz names specific to page header style) */}
                    {!loading && !error && ayahs.length > 0 && (
                        <div className={`flex justify-between text-xs md:text-sm font-bold mb-6 px-2 font-arabicHead ${themeStyles.secondaryText}`}>
                            <span>{ayahs[0].surah.name}</span>
                            <span>صفحة {toArabicNumerals(page)}</span>
                            <span>الجزء {toArabicNumerals(ayahs[0].juz)}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50 min-h-[60vh]">
                            <Loader2 size={40} className="animate-spin text-[#D4AF37]" />
                            <p className={`text-sm font-arabic ${themeStyles.secondaryText}`}>جاري تحميل الصفحة...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 min-h-[60vh]">
                            <AlertCircle size={48} className="text-red-400 mb-4" />
                            <p className={`font-bold mb-4 ${themeStyles.text}`}>تعذر تحميل الصفحة</p>
                            <button onClick={() => fetchPage(page)} className="px-6 py-2 bg-[#D4AF37] text-white rounded-full text-sm font-bold hover:bg-[#C5A028]">إعادة المحاولة</button>
                        </div>
                    ) : (
                        <div className="flex-1">
                            {renderPageContent}
                        </div>
                    )}

                    {/* Bottom Page Number */}
                    {!loading && !error && (
                        <div className="mt-8 text-center">
                            <span className={`text-sm font-mono select-none ${themeStyles.secondaryText}`}>- {toArabicNumerals(page)} -</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- Footer Overlay (Slider) --- */}
        <div 
            className={`
                absolute bottom-0 left-0 right-0 z-30 transition-transform duration-300 
                ${showOverlay ? 'translate-y-0' : 'translate-y-full'}
            `}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`backdrop-blur-md border-t px-6 py-6 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${pageTheme === 'dark' ? 'bg-[#1a1a1a]/95 border-[#333]' : 'bg-white/90 border-gray-200'}`}>
                <div className={`flex items-center gap-4 ${pageTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <button onClick={goToNext} className={`p-3 rounded-full transition-colors ${pageTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><ChevronRight size={24} /></button>
                    <input 
                        type="range" 
                        min="1" 
                        max={TOTAL_PAGES} 
                        value={page}
                        onChange={(e) => {
                            changePage(parseInt(e.target.value));
                            resetOverlayTimer();
                        }}
                        className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] dir-ltr ${pageTheme === 'dark' ? 'bg-[#444]' : 'bg-gray-200'}`}
                        dir="ltr"
                    />
                    <button onClick={goToPrev} className={`p-3 rounded-full transition-colors ${pageTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><ChevronLeft size={24} /></button>
                </div>
                
                <div className="flex justify-between text-[10px] font-mono text-gray-400 px-12">
                    <span>1</span>
                    <span>{TOTAL_PAGES}</span>
                </div>
            </div>
        </div>

        {/* --- Side Click Navigation (Desktop) --- */}
        <div className="hidden md:block fixed top-1/2 left-8 -translate-y-1/2 z-10">
            <button onClick={goToNext} className={`p-4 rounded-full transition-all backdrop-blur-sm shadow-sm border ${pageTheme === 'dark' ? 'bg-black/20 hover:bg-black/40 text-gray-400 border-white/5' : 'bg-white/10 hover:bg-white/20 text-gray-500 border-black/5'}`}>
                <ChevronLeft size={32} />
            </button>
        </div>
        <div className="hidden md:block fixed top-1/2 right-8 -translate-y-1/2 z-10">
            <button onClick={goToPrev} className={`p-4 rounded-full transition-all backdrop-blur-sm shadow-sm border ${pageTheme === 'dark' ? 'bg-black/20 hover:bg-black/40 text-gray-400 border-white/5' : 'bg-white/10 hover:bg-white/20 text-gray-500 border-black/5'}`}>
                <ChevronRight size={32} />
            </button>
        </div>

    </div>
  );
};

export default MushafPagesViewer;
