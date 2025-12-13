
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as quranService from '../services/quranService';
import * as storage from '../services/storage';
import { SurahData, Ayah, SearchResult, ReadingMode } from '../types';
import { QURAN_META } from '../data/quranMeta';
import { 
  ArrowRight, Play, Pause, Settings, BookOpen, ChevronLeft, ChevronRight,
  Loader2, Type, X, RefreshCw, Eye, EyeOff, Mic, 
  FastForward, Rewind, Infinity, Search, AlertTriangle, Heart,
  FileText, Book, Info, Moon, Sun, Coffee
} from 'lucide-react';
import ErrorState from '../components/ErrorState';
import { toArabicNumerals, applyTajweed, normalizeArabic, getHighlightRegex } from '../utils';
import MushafPagesViewer from '../components/MushafPagesViewer';

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
  const [readingMode, setReadingMode] = useState<ReadingMode>('text');
  const [pageTheme, setPageTheme] = useState<storage.PageTheme>(() => storage.getQuranTheme());

  // Track page for Mushaf mode sync
  const [currentMushafPage, setCurrentMushafPage] = useState<number>(1);
  
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

  // Bookmarks State (Saved Verses)
  const [bookmarks, setBookmarks] = useState<quranService.Bookmark[]>([]);

  // Swipe Gestures State (Text Mode Only)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 50;
  
  // --- Data Processing ---
  
  const activeAyahData = useMemo(() => {
      return surah?.ayahs.find(a => a.numberInSurah === activeAyahId);
  }, [surah, activeAyahId]);

  // Check if current active ayah is in favorites
  const isBookmarked = useMemo(() => {
      if (!activeAyahId) return false;
      return bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === activeAyahId);
  }, [bookmarks, surahNumber, activeAyahId]);

  // --- Effects ---

  useEffect(() => {
    // Load saved favorites
    setBookmarks(quranService.getBookmarks());

    const fetchSurah = async () => {
      setLoading(true);
      // Reset state for new Surah
      setSurah(null);
      setActiveAyahId(null);
      setIsPlaying(false);
      setSearchResults([]); 
      setSearchQuery('');
      setUsingFallback(false);
      setHighlightTerm('');
      setInteractionSource(null);
      
      try {
        const data = await quranService.getSurah(surahNumber);
        setSurah(data);
        // Set initial mushaf page to first page of surah
        if (data.ayahs.length > 0) {
            setCurrentMushafPage(data.ayahs[0].page);
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
            audioRef.current.removeAttribute('src'); 
            audioRef.current.load(); 
        }
    };
  }, [surahNumber]);

  useEffect(() => {
    if (!surah) return;
    
    if (location.state?.scrollToAyah) {
       const targetId = location.state.scrollToAyah;
       setActiveAyahId(targetId);
       setInteractionSource('search'); 
       // Sync page for Mushaf mode
       const targetAyah = surah.ayahs.find(a => a.numberInSurah === targetId);
       if (targetAyah) setCurrentMushafPage(targetAyah.page);
    } else {
       // Default to first ayah
       if (!activeAyahId) setActiveAyahId(1);
    }

    if (location.state?.showTafsir) {
        setShowTafsir(true);
        if (!location.state?.scrollToAyah && !activeAyahId) {
             setActiveAyahId(1);
        }
    }
  }, [surah, location.state]);

  // Scroll to Ayah
  useEffect(() => {
    if (activeAyahId && !loading && readingMode === 'text') {
      setTimeout(() => {
        const element = document.getElementById(`ayah-${activeAyahId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [activeAyahId, loading, readingMode]);

  // --- Auto-Save Last Read Logic ---
  useEffect(() => {
      if (!surah) return;

      // Determine what to save based on active mode
      let trackedAyah = activeAyahId || 1;
      let trackedPage = currentMushafPage;

      if (readingMode === 'text' && activeAyahId) {
          const ayahObj = surah.ayahs.find(a => a.numberInSurah === activeAyahId);
          if (ayahObj) trackedPage = ayahObj.page;
      } 
      else if (readingMode === 'page') {
          // If in page mode, try to approximate the ayah. 
          // We find the first ayah on this page belonging to current surah.
          // Note: If the page changes to a different surah entirely, this logic 
          // keeps the last known ayah of the CURRENT surah, which is safe enough.
          const firstAyahOnPage = surah.ayahs.find(a => a.page === currentMushafPage);
          if (firstAyahOnPage) trackedAyah = firstAyahOnPage.numberInSurah;
      }

      quranService.saveLastRead({
          surahNumber,
          ayahNumber: trackedAyah,
          pageNumber: trackedPage,
          timestamp: Date.now()
      });
  }, [surahNumber, activeAyahId, currentMushafPage, readingMode, surah]);

  // Update theme handling
  const handleThemeChange = (newTheme: storage.PageTheme) => {
      setPageTheme(newTheme);
      storage.saveQuranTheme(newTheme);
  };

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

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackSpeed;
      
      setActiveAyahId(ayahNumber);
      setInteractionSource('audio');
      setIsPlaying(true);
      setUsingFallback(useFallback);
      
      // Update page tracking for continuity if switching modes
      // Or simply to sync Mushaf viewer
      if (ayah.page) {
          setCurrentMushafPage(ayah.page);
      }
      
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
          
          if (memorizeMode && (repeatCount === Number.POSITIVE_INFINITY || currentRepeat < repeatCount)) {
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
  }, [surahNumber, reciterId, playbackSpeed, activeAyahId, readingMode]);

  const togglePlay = () => {
      if (activeAyahId) {
          playAyah(activeAyahId);
      } else {
          playAyah(1);
      }
  };

  const handleReciterChange = (id: string) => {
      setReciterId(id);
      quranService.savePreferredReciter(id);
      // Stop current playback if switching reciter
      if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
      }
  };

  const handleSearchResultClick = (result: SearchResult | Ayah) => {
      const targetSurahNum = 'surah' in result ? result.surah.number : surahNumber;
      const targetAyahNum = result.numberInSurah;

      setShowSearch(false);

      if (targetSurahNum === surahNumber) {
          setActiveAyahId(targetAyahNum);
          setInteractionSource('search');
          setHighlightTerm(searchQuery);
          // Sync page
          const localAyah = surah?.ayahs.find(a => a.numberInSurah === targetAyahNum);
          if (localAyah) setCurrentMushafPage(localAyah.page);
      } else {
          navigate(`/quran/read/${targetSurahNum}`, { state: { scrollToAyah: targetAyahNum }});
      }
  };

  const handleVerseClick = (ayahNum: number) => {
      setActiveAyahId(ayahNum);
      setInteractionSource('click');
      setHighlightTerm('');
  };

  const handleFavoriteToggle = () => {
      if (!activeAyahId) return;
      
      const ayahObj = surah?.ayahs.find(a => a.numberInSurah === activeAyahId);

      if (isBookmarked) {
          const updated = quranService.removeBookmark(surahNumber, activeAyahId);
          setBookmarks(updated);
      } else {
          const newBookmark: quranService.Bookmark = {
              surahNumber,
              ayahNumber: activeAyahId,
              timestamp: Date.now(),
              pageNumber: ayahObj?.page
          };
          const updated = quranService.addBookmark(newBookmark);
          setBookmarks(updated);
      }
  };

  // --- Theme Classes ---
  const getThemeClasses = () => {
      switch (pageTheme) {
          case 'sepia': return 'bg-[#F4ECD8] text-[#433422]';
          case 'dark': return 'bg-[#151515] text-[#D1D5DB]';
          default: return 'bg-[#FAF9F6] text-gray-800'; // Light/Default
      }
  };

  const getOverlayClasses = () => {
      switch (pageTheme) {
          case 'sepia': return 'bg-[#e9ded0]/90 border-[#d0c0a0] text-[#5c4b37]';
          case 'dark': return 'bg-[#1a1a1a]/90 border-gray-800 text-gray-200';
          default: return 'bg-white/90 border-gray-100 text-gray-800';
      }
  };

  // --- Swipe Handlers (Text Mode Only) ---
  // We only attach these if readingMode === 'text'
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

    if (xDistance > 0) {
        if (surahNumber < 114) navigate(`/quran/read/${surahNumber + 1}`);
    } else {
        if (surahNumber > 1) navigate(`/quran/read/${surahNumber - 1}`);
    }
  };

  if (loading) return <div className={`h-full flex items-center justify-center ${getThemeClasses()}`}><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  if (!surah) return <ErrorState onRetry={() => window.location.reload()} />;

  const isBismillah = surahNumber !== 1 && surahNumber !== 9;
  const themeClass = getThemeClasses();
  const overlayClass = getOverlayClasses();

  return (
    <div className={`h-full flex flex-col relative overflow-hidden transition-colors duration-300 ${themeClass}`}>
        
        {/* --- Top Bar (Text Mode) --- */}
        {readingMode === 'text' && (
        <div 
            className={`
                absolute top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between
                backdrop-blur-md border-b
                transition-transform duration-300 shadow-sm
                ${uiVisible ? 'translate-y-0' : '-translate-y-full'}
                ${overlayClass}
            `}
        >
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/quran')} className={`p-2 rounded-full hover:bg-black/5 transition-colors`}>
                    <ArrowRight size={20} />
                </button>
                <div>
                    <h1 className="font-bold text-lg font-arabicHead leading-none">{surah.name}</h1>
                    <span className="text-xs opacity-60 font-medium">الآيات {surah.numberOfAyahs}</span>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
                {/* Reading Mode Switch */}
                <div className="bg-black/5 p-1 rounded-lg flex mr-1">
                    <button 
                        onClick={() => setReadingMode('text')}
                        className={`p-1.5 rounded-md transition-all shadow ${pageTheme === 'dark' ? 'bg-gray-700 text-emerald-400' : 'bg-white text-emerald-600'}`}
                        title="وضعية النص"
                    >
                        <FileText size={18} />
                    </button>
                    <button 
                        onClick={() => setReadingMode('page')}
                        className="p-1.5 rounded-md transition-all opacity-50 hover:opacity-100"
                        title="وضعية المصحف"
                    >
                        <Book size={18} />
                    </button>
                </div>

                <button 
                    onClick={handleFavoriteToggle}
                    className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-red-500 bg-red-500/10' : 'hover:bg-black/5'}`}
                    title={isBookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                >
                    <Heart size={20} fill={isBookmarked ? "currentColor" : "none"} />
                </button>

                {memorizeMode && (
                    <button 
                        onClick={() => setHideText(!hideText)}
                        className={`p-2 rounded-full transition-colors ${hideText ? 'bg-red-500/10 text-red-600' : 'hover:bg-black/5'}`}
                        title="إخفاء النص"
                    >
                        {hideText ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}

                <button 
                    onClick={() => setShowSearch(true)}
                    className="p-2 rounded-full hover:bg-black/5 transition-colors"
                    title="بحث"
                >
                    <Search size={20} />
                </button>
                
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-black/5 transition-colors relative">
                    <Settings size={20} />
                    {memorizeMode && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>}
                </button>
            </div>
        </div>
        )}

        {/* --- Main Content Area --- */}
        {readingMode === 'text' ? (
            <div 
                className="flex-1 relative w-full h-full flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-20 animate-fadeIn scroll-smooth" onClick={() => setUiVisible(!uiVisible)}>
                    <div className="max-w-3xl mx-auto text-justify leading-[3]" dir="rtl">
                        {isBismillah && (
                            <div className="text-center mb-10 font-quran text-3xl opacity-80">
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
                                    htmlContent = text.replace(regex, (match) => `<span class="bg-yellow-300/50 rounded px-1">${match}</span>`);
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
                                        ${showBg ? 'bg-emerald-500/20 ring-2 ring-emerald-500/30' : 'hover:bg-black/5'}
                                        ${hideText ? 'blur-[6px] hover:blur-none transition-all' : ''}
                                    `}
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                    <span className="text-emerald-500 text-[0.6em] mx-1 font-quran inline-block">
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
                                                className="inline-flex items-center justify-center w-6 h-6 bg-blue-500/20 text-blue-600 rounded-full hover:bg-blue-500/30 transition-colors shadow-sm"
                                                title="تفسير"
                                            >
                                                <BookOpen size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleFavoriteToggle(); }}
                                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors shadow-sm ${isBookmarked && activeAyahId === ayah.numberInSurah ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'}`}
                                                title="إضافة للمفضلة"
                                            >
                                                <Heart size={12} fill={isBookmarked && activeAyahId === ayah.numberInSurah ? "currentColor" : "none"} />
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
                                className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all shadow-sm ${pageTheme === 'dark' ? 'border-gray-800 bg-gray-900 hover:border-emerald-800' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${pageTheme === 'dark' ? 'bg-gray-800 text-gray-400 group-hover:text-emerald-500' : 'bg-gray-50 text-gray-400 group-hover:text-emerald-500'}`}>
                                    <ChevronRight size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs opacity-60 mb-0.5">السورة السابقة</span>
                                    <span className="block font-bold font-arabicHead">
                                        {QURAN_META[surahNumber - 2].name}
                                    </span>
                                </div>
                            </button>
                        ) : <div />}

                        {surahNumber < 114 ? (
                            <button
                                onClick={() => navigate(`/quran/read/${surahNumber + 1}`)}
                                className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all shadow-sm flex-row-reverse text-left ${pageTheme === 'dark' ? 'border-gray-800 bg-gray-900 hover:border-emerald-800' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <ChevronLeft size={20} />
                                </div>
                                <div>
                                    <span className="block text-xs opacity-60 mb-0.5">السورة التالية</span>
                                    <span className="block font-bold font-arabicHead">
                                        {QURAN_META[surahNumber].name}
                                    </span>
                                </div>
                            </button>
                        ) : <div />}
                    </div>
                </div>
            </div>
        ) : (
            // --- Page Mode (Mushaf Viewer) ---
            <MushafPagesViewer 
                initialPage={currentMushafPage}
                onPageChange={setCurrentMushafPage}
                onClose={() => setReadingMode('text')}
                highlightedAyah={activeAyahId ? { surah: surahNumber, ayah: activeAyahId } : null}
                onAyahClick={(s, a) => {
                    // Handle click in Mushaf mode
                    // If playing, start from here
                    // If not playing, just select
                    if (s === surahNumber) {
                        handleVerseClick(a);
                        if (!isPlaying) playAyah(a);
                    } else {
                        // Different surah, just navigate for now
                        navigate(`/quran/read/${s}`, { state: { scrollToAyah: a } });
                    }
                }}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                reciterId={reciterId}
                onReciterChange={handleReciterChange}
            />
        )}
        
        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-fadeIn" onClick={() => setShowSettings(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slideUp text-gray-800 dark:text-white" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold font-arabicHead">إعدادات القراءة</h3>
                        <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 dark:bg-dark-bg rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Font Size */}
                        <div>
                            <label className="text-sm font-bold opacity-70 mb-3 block">حجم الخط</label>
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-dark-bg p-3 rounded-xl">
                                <span className="text-xs">A</span>
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="60" 
                                    value={fontSize} 
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <span className="text-xl">A</span>
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-gray-500">لون الصفحة:</span>
                            <div className={`flex gap-1 p-1 rounded-lg ${pageTheme === 'dark' ? 'bg-[#333]' : 'bg-gray-100'}`}>
                                <button 
                                    onClick={() => handleThemeChange('light')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${pageTheme === 'light' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    <Sun size={16} />
                                    أبيض
                                </button>
                                <button 
                                    onClick={() => handleThemeChange('sepia')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${pageTheme === 'sepia' ? 'bg-[#fbf0d6] text-[#5c4b37] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    <Coffee size={16} />
                                    كريمي
                                </button>
                                <button 
                                    onClick={() => handleThemeChange('dark')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${pageTheme === 'dark' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    <Moon size={16} />
                                    داكن
                                </button>
                            </div>
                        </div>

                        {/* Reciter */}
                        <div>
                            <label className="text-sm font-bold opacity-70 mb-3 block">القارئ</label>
                            <select 
                                value={reciterId}
                                onChange={(e) => handleReciterChange(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-emerald-500 font-arabic"
                            >
                                {quranService.RECITERS.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                                <span className="font-bold">وضع التجويد الملون</span>
                                <button 
                                    onClick={() => setTajweedMode(!tajweedMode)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${tajweedMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${tajweedMode ? 'left-1' : 'left-[calc(100%-1.5rem)]'}`}></span>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                                <span className="font-bold">وضع التحفيظ (تكرار)</span>
                                <button 
                                    onClick={() => setMemorizeMode(!memorizeMode)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${memorizeMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${memorizeMode ? 'left-1' : 'left-[calc(100%-1.5rem)]'}`}></span>
                                </button>
                            </div>
                        </div>

                        {memorizeMode && (
                            <div className="animate-slideUp">
                                <label className="text-sm font-bold opacity-70 mb-3 block">عدد مرات التكرار</label>
                                <div className="flex gap-2">
                                    {[0, 3, 5, 10, Number.POSITIVE_INFINITY].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setRepeatCount(count)}
                                            className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${repeatCount === count ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border opacity-70'}`}
                                        >
                                            {count === 0 ? 'لا' : count === Number.POSITIVE_INFINITY ? '∞' : count}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Search Modal */}
        {showSearch && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fadeIn" onClick={() => setShowSearch(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slideUp text-gray-800 dark:text-white" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 dark:border-dark-border flex gap-3 items-center">
                        <Search className="text-gray-400" />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="ابحث في القرآن الكريم..." 
                            className="flex-1 bg-transparent border-none outline-none text-lg font-arabic placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')}><X className="text-gray-400" /></button>}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-bg px-4 py-2 flex gap-4 text-sm font-bold text-gray-500">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="scope" 
                                checked={searchScope === 'surah'} 
                                onChange={() => setSearchScope('surah')}
                                className="accent-emerald-500"
                            />
                            في السورة الحالية
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="scope" 
                                checked={searchScope === 'global'} 
                                onChange={() => setSearchScope('global')}
                                className="accent-emerald-500"
                            />
                            في كل المصحف
                        </label>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {isSearching ? (
                            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map((res: any, idx: number) => {
                                    const isAyahType = 'numberInSurah' in res && !('surah' in res);
                                    // Normalize type
                                    const r = isAyahType ? { text: res.text, numberInSurah: res.numberInSurah, surah: { number: surahNumber, name: surah?.name } } : res;
                                    
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleSearchResultClick(r)}
                                            className="w-full text-right p-4 rounded-xl hover:bg-black/5 transition-colors border border-transparent hover:border-emerald-200 group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                    سورة {r.surah.name} - آية {r.numberInSurah}
                                                </span>
                                            </div>
                                            <p className="font-quran text-lg opacity-90 line-clamp-1" dir="rtl">
                                                {r.text}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : searchQuery ? (
                            <div className="py-12 text-center text-gray-400">لا توجد نتائج</div>
                        ) : (
                            <div className="py-12 text-center text-gray-400 opacity-50">ابدأ الكتابة للبحث</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Tafsir Drawer */}
        {showTafsir && activeAyahData && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6" onClick={() => setShowTafsir(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl animate-slideUp text-gray-800 dark:text-white" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-bg/50 sm:rounded-t-3xl">
                        <h3 className="font-bold text-lg font-arabicHead">
                            تفسير الآية {activeAyahData.numberInSurah}
                        </h3>
                        <button onClick={() => setShowTafsir(false)} className="p-2 bg-white dark:bg-dark-surface rounded-full shadow-sm">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto p-6 flex-1">
                        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                            <p className="font-quran text-2xl text-center leading-loose text-emerald-900 dark:text-emerald-100">
                                {activeAyahData.text}
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                <BookOpen size={18} />
                                التفسير الميسر
                            </h4>
                            <p className="opacity-90 leading-loose text-lg font-arabic text-justify">
                                {activeAyahData.tafsir}
                            </p>
                        </div>

                        {activeAyahData.translation && (
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-border">
                                <h4 className="font-bold opacity-60 mb-2 text-sm uppercase tracking-wider font-english">English Translation (Sahih International)</h4>
                                <p className="opacity-80 leading-relaxed font-english text-lg" dir="ltr">
                                    {activeAyahData.translation}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default QuranReader;
