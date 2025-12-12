
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as quranService from '../services/quranService';
import { SurahData, Ayah, SearchResult } from '../types';
import { 
  ArrowRight, Play, Pause, Settings, BookOpen, ChevronLeft, 
  Loader2, Type, X, RefreshCw, Eye, EyeOff, Mic, 
  FastForward, Rewind, Infinity, Search, AlertTriangle
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
  // Reading mode removed, default is text
  const [fontSize, setFontSize] = useState(32);
  const [showSettings, setShowSettings] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  
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
  
  // --- Data Processing ---
  
  const pagesMap = useMemo(() => {
    if (!surah) return {};
    const map: Record<number, Ayah[]> = {};
    surah.ayahs.forEach(a => {
        if (!map[a.page]) map[a.page] = [];
        map[a.page].push(a);
    });
    return map;
  }, [surah]);

  const activeAyahData = useMemo(() => {
      return surah?.ayahs.find(a => a.numberInSurah === activeAyahId);
  }, [surah, activeAyahId]);

  // --- Effects ---

  useEffect(() => {
    const fetchSurah = async () => {
      setLoading(true);
      // Reset state for new Surah
      setSurah(null);
      setActiveAyahId(null);
      setCurrentPage(null);
      setIsPlaying(false);
      setSearchResults([]); // Clear search results to prevent stale data crashes
      setSearchQuery('');
      setUsingFallback(false);
      setHighlightTerm('');
      setInteractionSource(null);
      
      try {
        const data = await quranService.getSurah(surahNumber);
        setSurah(data);
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
       if (!currentPage && surah.ayahs.length > 0) setCurrentPage(surah.ayahs[0].page);
    }
  }, [surah, location.state]);

  // Sync Page with Active Ayah
  useEffect(() => {
      if (!surah || !activeAyahId) return;
      const ayah = surah.ayahs.find(a => a.numberInSurah === activeAyahId);
      if (ayah && ayah.page !== currentPage) {
          setCurrentPage(ayah.page);
      }
  }, [activeAyahId, surah]);

  // Scroll to Ayah
  useEffect(() => {
    if (activeAyahId && !loading) {
      // Small timeout to allow render
      setTimeout(() => {
        const element = document.getElementById(`ayah-${activeAyahId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [activeAyahId, loading]);

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

  // Use refs for audio logic to prevent stale closures in event listeners
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
      
      // If we are just resuming the current audio
      if (isSameSource && !isRepetition && audioRef.current.currentTime > 0 && !audioRef.current.ended) {
          if (audioRef.current.paused) {
              audioRef.current.play()
                  .then(() => setIsPlaying(true))
                  .catch(e => console.error("Resume error:", e));
          }
          return;
      }

      // Playing a new ayah or repeating
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = url;
      audioRef.current.load(); // Important to reset state
      audioRef.current.playbackRate = playbackSpeed;
      
      setActiveAyahId(ayahNumber);
      setInteractionSource('audio'); // Set source to audio to avoid background highlighting
      setIsPlaying(true);
      setUsingFallback(useFallback);
      
      // Error handling with fallback logic
      audioRef.current.onerror = (e) => {
          console.error("Audio playback error", e);
          
          if (!useFallback && reciterId !== quranService.DEFAULT_RECITER_ID) {
              console.warn("Reciter source failed, trying fallback...");
              playAyah(ayahNumber, false, true); // Retry with fallback
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
              playAyah(ayahNumber, true, useFallback); // Keep using fallback if enabled
          } else {
              setCurrentRepeat(0);
              const nextNum = ayahNumber + 1;
              if (surah && nextNum <= surah.numberOfAyahs) {
                  playAyah(nextNum, false, useFallback); // Keep using fallback if enabled
              } else {
                  setIsPlaying(false);
                  setUsingFallback(false);
              }
          }
      };
  }, [surahNumber, reciterId, playbackSpeed]);

  const togglePlay = () => {
      if (!audioRef.current || audioRef.current.paused) {
          if (activeAyahId) playAyah(activeAyahId);
          else playAyah(1);
      } else {
          audioRef.current.pause();
          setIsPlaying(false);
      }
  };

  const handleNextAyah = () => {
      if (!surah || !activeAyahId) return;
      setCurrentRepeat(0);
      if (activeAyahId < surah.numberOfAyahs) {
          setActiveAyahId(activeAyahId + 1);
          setInteractionSource('audio'); // Controls treated as audio/system
          if (isPlaying) playAyah(activeAyahId + 1);
      }
  };

  const handlePrevAyah = () => {
      if (!surah || !activeAyahId) return;
      setCurrentRepeat(0);
      if (activeAyahId > 1) {
          setActiveAyahId(activeAyahId - 1);
          setInteractionSource('audio'); // Controls treated as audio/system
          if (isPlaying) playAyah(activeAyahId - 1);
      }
  };

  const handleReciterChange = (id: string) => {
      setReciterId(id);
      setUsingFallback(false); // Reset fallback when user manually changes reciter
      quranService.savePreferredReciter(id);
      if (isPlaying && activeAyahId) {
          playAyah(activeAyahId);
      }
  };

  const handleSearchResultClick = (result: SearchResult | Ayah) => {
      const targetSurahNum = 'surah' in result ? result.surah.number : surahNumber;
      const targetAyahNum = result.numberInSurah;

      setShowSearch(false);

      if (targetSurahNum === surahNumber) {
          // Same Surah
          setActiveAyahId(targetAyahNum);
          setInteractionSource('search');
          setHighlightTerm(searchQuery); // Set highlight term for word highlighting
          const localAyah = surah?.ayahs.find(a => a.numberInSurah === targetAyahNum);
          if (localAyah) setCurrentPage(localAyah.page);
      } else {
          // Different Surah
          navigate(`/quran/read/${targetSurahNum}`, { state: { scrollToAyah: targetAyahNum }});
      }
  };

  const handleVerseClick = (ayahNum: number) => {
      setActiveAyahId(ayahNum);
      setInteractionSource('click'); // Only user click sets this
      setHighlightTerm(''); // Clear any search highlighting when manually selecting
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  if (!surah) return <ErrorState onRetry={() => window.location.reload()} />;

  const isBismillah = surahNumber !== 1 && surahNumber !== 9;

  return (
    <div className="h-screen bg-[#FAF9F6] dark:bg-dark-bg flex flex-col relative overflow-hidden transition-colors duration-300">
        
        {/* --- Top Bar --- */}
        <div 
            className={`
                fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between
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

            <div className="flex items-center gap-2">
                {memorizeMode && (
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

        {/* --- Main Content Area (Text Only) --- */}
        <div 
            className="flex-1 relative w-full h-full flex flex-col"
            onClick={() => setUiVisible(!uiVisible)}
        >
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
                        // Only show background highlight if manual user click
                        const showBg = isActive && interactionSource === 'click';
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
                                className={`
                                    font-quran inline px-1 py-1 rounded-lg cursor-pointer transition-colors duration-200 scroll-m-32
                                    ${showBg ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-200 dark:ring-emerald-800' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'}
                                    ${hideText ? 'blur-[6px] hover:blur-none transition-all' : ''}
                                `}
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                <span dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                <span className="text-emerald-600 dark:text-emerald-400 text-[0.6em] mx-1 font-quran inline-block">
                                    ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* --- Bottom Controls --- */}
        <div 
            className={`
                fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 flex flex-col justify-end
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
                    <button onClick={() => setShowTafsir(true)} className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 transition-colors">
                        <BookOpen size={22} />
                    </button>
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
        {showTafsir && activeAyahData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setShowTafsir(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-lg max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-popIn" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-elevated">
                        <h3 className="font-bold text-lg dark:text-white">التفسير الميسر</h3>
                        <button onClick={() => setShowTafsir(false)}><X size={20} className="text-gray-500" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <p className="font-quran text-2xl text-emerald-800 dark:text-emerald-400 mb-6 leading-loose border-b border-gray-100 dark:border-dark-border pb-4">
                            {activeAyahData.text}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-loose text-justify text-lg font-arabic">
                            {activeAyahData.tafsir}
                        </p>
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
                        {/* Font Size */}
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

                        {/* Tajweed Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-700 dark:text-gray-200">التجويد الملون</span>
                            <button 
                                onClick={() => setTajweedMode(!tajweedMode)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${tajweedMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${tajweedMode ? 'left-1' : 'left-7'}`}></div>
                            </button>
                        </div>

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
