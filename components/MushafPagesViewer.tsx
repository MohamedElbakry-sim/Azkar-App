import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Bookmark, Eye, EyeOff, Type, Settings, Sun, Moon, Coffee, Hash, Play, Pause, Copy, Share2, Palette, Search, Maximize2, Info } from 'lucide-react';
import * as quranService from '../services/quranService';
import * as storage from '../services/storage';
import { toArabicNumerals, applyTajweed, normalizeArabic, getHighlightRegex } from '../utils';
import { Ayah, SearchResult } from '../types';

const TOTAL_PAGES = 604;
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

interface MushafPagesViewerProps {
  initialPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  highlightedAyah?: { surah: number, ayah: number } | null;
  onAyahClick?: (surah: number, ayah: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  reciterId?: string;
  onReciterChange?: (id: string) => void;
  initialHighlightTerm?: string;
  onClearHighlight?: () => void;
}

const MushafPagesViewer: React.FC<MushafPagesViewerProps> = ({ 
  initialPage, 
  onPageChange, 
  onClose,
  highlightedAyah,
  onAyahClick,
  isPlaying = false,
  onTogglePlay,
  reciterId,
  onReciterChange,
  initialHighlightTerm,
  onClearHighlight
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(initialPage);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // UI State
  const [showOverlay, setShowOverlay] = useState(true);
  const [fontSize, setFontSize] = useState(28); 
  const [showSettings, setShowSettings] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [tajweedMode, setTajweedMode] = useState(false);
  const [pageTheme, setPageTheme] = useState<storage.PageTheme>(() => storage.getQuranTheme());
  const [bookmarks, setBookmarks] = useState<quranService.Bookmark[]>([]);
  const [infoModalSurah, setInfoModalSurah] = useState<any | null>(null);
  
  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'global' | 'surah'>('global');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState(initialHighlightTerm || '');

  // Context Menu State
  const [selectedAyah, setSelectedAyah] = useState<{surah: number, ayah: number, text: string} | null>(null);
  
  // Page Input State
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [inputPageValue, setInputPageValue] = useState('');

  // Swipe & Scroll State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDrag = useRef<boolean>(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Audio Sync Ref
  const activeAyahRef = useRef<HTMLSpanElement | null>(null);

  // Load initial data
  useEffect(() => {
    fetchPage(initialPage);
    setBookmarks(quranService.getBookmarks());
  }, []);

  // Update Highlight term from props (e.g. navigation)
  useEffect(() => {
      setHighlightTerm(initialHighlightTerm || '');
  }, [initialHighlightTerm]);

  // Update theme handling
  const handleThemeChange = (newTheme: storage.PageTheme) => {
      setPageTheme(newTheme);
      storage.saveQuranTheme(newTheme);
      resetOverlayTimer();
  };

  // Sync internal state if prop changes
  useEffect(() => {
    if (page !== initialPage) {
        setPage(initialPage);
        fetchPage(initialPage);
    }
  }, [initialPage]);

  // Audio Sync Scrolling
  useEffect(() => {
      if (highlightedAyah && !loading) {
          const ayahId = `ayah-${highlightedAyah.surah}-${highlightedAyah.ayah}`;
          const el = document.getElementById(ayahId);
          if (el) {
              activeAyahRef.current = el;
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [highlightedAyah, loading]);

  // Auto-save Last Read position whenever page content is loaded
  useEffect(() => {
      if (ayahs.length > 0) {
          const firstAyah = ayahs[0];
          quranService.saveLastRead({
              surahNumber: firstAyah.surah.number,
              ayahNumber: firstAyah.numberInSurah,
              pageNumber: page,
              timestamp: Date.now()
          });
      }
  }, [ayahs, page]);

  // Auto-hide overlay logic
  const resetOverlayTimer = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (showOverlay && !isEditingPage && !selectedAyah && !showSearch && !infoModalSurah) {
        overlayTimerRef.current = setTimeout(() => {
            setShowOverlay(false);
            setShowSettings(false);
        }, 4000);
    }
  }, [showOverlay, isEditingPage, selectedAyah, showSearch, infoModalSurah]);

  useEffect(() => {
    resetOverlayTimer();
    return () => {
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [showOverlay, resetOverlayTimer]);

  // Search Logic
  useEffect(() => {
      if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
      }

      const timer = setTimeout(async () => {
          setIsSearching(true);
          try {
              let results: SearchResult[] = [];
              if (searchScope === 'surah' && ayahs.length > 0) {
                  // Search within the current Surah displayed on the page
                  // Use the first ayah's surah as the context
                  const currentSurah = ayahs[0].surah.number;
                  results = await quranService.searchSurah(searchQuery, currentSurah);
              } else {
                  // Global Search
                  results = await quranService.searchGlobal(searchQuery);
              }
              setSearchResults(results);
          } catch (e) {
              console.error(e);
              setSearchResults([]);
          } finally {
              setIsSearching(false);
          }
      }, 500);

      return () => clearTimeout(timer);
  }, [searchQuery, searchScope, ayahs]);

  const fetchPage = async (pageNumber: number) => {
    setLoading(true);
    setError(false);
    try {
        const data = await quranService.getPageContent(pageNumber);
        setAyahs(data);
        
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
      setSelectedAyah(null);
  }, [onPageChange]);

  const goToNext = useCallback(() => changePage(page + 1), [page, changePage]);
  const goToPrev = useCallback(() => changePage(page - 1), [page, changePage]);

  // Handle Page Jump Input
  const handlePageInputSubmit = () => {
      let newPage = parseInt(inputPageValue);
      if (isNaN(newPage)) {
          setIsEditingPage(false);
          return;
      }
      
      // Enforce Bounds
      if (newPage < 1) newPage = 1;
      if (newPage > TOTAL_PAGES) newPage = TOTAL_PAGES;

      setIsEditingPage(false);
      
      if (newPage !== page) {
          changePage(newPage);
      }
  };

  const startPageEditing = () => {
      setInputPageValue(page.toString());
      setIsEditingPage(true);
      // Keep overlay open while editing
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
  };

  const handleSearchResultClick = (result: SearchResult) => {
      setShowSearch(false);
      // setHighlightTerm(searchQuery); // Set text highlighting locally, but navigation will reset it without state
      // Navigate with state
      navigate(`/quran/read/${result.surah.number}`, { state: { scrollToAyah: result.numberInSurah, highlightTerm: searchQuery }});
  };

  // Keyboard Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isEditingPage || showSearch) return; // Disable shortcuts while typing

        if (e.key === 'ArrowLeft') goToNext();
        if (e.key === 'ArrowRight') goToPrev();
        if (e.key === 'Escape') {
            if (selectedAyah) setSelectedAyah(null);
            else onClose();
        }
        if (e.key === ' ') {
            e.preventDefault();
            if (onTogglePlay) {
                onTogglePlay();
            } else {
                setShowOverlay(prev => !prev);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, isEditingPage, onTogglePlay, selectedAyah, showSearch]);

  // Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDrag.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const xDiff = Math.abs(e.touches[0].clientX - touchStartX.current);
    const yDiff = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // If moved significantly, treat as drag/scroll to prevent click
    if (xDiff > 10 || yDiff > 10) {
        isDrag.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const xDiff = touchStartX.current - e.changedTouches[0].clientX;
    const yDiff = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    
    touchStartX.current = null;
    touchStartY.current = null;

    // Only swipe if horizontal move is significant and vertical move is minimal
    if (Math.abs(xDiff) > 50 && yDiff < 100) {
        if (xDiff > 0) goToPrev(); 
        else goToNext(); 
    }
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

  // Action Menu Helpers
  const handleAyahShare = async () => {
      if (!selectedAyah) return;
      if (navigator.share) {
          try {
              await navigator.share({
                  title: `سورة ${ayahs.find(a => a.numberInSurah === selectedAyah.ayah)?.surah.name} - آية ${selectedAyah.ayah}`,
                  text: selectedAyah.text
              });
          } catch (e) {}
      } else {
          navigator.clipboard.writeText(selectedAyah.text);
          alert('تم نسخ النص');
      }
      setSelectedAyah(null);
  };

  const handleAyahCopy = () => {
      if (selectedAyah) {
          navigator.clipboard.writeText(selectedAyah.text);
          setSelectedAyah(null);
      }
  };

  const handleAyahPlay = () => {
      if (selectedAyah && onAyahClick) {
          onAyahClick(selectedAyah.surah, selectedAyah.ayah);
          setSelectedAyah(null);
      }
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
                  secondaryText: 'text-[#8a7d6b]',
                  highlight: 'bg-[#e6d0a0]', // Kept for logic reference, but won't apply to audio per request
                  indicator: 'text-[#8a6d3b] bg-[#eaddcf] border-[#d0c0a0]'
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
                  secondaryText: 'text-[#999]',
                  highlight: 'bg-emerald-900/60',
                  indicator: 'text-emerald-400 bg-emerald-900/30 border-emerald-800'
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
                  secondaryText: 'text-[#A59F85]',
                  highlight: 'bg-[#fff5cc]',
                  indicator: 'text-emerald-700 bg-emerald-50 border-emerald-200'
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

      let lastJuz = -1;

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
                                          <button 
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  setInfoModalSurah(group.surah);
                                              }}
                                              className={`font-quran text-2xl md:text-3xl font-bold drop-shadow-sm leading-relaxed text-center px-4 py-1 cursor-pointer hover:scale-105 hover:opacity-80 transition-all duration-200 ${themeStyles.surahHeaderText}`}
                                              title="معلومات السورة"
                                          >
                                              {group.surah.name}
                                          </button>
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
                            className={`font-quran break-words text-justify leading-[2.7] ${themeStyles.text} transition-all duration-300`} 
                            dir="rtl"
                            style={{ textAlignLast: 'center' }}
                          >
                              {group.ayahs.map((ayah) => {
                                  let text = ayah.text;
                                  if (ayah.numberInSurah === 1 && !isFatiha && text.startsWith(BISMILLAH)) {
                                      text = text.replace(BISMILLAH, '').trim();
                                  }

                                  const isSelected = selectedAyah?.surah === group.surah.number && selectedAyah?.ayah === ayah.numberInSurah;
                                  const isHighlightedAyah = highlightedAyah?.surah === group.surah.number && highlightedAyah?.ayah === ayah.numberInSurah;
                                  const isActive = isSelected || isHighlightedAyah;

                                  // Subtle Juz Indicator
                                  // Check if Juz changes. Initialize lastJuz with first ayah's juz if not set
                                  if (lastJuz === -1) lastJuz = ayahs[0].juz;
                                  const showJuzIndicator = ayah.juz !== lastJuz;
                                  if (showJuzIndicator) lastJuz = ayah.juz;

                                  let displayText = text;
                                  
                                  // Highlighting Logic (Prioritized over Tajweed)
                                  if (highlightTerm) {
                                      const regex = getHighlightRegex(highlightTerm);
                                      if (regex) {
                                          // Enhanced search highlight: Opaque color for better visibility over blue background
                                          displayText = text.replace(regex, (match) => `<span class="bg-yellow-400 text-black rounded box-decoration-clone px-0.5 shadow-sm">${match}</span>`);
                                      }
                                  } else if (tajweedMode) {
                                      // Render HTML with Tajweed
                                      displayText = applyTajweed(text);
                                  }

                                  return (
                                      <React.Fragment key={ayah.number}>
                                          {showJuzIndicator && (
                                              <span className={`inline-block mx-1.5 px-2 py-0.5 text-[10px] font-bold rounded border ${themeStyles.indicator} select-none align-middle transform -translate-y-1`}>
                                                  الجزء {toArabicNumerals(ayah.juz)}
                                              </span>
                                          )}
                                          <span 
                                            id={`ayah-${group.surah.number}-${ayah.numberInSurah}`}
                                            className={`
                                                inline relative rounded px-1 transition-all duration-200 cursor-pointer
                                                ${isActive ? 'bg-blue-100/80 dark:bg-blue-900/30 box-decoration-clone ring-2 ring-blue-300 dark:ring-blue-700' : ''}
                                                ${hideText ? 'blur-[6px] hover:blur-none active:blur-none transition-filter' : ''}
                                            `}
                                            style={{ fontSize: `${fontSize}px` }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isDrag.current) {
                                                    // Clear highlight on click if it exists to allow normal interaction
                                                    if (highlightTerm) setHighlightTerm('');
                                                    // Attempt to clear parent highlighting (e.g. search result or paused audio)
                                                    if (onClearHighlight) onClearHighlight();
                                                    
                                                    if (isSelected) {
                                                        setSelectedAyah(null);
                                                    } else {
                                                        setSelectedAyah({
                                                            surah: group.surah.number,
                                                            ayah: ayah.numberInSurah,
                                                            text: text
                                                        });
                                                        // Automatically hide header/footer when a verse is selected to show context menu cleanly
                                                        setShowOverlay(false);
                                                        setShowSettings(false);
                                                    }
                                                }
                                            }}
                                          >
                                              {tajweedMode || highlightTerm ? (
                                                  <span dangerouslySetInnerHTML={{ __html: displayText }} />
                                              ) : (
                                                  <span aria-label={`Ayah ${ayah.numberInSurah}`}>
                                                      {displayText}
                                                  </span>
                                              )}
                                              
                                              {/* Verse Marker */}
                                              <span className={`inline-block mx-1 font-quran select-none ${themeStyles.marker}`} style={{ fontSize: '0.9em' }}>
                                                  ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                                              </span>
                                              {" "}
                                          </span>
                                      </React.Fragment>
                                  );
                              })}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  }, [ayahs, page, fontSize, hideText, tajweedMode, highlightTerm, pageTheme, highlightedAyah, selectedAyah, themeStyles, onClearHighlight]);

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
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className={`p-2 rounded-full hover:opacity-80 transition-opacity ${pageTheme === 'dark' ? 'bg-[#333] text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <X size={20} />
                    </button>
                    <button 
                        onClick={() => { setShowSearch(true); resetOverlayTimer(); }}
                        className={`p-2 rounded-full hover:opacity-80 transition-opacity ${pageTheme === 'dark' ? 'bg-[#333] text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                        <Search size={20} />
                    </button>
                </div>
                
                <button 
                    onClick={() => {
                        if (ayahs.length > 0) setInfoModalSurah(ayahs[0].surah);
                        resetOverlayTimer();
                    }}
                    className="flex flex-col items-center group cursor-pointer"
                >
                    <span className={`font-bold font-arabicHead text-sm ${pageTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>القرآن الكريم</span>
                    {ayahs.length > 0 && (
                        <div className={`flex gap-2 text-[10px] items-center ${pageTheme === 'dark' ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'} transition-colors`}>
                            <span>جزء {toArabicNumerals(ayahs[0].juz)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                {ayahs[0].surah.name}
                                <Info size={10} className="opacity-50" />
                            </span>
                        </div>
                    )}
                </button>

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
                        title="وضع الحفظ (إخفاء النص)"
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
                    <button 
                        onClick={() => setShowOverlay(false)}
                        className={`p-2 rounded-full transition-colors ${pageTheme === 'dark' ? 'bg-[#333] text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                        title="إخفاء القوائم"
                    >
                        <Maximize2 size={18} />
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

                        {/* Reciter Selection */}
                        {onReciterChange && reciterId && (
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-500">القارئ:</span>
                                <select 
                                    value={reciterId}
                                    onChange={(e) => {
                                        onReciterChange(e.target.value);
                                        resetOverlayTimer();
                                    }}
                                    className={`w-full p-2 rounded-lg border-none focus:ring-2 focus:ring-[#D4AF37] font-arabic text-sm ${pageTheme === 'dark' ? 'bg-[#333] text-white' : 'bg-gray-100 text-gray-800'}`}
                                >
                                    {quranService.RECITERS.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Theme Selection */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-gray-500">لون الصفحة:</span>
                            <div className={`flex gap-1 p-1 rounded-lg ${pageTheme === 'dark' ? 'bg-[#333]' : 'bg-gray-100'}`}>
                                <button 
                                    onClick={() => handleThemeChange('light')}
                                    className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-bold ${pageTheme === 'light' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Sun size={16} />
                                    أبيض
                                </button>
                                <button 
                                    onClick={() => handleThemeChange('sepia')}
                                    className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-bold ${pageTheme === 'sepia' ? 'bg-[#fbf0d6] text-[#5c4b37] shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Coffee size={16} />
                                    كريمي
                                </button>
                                <button 
                                    onClick={() => handleThemeChange('dark')}
                                    className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-bold ${pageTheme === 'dark' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Moon size={16} />
                                    داكن
                                </button>
                            </div>
                        </div>

                        {/* Tajweed Toggle */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                            <span className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                                <Palette size={16} />
                                تلوين التجويد
                            </span>
                            <button 
                                onClick={() => { setTajweedMode(!tajweedMode); resetOverlayTimer(); }}
                                className={`w-10 h-6 rounded-full transition-colors relative ${tajweedMode ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tajweedMode ? 'left-1' : 'left-[calc(100%-1.25rem)]'}`}></span>
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>

        {/* --- Main Content --- */}
        <div 
            className="flex-1 relative w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
                if (isDrag.current) return;
                if (selectedAyah) setSelectedAyah(null); // Click outside deselects
                else {
                    // Clicking background should clear any external highlight (search/audio focus) unless we are just toggling overlay
                    if (onClearHighlight) onClearHighlight();
                    if (!isEditingPage && !showSearch && !infoModalSurah) {
                        setShowOverlay(prev => !prev);
                        setShowSettings(false);
                    }
                }
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

                    {/* Bottom Page Number - Hidden when overlay is up to show controls */}
                    {!loading && !error && !showOverlay && (
                        <div className="mt-8 text-center">
                            <span className={`text-sm font-mono select-none ${themeStyles.secondaryText}`}>- {toArabicNumerals(page)} -</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- Surah Info Overlay --- */}
        {infoModalSurah && (
            <div 
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn" 
                onClick={() => setInfoModalSurah(null)}
            >
                <div 
                    className="bg-white dark:bg-[#2a2a2a] w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-[#444] animate-popIn relative" 
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={() => setInfoModalSurah(null)}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-6 font-bold text-2xl border-4 border-white dark:border-[#2a2a2a] shadow-lg">
                        {toArabicNumerals(infoModalSurah.number)}
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white font-arabicHead mb-2">
                        {infoModalSurah.name}
                    </h2>
                    
                    <p className="text-gray-400 font-english text-lg mb-6">
                        {infoModalSurah.englishName}
                    </p>
                    
                    <div className="flex justify-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                        <span className="bg-gray-100 dark:bg-black/20 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/5">
                            {infoModalSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                        </span>
                        <span className="bg-gray-100 dark:bg-black/20 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/5">
                            {infoModalSurah.numberOfAyahs} آيات
                        </span>
                    </div>

                    {/* Simple Decoration */}
                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 opacity-50">
                        <p className="font-quran text-xl text-gray-800 dark:text-white">
                            {BISMILLAH}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* --- Context Menu for Selected Ayah --- */}
        {selectedAyah && (
            <div 
                className="absolute bottom-10 left-0 right-0 z-50 flex justify-center px-4 animate-slideUp pointer-events-none" 
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="pointer-events-auto flex items-center gap-1 bg-gray-900/95 dark:bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl text-white dark:text-gray-900 border border-white/10 dark:border-gray-200/20 max-w-full overflow-x-auto no-scrollbar">
                    <button 
                        onClick={handleAyahPlay}
                        className="p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors flex flex-col items-center gap-1 min-w-[44px]"
                    >
                        <Play size={20} fill="currentColor" />
                        <span className="text-[10px] font-bold whitespace-nowrap">استماع</span>
                    </button>
                    <div className="w-px h-8 bg-white/20 dark:bg-black/20 mx-1"></div>
                    <button 
                        onClick={handleAyahCopy}
                        className="p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors flex flex-col items-center gap-1 min-w-[44px]"
                    >
                        <Copy size={20} />
                        <span className="text-[10px] font-bold whitespace-nowrap">نسخ</span>
                    </button>
                    <div className="w-px h-8 bg-white/20 dark:bg-black/20 mx-1"></div>
                    <button 
                        onClick={handleAyahShare}
                        className="p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors flex flex-col items-center gap-1 min-w-[44px]"
                    >
                        <Share2 size={20} />
                        <span className="text-[10px] font-bold whitespace-nowrap">مشاركة</span>
                    </button>
                    <div className="w-px h-8 bg-white/20 dark:bg-black/20 mx-1"></div>
                    <button 
                        onClick={() => setSelectedAyah(null)}
                        className="p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors text-red-400 min-w-[44px] flex items-center justify-center"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        )}

        {/* --- Footer Overlay (Slider & Input) --- */}
        <div 
            className={`
                absolute bottom-0 left-0 right-0 z-30 transition-transform duration-300 
                ${showOverlay ? 'translate-y-0' : 'translate-y-full'}
            `}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`backdrop-blur-md border-t px-6 py-4 flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${pageTheme === 'dark' ? 'bg-[#1a1a1a]/95 border-[#333]' : 'bg-white/90 border-gray-200'}`}>
                
                {/* Controls Row */}
                <div className={`flex items-center gap-4 ${pageTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <button onClick={goToNext} className={`p-3 rounded-full transition-colors ${pageTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><ChevronRight size={24} /></button>
                    
                    {onTogglePlay && (
                        <button 
                            onClick={() => {
                                onTogglePlay();
                                resetOverlayTimer();
                            }}
                            className={`p-3 rounded-full transition-colors shadow-sm ${isPlaying ? 'bg-emerald-500 text-white shadow-emerald-500/30' : (pageTheme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200')}`}
                            title={isPlaying ? "إيقاف" : "تشغيل"}
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                    )}

                    <div className="flex-1 flex items-center gap-3">
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
                    </div>

                    <button onClick={goToPrev} className={`p-3 rounded-full transition-colors ${pageTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><ChevronLeft size={24} /></button>
                </div>
                
                {/* Page Number & Jump Input */}
                <div className="flex justify-center items-center pb-2">
                    {isEditingPage ? (
                        <div className="flex items-center gap-2 animate-fadeIn">
                            <span className="text-xs text-gray-400">صفحة</span>
                            <input
                                autoFocus
                                type="number"
                                min={1}
                                max={TOTAL_PAGES}
                                value={inputPageValue}
                                onChange={(e) => setInputPageValue(e.target.value)}
                                onBlur={handlePageInputSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                                className={`w-16 text-center py-1 rounded-md text-sm font-bold border outline-none ${pageTheme === 'dark' ? 'bg-[#333] border-[#555] text-white focus:border-[#D4AF37]' : 'bg-white border-gray-300 text-gray-800 focus:border-[#D4AF37]'}`}
                            />
                            <span className="text-xs text-gray-400">من {TOTAL_PAGES}</span>
                        </div>
                    ) : (
                        <button 
                            onClick={startPageEditing}
                            className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-[#D4AF37] transition-colors py-1 px-3 rounded-lg hover:bg-black/5"
                            title="اضغط للانتقال لصفحة"
                        >
                            <Hash size={12} />
                            <span>{page}</span>
                            <span>/</span>
                            <span>{TOTAL_PAGES}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* --- Search Modal --- */}
        {showSearch && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4 animate-fadeIn" onClick={() => setShowSearch(false)}>
                <div className="bg-white dark:bg-[#2a2a2a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slideUp text-gray-800 dark:text-white border dark:border-[#444]" onClick={e => e.stopPropagation()}>
                    <div className="p-3 border-b border-gray-100 dark:border-[#444] flex gap-3 items-center">
                        <Search className="text-gray-400" size={20} />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="ابحث في القرآن الكريم..." 
                            className="flex-1 bg-transparent border-none outline-none text-base font-arabic placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')}><X className="text-gray-400" size={18} /></button>}
                    </div>
                    
                    {/* Scope Toggles */}
                    <div className="bg-gray-50 dark:bg-dark-bg px-4 py-2 flex gap-4 text-xs font-bold text-gray-500 border-b border-gray-100 dark:border-dark-border">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-500 transition-colors">
                            <input 
                                type="radio" 
                                name="searchScope" 
                                checked={searchScope === 'surah'} 
                                onChange={() => setSearchScope('surah')}
                                className="accent-emerald-500"
                            />
                            في السورة الحالية
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-500 transition-colors">
                            <input 
                                type="radio" 
                                name="searchScope" 
                                checked={searchScope === 'global'} 
                                onChange={() => setSearchScope('global')}
                                className="accent-emerald-500"
                            />
                            في كل المصحف
                        </label>
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto p-2">
                        {isSearching ? (
                            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-1">
                                {searchResults.map((res: any, idx: number) => {
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleSearchResultClick(res)}
                                            className="w-full text-right p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-transparent group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md">
                                                    سورة {res.surah.name} - آية {res.numberInSurah}
                                                </span>
                                            </div>
                                            <p className="font-quran text-base opacity-90 line-clamp-1" dir="rtl">
                                                {res.text}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : searchQuery ? (
                            <div className="py-12 text-center text-gray-400 text-sm">لا توجد نتائج</div>
                        ) : (
                            <div className="py-12 text-center text-gray-400 opacity-50 text-sm">ابدأ الكتابة للبحث</div>
                        )}
                    </div>
                </div>
            </div>
        )}

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