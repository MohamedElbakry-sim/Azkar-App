
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as quranService from '../services/quranService';
import { SurahData, Ayah, SearchResult } from '../types';
import { QURAN_META } from '../data/quranMeta';
import { 
  ArrowRight, Play, Pause, Settings, BookOpen, ChevronLeft, ChevronRight,
  Loader2, Type, X, RefreshCw, Eye, EyeOff, Mic, 
  FastForward, Rewind, Infinity, Search, AlertTriangle, Bookmark,
  FileText, Book, Info
} from 'lucide-react';
import ErrorState from '../components/ErrorState';
import { toArabicNumerals, applyTajweed, normalizeArabic, getHighlightRegex } from '../utils';

const QuranReader: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const surahNumber = parseInt(surahId || '1');

  // --- State ---
  const [surah, setSurah] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(32);
  const [showSettings, setShowSettings] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  
  // Reading Mode State
  const [readingMode, setReadingMode] = useState<'text' | 'page'>('text');
  
  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'surah' | 'global'>('surah');
  const [searchResults, setSearchResults] = useState<SearchResult[] | Ayah[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Highlighting & Interaction State
  const [activeAyahId, setActiveAyahId] = useState<number | null>(null);
  const [interactionSource, setInteractionSource] = useState<'click' | 'search' | 'audio' | null>(null);
  const [highlightTerm, setHighlightTerm] = useState<string>('');

  // UI Visibility
  const [uiVisible, setUiVisible] = useState(true);

  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [reciterId, setReciterId] = useState<string>(quranService.getPreferredReciter());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [usingFallback, setUsingFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Advanced Features State
  const [tajweedMode, setTajweedMode] = useState(false);
  
  // Memorization State
  const [memorizeMode, setMemorizeMode] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0); // 0 = no repeat
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [hideText, setHideText] = useState(false);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<quranService.Bookmark[]>([]);

  // Swipe Gestures State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 50;
  
  // --- Data Processing ---
  
  const activeAyahData = useMemo(() => {
      return surah?.ayahs.find(a => a.numberInSurah === activeAyahId);
  }, [surah, activeAyahId]);

  // Check if current active ayah is bookmarked
  const isBookmarked = useMemo(() => {
      if (!activeAyahId) return false;
      return bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === activeAyahId);
  }, [bookmarks, surahNumber, activeAyahId]);

  // Determine Page Ranges for current Surah
  const surahPageRange = useMemo(() => {
      if (!surah || surah.ayahs.length === 0) return { start: 0, end: 0 };
      const pages = surah.ayahs.map(a => a.page);
      return { start: Math.min(...pages), end: Math.max(...pages) };
  }, [surah]);

  // --- Effects ---

  useEffect(() => {
    // Load bookmarks
    setBookmarks(quranService.getBookmarks());

    const fetchSurah = async () => {
      setLoading(true);
      // Reset state for new Surah
      setSurah(null);
      setActiveAyahId(null);
      setIsPlaying(false);
      setSearchResults([]); // Clear search results to prevent stale data crashes
      setSearchQuery('');
      setUsingFallback(false);
      setHighlightTerm('');
      setInteractionSource(null);
      
      try {
        const data = await quranService.getSurah(surahNumber);
        setSurah(data);
        // Set initial page if not set (e.g. fresh load)
        if (data.ayahs.length > 0 && !location.state?.scrollToAyah) {
            setCurrentPage(data.ayahs[0].page);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSurah();
    
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src'); // Better than src="" to avoid errors
            audioRef.current.load(); 
        }
    };
  }, [surahNumber]);

  useEffect(() => {
    if (!surah) return;
    
    if (location.state?.scrollToAyah) {
       const targetId = location.state.scrollToAyah;
       setActiveAyahId(targetId);
       setInteractionSource('search'); // Assume navigation is a form of search/direct access
       const targetAyah = surah.ayahs.find(a => a.numberInSurah === targetId);
       if (targetAyah) setCurrentPage(targetAyah.page);
    } else {
       // Default to first ayah/page if no state provided and not already set
       if (!activeAyahId) setActiveAyahId(1);
    }

    // Auto-open Tafsir if requested via navigation state
    if (location.state?.showTafsir) {
        setShowTafsir(true);
        if (!location.state?.scrollToAyah && !activeAyahId) {
             setActiveAyahId(1);
        }
    }
  }, [surah, location.state]);

  // Sync Page with Active Ayah (Text Mode Only)
  useEffect(() => {
      if (readingMode === 'page' || !surah || !activeAyahId) return;
      const ayah = surah.ayahs.find(a => a.numberInSurah === activeAyahId);
      if (ayah && ayah.page !== currentPage) {
          setCurrentPage(ayah.page);
      }
  }, [activeAyahId, surah, readingMode]);

  // Scroll to Ayah (Text Mode Only)
  useEffect(() => {
    if (readingMode === 'text' && activeAyahId && !loading) {
      setTimeout(() => {
        const element = document.getElementById(`ayah-${activeAyahId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [activeAyahId, loading, readingMode]);

  // Preload Images for Page Mode
  useEffect(() => {
      if (readingMode === 'page' && currentPage) {
          const preloadImage = (pageNum: number) => {
              const img = new Image();
              img.src = quranService.getPageUrl(pageNum);
          };
          if (currentPage < 604) preloadImage(currentPage + 1);
          if (currentPage > 1) preloadImage(currentPage - 1);
      }
  }, [currentPage, readingMode]);

  // Search Logic
  useEffect(() => {
      if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
      }

      const timer = setTimeout(async () => {
          setIsSearching(true);
          const normalizedQuery = normalizeArabic(searchQuery);

          if (searchScope === 'surah' && surah) {
              // Local Search
              const results = surah.ayahs.filter(ayah => 
                  normalizeArabic(ayah.text).includes(normalizedQuery)
              );
              setSearchResults(results);
              setIsSearching(false);
          } else {
              // Global Search
              try {
                  const results = await quranService.searchGlobal(searchQuery);
                  setSearchResults(results);
              } catch (e) {
                  console.error(e);
                  setSearchResults([]);
              } finally {
                  setIsSearching(false);
              }
          }
      }, 500);

      return () => clearTimeout(timer);
  }, [searchQuery, searchScope, surah]);

  // --- Handlers ---

  const getAudioUrl = (surahNum: number, ayahNum: number, reciterOverride?: string) => {
      const rId = reciterOverride || reciterId;
      const reciter = quranService.RECITERS.find(r => r.id === rId);
      const subpath = reciter ? reciter.subpath : 'Alafasy_128kbps';
      const s = surahNum.toString().padStart(3, '0');
      const a = ayahNum.toString().padStart(3, '0');
      return `https://everyayah.com/data/${subpath}/${s}${a}.mp3`;
  };

  const stateRef = useRef({ 
      memorizeMode, repeatCount, currentRepeat, activeAyahId, surah 
  });

  useEffect(() => {
      stateRef.current = { memorizeMode, repeatCount, currentRepeat, activeAyahId, surah };
  }, [memorizeMode, repeatCount, currentRepeat, activeAyahId, surah]);

  const playAyah = useCallback((ayahNumber: number, isRepetition = false, useFallback = false) => {
      const currentSurah = stateRef.current.surah;
      if (!currentSurah) return;
      
      const ayah = currentSurah.ayahs.find(a => a.numberInSurah === ayahNumber);
      if (!ayah) return;

      if (!audioRef.current) {
          audioRef.current = new Audio();
      }

      const url = getAudioUrl(surahNumber, ayahNumber, useFallback ? quranService.DEFAULT_RECITER_ID : undefined);
      const isSameSource = audioRef.current.src === url;
      
      // If we are just toggling play/pause on the SAME verse
      if (isSameSource && !isRepetition && activeAyahId === ayahNumber) {
          if (audioRef.current.paused) {
              audioRef.current.play()
                  .then(() => setIsPlaying(true))
                  .catch(e => console.error("Resume error:", e));
          } else {
              audioRef.current.pause();
              setIsPlaying(false);
          }
          return;
      }

      // If switching verses or starting fresh
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackSpeed;
      
      setActiveAyahId(ayahNumber);
      setInteractionSource('audio');
      setIsPlaying(true);
      setUsingFallback(useFallback);
      
      audioRef.current.onerror = (e) => {
          console.error("Audio playback error", e);
          if (!useFallback && reciterId !== quranService.DEFAULT_RECITER_ID) {
              playAyah(ayahNumber, false, true);
          } else {
              setIsPlaying(false);
              setUsingFallback(false);
          }
      };

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
          playPromise.catch(e => {
              console.error("Play promise error:", e);
              if (e.name === 'NotSupportedError' || e.name === 'NotAllowedError') {
                  setIsPlaying(false);
              }
          });
      }

      audioRef.current.onended = () => {
          const { memorizeMode, repeatCount, currentRepeat, surah } = stateRef.current;
          
          if (memorizeMode && (repeatCount === Infinity || currentRepeat < repeatCount)) {
              setCurrentRepeat(prev => prev + 1);
              playAyah(ayahNumber, true, useFallback);
          } else {
              setCurrentRepeat(0);
              const nextNum = ayahNumber + 1;
              if (surah && nextNum <= surah.numberOfAyahs) {
                  playAyah(nextNum, false, useFallback);
              } else {
                  setIsPlaying(false);
                  setUsingFallback(false);
              }
          }
      };
  }, [surahNumber, reciterId, playbackSpeed, activeAyahId]);

  const togglePlay = () => {
      if (activeAyahId) {
          playAyah(activeAyahId);
      } else {
          playAyah(1);
      }
  };

  const handleNextAyah = () => {
      if (!surah || !activeAyahId) return;
      setCurrentRepeat(0);
      if (activeAyahId < surah.numberOfAyahs) {
          playAyah(activeAyahId + 1);
      }
  };

  const handlePrevAyah = () => {
      if (!surah || !activeAyahId) return;
      setCurrentRepeat(0);
      if (activeAyahId > 1) {
          playAyah(activeAyahId - 1);
      }
  };

  const handleReciterChange = (id: string) => {
      setReciterId(id);
      setUsingFallback(false);
      quranService.savePreferredReciter(id);
  };

  const handleSearchResultClick = (result: SearchResult | Ayah) => {
      const targetSurahNum = 'surah' in result ? result.surah.number : surahNumber;
      const targetAyahNum = result.numberInSurah;

      setShowSearch(false);

      if (targetSurahNum === surahNumber) {
          setActiveAyahId(targetAyahNum);
          setInteractionSource('search');
          setHighlightTerm(searchQuery);
          // Only sync page if in text mode, page mode handles its own state
          if (readingMode === 'text') {
              const localAyah = surah?.ayahs.find(a => a.numberInSurah === targetAyahNum);
              if (localAyah) setCurrentPage(localAyah.page);
          }
      } else {
          navigate(`/quran/read/${targetSurahNum}`, { state: { scrollToAyah: targetAyahNum }});
      }
  };

  const handleVerseClick = (ayahNum: number) => {
      setActiveAyahId(ayahNum);
      setInteractionSource('click');
      setHighlightTerm('');
  };

  const handleBookmarkToggle = () => {
      if (!activeAyahId && readingMode === 'text') return;
      
      // In page mode, we bookmark the first ayah of the page if no specific ayah is active
      const targetAyah = activeAyahId || (surah?.ayahs.find(a => a.page === currentPage)?.numberInSurah || 1);

      if (isBookmarked) {
          const updated = quranService.removeBookmark(surahNumber, targetAyah);
          setBookmarks(updated);
      } else {
          const newBookmark: quranService.Bookmark = {
              surahNumber,
              ayahNumber: targetAyah,
              timestamp: Date.now(),
              pageNumber: currentPage || undefined
          };
          const updated = quranService.addBookmark(newBookmark);
          setBookmarks(updated);
      }
  };

  // --- Page Navigation Handlers ---

  const goToNextPage = () => {
      if (!currentPage) return;
      
      // Check if next page is beyond current surah
      if (currentPage >= surahPageRange.end) {
          if (surahNumber < 114) {
              navigate(`/quran/read/${surahNumber + 1}`);
          }
      } else {
          setCurrentPage(prev => (prev ? prev + 1 : prev));
          setImageLoading(true);
      }
  };

  const goToPrevPage = () => {
      if (!currentPage) return;

      // Check if prev page is before current surah
      if (currentPage <= surahPageRange.start) {
          if (surahNumber > 1) {
              // We want to go to the *last* page of the previous Surah
              // But we don't know it without loading data. 
              // Standard behavior: Go to start of previous Surah
              navigate(`/quran/read/${surahNumber - 1}`);
          }
      } else {
          setCurrentPage(prev => (prev ? prev - 1 : prev));
          setImageLoading(true);
      }
  };

  // --- Swipe Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    
    const xDistance = touchStartX.current - touchEndX.current;
    const yDistance = touchStartY.current - touchEndY.current;
    
    if (Math.abs(yDistance) > Math.abs(xDistance)) return; // Ignore vertical scrolls

    if (Math.abs(xDistance) < minSwipeDistance) return;

    if (readingMode === 'page') {
        // Page Mode Logic
        if (xDistance > 0) {
            // Swiped Left (Next Page in LTR, Prev Page in RTL context? No, physical direction)
            // In RTL interface, swiping Right->Left (positive X) usually means "Next" content visually?
            // Actually, for a book: 
            // Swiping Right (drag right) -> Go to Previous Page (Reveal left side)
            // Swiping Left (drag left) -> Go to Next Page (Reveal right side)
            goToNextPage();
        } else {
            goToPrevPage();
        }
    } else {
        // Text Mode Logic (Surah Navigation)
        if (xDistance > 0) {
           if (surahNumber < 114) navigate(`/quran/read/${surahNumber + 1}`);
        } else {
           if (surahNumber > 1) navigate(`/quran/read/${surahNumber - 1}`);
        }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-dark-bg"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  if (!surah) return <ErrorState onRetry={() => window.location.reload()} />;

  const isBismillah = surahNumber !== 1 && surahNumber !== 9;

  return (
    <div className="h-full bg-[#FAF9F6] dark:bg-dark-bg flex flex-col relative overflow-hidden transition-colors duration-300">
        
        {/* --- Top Bar --- */}
        <div 
            className={`
                absolute top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between
                bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-gray-100 dark:border-dark-border
                transition-transform duration-300 shadow-sm
                ${uiVisible ? 'translate-y-0' : '-translate-y-full'}
            `}
        >
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/quran')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-600 dark:text-gray-300">
                    <ArrowRight size={20} />
                </button>
                <div>
                    <h1 className="font-bold text-lg text-gray-800 dark:text-white font-arabicHead leading-none">{surah.name}</h1>
                    <span className="text-xs text-gray-400 font-medium">صفحة {currentPage}</span>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
                {/* Reading Mode Toggle */}
                <div className="bg-gray-100 dark:bg-dark-elevated p-1 rounded-lg flex mr-1">
                    <button 
                        onClick={() => setReadingMode('text')}
                        className={`p-1.5 rounded-md transition-all ${readingMode === 'text' ? 'bg-white dark:bg-dark-surface shadow text-emerald-600' : 'text-gray-400'}`}
                        title="وضعية النص"
                    >
                        <FileText size={18} />
                    </button>
                    <button 
                        onClick={() => setReadingMode('page')}
                        className={`p-1.5 rounded-md transition-all ${readingMode === 'page' ? 'bg-white dark:bg-dark-surface shadow text-emerald-600' : 'text-gray-400'}`}
                        title="وضعية المصحف"
                    >
                        <Book size={18} />
                    </button>
                </div>

                <button 
                    onClick={handleBookmarkToggle}
                    className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-elevated'}`}
                    title={isBookmarked ? "إزالة العلامة" : "حفظ المكان"}
                >
                    <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                </button>

                {readingMode === 'text' && memorizeMode && (
                    <button 
                        onClick={() => setHideText(!hideText)}
                        className={`p-2 rounded-full transition-colors ${hideText ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 dark:bg-dark-elevated dark:text-gray-300'}`}
                        title="إخفاء النص"
                    >
                        {hideText ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}

                <button 
                    onClick={() => setShowSearch(true)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-600 dark:text-gray-300"
                    title="بحث"
                >
                    <Search size={20} />
                </button>
                
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated relative">
                    <Settings size={20} className="text-gray-600 dark:text-gray-300" />
                    {memorizeMode && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>}
                </button>
            </div>
        </div>

        {/* --- Main Content Area --- */}
        <div 
            className="flex-1 relative w-full h-full flex flex-col"
            onClick={() => setUiVisible(!uiVisible)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {readingMode === 'text' ? (
                // --- Text Mode View ---
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-20 animate-fadeIn scroll-smooth">
                    <div className="max-w-3xl mx-auto text-justify leading-[3]" dir="rtl">
                        {isBismillah && (
                            <div className="text-center mb-10 font-quran text-3xl text-gray-800 dark:text-gray-200">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </div>
                        )}
                        {surah.ayahs.map((ayah) => {
                            let text = ayah.text;
                            if (surahNumber !== 1 && ayah.numberInSurah === 1) text = text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "").trim();
                            
                            // Active state logic
                            const isActive = activeAyahId === ayah.numberInSurah;
                            // Only show background highlight if manual user click or audio
                            const showBg = isActive && (interactionSource === 'click' || interactionSource === 'audio' || interactionSource === 'search');
                            // Only show text highlighting if user searched and we have a term
                            const showTextHighlight = isActive && interactionSource === 'search' && highlightTerm;

                            let htmlContent = text;
                            
                            if (showTextHighlight) {
                                const regex = getHighlightRegex(highlightTerm);
                                if (regex) {
                                    htmlContent = text.replace(regex, (match) => `<span class="bg-yellow-200 dark:bg-yellow-500/30 text-gray-900 dark:text-white rounded px-1">${match}</span>`);
                                }
                            } else if (tajweedMode) {
                                htmlContent = applyTajweed(text);
                            }

                            return (
                                <span 
                                    key={ayah.number} 
                                    id={`ayah-${ayah.numberInSurah}`}
                                    onClick={(e) => { e.stopPropagation(); handleVerseClick(ayah.numberInSurah); }}
                                    onDoubleClick={(e) => { e.stopPropagation(); playAyah(ayah.numberInSurah); }}
                                    className={`
                                        font-quran inline px-1 py-1 rounded-lg cursor-pointer transition-colors duration-200 scroll-m-32 select-none
                                        ${showBg ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-200 dark:ring-emerald-800' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'}
                                        ${hideText ? 'blur-[6px] hover:blur-none transition-all' : ''}
                                    `}
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                    <span className="text-emerald-600 dark:text-emerald-400 text-[0.6em] mx-1 font-quran inline-block">
                                        ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                                    </span>
                                    
                                    {isActive && (
                                        <div className="inline-flex items-center gap-1 align-middle mx-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); playAyah(ayah.numberInSurah); }}
                                                className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-sm"
                                                title={isPlaying ? "إيقاف" : "استماع"}
                                            >
                                                {isPlaying && activeAyahId === ayah.numberInSurah ? <Pause size={12} fill="currentColor"/> : <Play size={12} fill="currentColor" className="ml-0.5"/>}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowTafsir(true); }}
                                                className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                                                title="تفسير"
                                            >
                                                <BookOpen size={12} />
                                            </button>
                                        </div>
                                    )}
                                </span>
                            );
                        })}
                    </div>

                    {/* Surah Navigation Footer */}
                    <div className="max-w-3xl mx-auto mt-16 mb-24 px-4 flex justify-between items-center" dir="rtl">
                        {surahNumber > 1 ? (
                            <button
                                onClick={() => navigate(`/quran/read/${surahNumber - 1}`)}
                                className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border hover:border-emerald-200 dark:hover:border-emerald-800 transition-all shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-400 mb-0.5">السورة السابقة</span>
                                    <span className="block font-bold text-gray-800 dark:text-gray-200 font-arabicHead">
                                        {QURAN_META[surahNumber - 2].name}
                                    </span>
                                </div>
                            </button>
                        ) : <div />}

                        {surahNumber < 114 ? (
                            <button
                                onClick={() => navigate(`/quran/read/${surahNumber + 1}`)}
                                className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border hover:border-emerald-200 dark:hover:border-emerald-800 transition-all shadow-sm flex-row-reverse text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <ChevronLeft size={20} />
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-400 mb-0.5">السورة التالية</span>
                                    <span className="block font-bold text-gray-800 dark:text-gray-200 font-arabicHead">
                                        {QURAN_META[surahNumber].name}
                                    </span>
                                </div>
                            </button>
                        ) : <div />}
                    </div>
                </div>
            ) : (
                // --- Page Mode View (Mushaf) ---
                <div className="flex-1 flex flex-col items-center justify-center bg-[#fdfdfd] dark:bg-dark-bg h-full relative">
                    {currentPage && (
                        <div className="relative w-full h-full flex items-center justify-center p-2 md:p-4">
                            {/* Loading Indicator */}
                            {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 dark:bg-black/50 z-10">
                                    <Loader2 size={40} className="animate-spin text-emerald-500" />
                                </div>
                            )}
                            
                            <img 
                                src={quranService.getPageUrl(currentPage)} 
                                alt={`Quran Page ${currentPage}`}
                                onLoad={() => setImageLoading(false)}
                                className="max-w-full max-h-full object-contain shadow-lg dark:shadow-none dark:opacity-90 transition-opacity duration-300"
                                style={{ opacity: imageLoading ? 0 : 1 }}
                            />

                            {/* Touch Zones for Tap Navigation (Optional helper on desktop) */}
                            <div className="absolute inset-y-0 left-0 w-1/4 z-0 cursor-pointer" onClick={(e) => {e.stopPropagation(); goToNextPage()}} title="الصفحة التالية"></div>
                            <div className="absolute inset-y-0 right-0 w-1/4 z-0 cursor-pointer" onClick={(e) => {e.stopPropagation(); goToPrevPage()}} title="الصفحة السابقة"></div>
                        </div>
                    )}
                    
                    {/* Page Number Indicator */}
                    <div className="absolute bottom-16 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-mono backdrop-blur-sm pointer-events-none">
                        Page {currentPage}
                    </div>
                </div>
            )}
        </div>

        {/* --- Bottom Controls --- */}
        <div 
            className={`
                absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 flex flex-col justify-end
                ${uiVisible ? 'translate-y-0' : 'translate-y-full'}
            `}
        >
            <div className="bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border px-4 py-4 md:px-8 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4">
                    <button onClick={handleNextAyah} className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <FastForward size={20} className="rotate-180" />
                    </button>
                    <button 
                        onClick={togglePlay}
                        className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={handlePrevAyah} className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <Rewind size={20} className="rotate-180" />
                    </button>
                </div>

                <div className="hidden md:flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                        {activeAyahData ? `الآية ${toArabicNumerals(activeAyahData.numberInSurah)}` : surah.name}
                    </span>
                    {usingFallback && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            القارئ البديل (العفاسي)
                        </span>
                    )}
                    {memorizeMode && repeatCount > 0 ? (
                        <span className="text-xs text-emerald-500 font-medium animate-pulse">
                            تكرار {currentRepeat + 1}/{repeatCount === Infinity ? '∞' : repeatCount + 1}
                        </span>
                    ) : !usingFallback && (
                        <span className="text-xs text-gray-400">
                            {quranService.RECITERS.find(r => r.id === reciterId)?.name}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            const speeds = [1, 1.25, 1.5, 0.75];
                            const idx = speeds.indexOf(playbackSpeed);
                            const next = speeds[(idx + 1) % speeds.length];
                            setPlaybackSpeed(next);
                            if(audioRef.current) audioRef.current.playbackRate = next;
                        }}
                        className="text-xs font-bold bg-gray-100 dark:bg-dark-elevated px-2 py-1 rounded text-gray-600 dark:text-gray-300 w-12 text-center"
                    >
                        {playbackSpeed}x
                    </button>
                    {readingMode === 'text' && (
                        <button 
                            onClick={() => setShowTafsir(true)} 
                            className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 transition-colors"
                            title="التفسير"
                        >
                            <BookOpen size={22} />
                        </button>
                    )}
                    {readingMode === 'page' && (
                        <button 
                            onClick={() => {
                                // For page mode, we open tafsir for the first ayah on the page or active ayah
                                const target = activeAyahId || (surah.ayahs.find(a => a.page === currentPage)?.numberInSurah || 1);
                                setActiveAyahId(target);
                                setShowTafsir(true);
                            }}
                            className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 transition-colors"
                            title="التفسير"
                        >
                            <Info size={22} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* --- Search Modal --- */}
        {showSearch && (
            <div className="fixed inset-0 z-50 bg-white dark:bg-dark-bg flex flex-col animate-fadeIn">
                {/* Search Header */}
                <div className="px-4 py-4 border-b border-gray-100 dark:border-dark-border flex items-center gap-3 bg-white dark:bg-dark-surface shadow-sm">
                    <button onClick={() => setShowSearch(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-500 dark:text-gray-300">
                        <ArrowRight size={24} />
                    </button>
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="ابحث عن كلمة أو آية..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-elevated border-none focus:ring-2 focus:ring-emerald-500 font-arabic text-gray-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* Scope Filter */}
                <div className="p-2 flex gap-2 bg-gray-50 dark:bg-dark-bg">
                    <button 
                        onClick={() => setSearchScope('surah')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${searchScope === 'surah' ? 'bg-white dark:bg-dark-surface text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-surface'}`}
                    >
                        في سورة {surah ? surah.name : '...'}
                    </button>
                    <button 
                        onClick={() => setSearchScope('global')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${searchScope === 'global' ? 'bg-white dark:bg-dark-surface text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-surface'}`}
                    >
                        في كل القرآن
                    </button>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isSearching ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchResults.length === 0 && searchQuery && (
                                <div className="text-center py-10 text-gray-400">
                                    لا توجد نتائج
                                </div>
                            )}
                            {searchResults.map((result: any, idx) => {
                                const isGlobal = 'surah' in result && typeof result.surah === 'object';
                                const ayahText = result.text;
                                const sName = isGlobal ? result.surah.name : (surah ? surah.name : '');
                                const ayahNum = result.numberInSurah;

                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSearchResultClick(result)}
                                        className="w-full text-right bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all shadow-sm group"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
                                                {sName} - آية {toArabicNumerals(ayahNum)}
                                            </span>
                                            <ChevronLeft size={16} className="text-gray-300 group-hover:text-emerald-500 rtl:rotate-0" />
                                        </div>
                                        <p className="font-quran text-lg text-gray-800 dark:text-gray-200 leading-loose line-clamp-2">
                                            {ayahText}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- Tafsir Modal --- */}
        {showTafsir && (activeAyahData || (readingMode === 'page' && currentPage)) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setShowTafsir(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-lg max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-popIn" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-elevated">
                        <h3 className="font-bold text-lg dark:text-white">التفسير الميسر</h3>
                        <button onClick={() => setShowTafsir(false)}><X size={20} className="text-gray-500" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {/* If in Page mode and no specific Ayah selected, we might want to list all ayahs or just show the top one. 
                            Current implementation tries to set activeAyahId before opening. */}
                        {activeAyahData ? (
                            <>
                                <p className="font-quran text-2xl text-emerald-800 dark:text-emerald-400 mb-6 leading-loose border-b border-gray-100 dark:border-dark-border pb-4">
                                    {activeAyahData.text}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 leading-loose text-justify text-lg font-arabic">
                                    {activeAyahData.tafsir || "عذراً، التفسير غير متوفر لهذه الآية حالياً."}
                                </p>
                            </>
                        ) : (
                            <p className="text-center text-gray-500">الرجاء تحديد آية لعرض تفسيرها</p>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- Settings Modal --- */}
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-2xl p-6 relative z-10 animate-popIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-6 dark:text-white">إعدادات القراءة</h3>
                    <div className="space-y-6">
                        {/* Font Size (Text Mode Only) */}
                        {readingMode === 'text' && (
                            <div>
                                <label className="text-sm text-gray-500 mb-2 block">حجم الخط</label>
                                <div className="flex items-center gap-4">
                                    <Type size={16} className="text-gray-400" />
                                    <input 
                                        type="range" min="20" max="50" value={fontSize} 
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="flex-1 accent-emerald-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reciter */}
                        <div>
                            <label className="text-sm text-gray-500 mb-2 block flex items-center gap-2"><Mic size={14}/> القارئ</label>
                            <select 
                                value={reciterId} 
                                onChange={(e) => handleReciterChange(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-200 font-arabic"
                            >
                                {quranService.RECITERS.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tajweed Toggle (Text Mode Only) */}
                        {readingMode === 'text' && (
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-700 dark:text-gray-200">التجويد الملون</span>
                                <button 
                                    onClick={() => setTajweedMode(!tajweedMode)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${tajweedMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${tajweedMode ? 'left-1' : 'left-7'}`}></div>
                                </button>
                            </div>
                        )}

                        {/* Memorization Mode Section */}
                        <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={18} className="text-emerald-600" />
                                    <span className="font-bold text-gray-700 dark:text-gray-200">وضع التحفيظ</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        setMemorizeMode(!memorizeMode);
                                        if (!memorizeMode) setHideText(false); // Reset blur when turning on
                                    }}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${memorizeMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${memorizeMode ? 'left-1' : 'left-7'}`}></div>
                                </button>
                            </div>
                            
                            {memorizeMode && (
                                <div className="space-y-4 animate-fadeIn">
                                    {/* Repeat Control */}
                                    <div>
                                        <label className="text-xs text-gray-500 mb-2 block">تكرار الآية</label>
                                        <div className="flex gap-2">
                                            {[0, 1, 3, 5].map(count => (
                                                <button 
                                                    key={count}
                                                    onClick={() => { setRepeatCount(count); setCurrentRepeat(0); }}
                                                    className={`flex-1 py-1 rounded text-xs font-bold border transition-colors ${repeatCount === count ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                                                >
                                                    {count === 0 ? 'مرة' : count + 1}
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => { setRepeatCount(Infinity); setCurrentRepeat(0); }}
                                                className={`flex-1 py-1 rounded text-xs font-bold border transition-colors ${repeatCount === Infinity ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                                            >
                                                <Infinity size={14} className="mx-auto" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hide Text Toggle (Settings shortcut) */}
                                    {readingMode === 'text' && (
                                        <button 
                                            onClick={() => setHideText(!hideText)}
                                            className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700"
                                        >
                                            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                {hideText ? <EyeOff size={16} /> : <Eye size={16} />}
                                                إخفاء النص (اختبار)
                                            </span>
                                            <div className={`w-3 h-3 rounded-full ${hideText ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="mt-8 w-full py-3 bg-gray-100 dark:bg-dark-elevated rounded-xl font-bold text-gray-700 dark:text-gray-300">
                        إغلاق
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default QuranReader;
