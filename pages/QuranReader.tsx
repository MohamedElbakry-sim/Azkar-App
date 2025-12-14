
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as quranService from '../services/quranService';
import * as storage from '../services/storage';
import { SurahData, Ayah, SearchResult } from '../types';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { 
  ArrowRight, Play, Pause, Settings, BookOpen, ChevronLeft, ChevronRight,
  Loader2, X, Eye, EyeOff, Search, Heart,
  Info, Moon, Sun, Coffee, Palette
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
  
  // Theme State
  const [pageTheme, setPageTheme] = useState<storage.PageTheme>(() => storage.getQuranTheme());

  // Interaction State
  const [activeAyahId, setActiveAyahId] = useState<number | null>(null);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [reciterId, setReciterId] = useState<string>(quranService.getPreferredReciter());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Feature Toggles
  const [tajweedMode, setTajweedMode] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [bookmarks, setBookmarks] = useState<quranService.Bookmark[]>([]);

  // Load Bookmarks
  useEffect(() => {
    setBookmarks(quranService.getBookmarks());
  }, []);

  // --- Mobile Optimizations: Wake Lock & Fullscreen ---
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await (navigator as any).wakeLock.request('screen');
            }
        } catch (err) {
            console.warn('Wake Lock error:', err);
        }
    };

    if (Capacitor.isNativePlatform()) {
        StatusBar.hide().catch(() => {});
    }
    
    requestWakeLock();

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            requestWakeLock();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        if (Capacitor.isNativePlatform()) {
            StatusBar.show().catch(() => {});
        }
        if (wakeLock) wakeLock.release().catch(() => {});
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch Surah
  useEffect(() => {
    const fetchSurah = async () => {
      setLoading(true);
      setSurah(null);
      setActiveAyahId(null);
      setIsPlaying(false);
      
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
        }
    };
  }, [surahNumber]);

  // Handle Auto-Scroll & Deep Linking
  useEffect(() => {
    if (!surah) return;
    
    if (location.state?.scrollToAyah) {
       const targetId = location.state.scrollToAyah;
       setActiveAyahId(targetId);
       
       setTimeout(() => {
        const element = document.getElementById(`ayah-${targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [surah, location.state]);

  // Auto-Save Last Read
  useEffect(() => {
      if (!surah) return;
      // Default to first ayah if nothing active
      const ayahToSave = activeAyahId || 1;
      // Find page number from data
      const ayahData = surah.ayahs.find(a => a.numberInSurah === ayahToSave);
      
      quranService.saveLastRead({
          surahNumber,
          ayahNumber: ayahToSave,
          pageNumber: ayahData?.page || 1,
          timestamp: Date.now()
      });
  }, [surahNumber, activeAyahId, surah]);

  // --- Audio Logic ---
  const playAyah = (ayahNumber: number) => {
      if (!surah) return;
      
      if (!audioRef.current) audioRef.current = new Audio();

      // If already playing this ayah, toggle pause
      if (activeAyahId === ayahNumber && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
          return;
      }

      // Start new playback
      const reciter = quranService.RECITERS.find(r => r.id === reciterId) || quranService.RECITERS[0];
      const s = surahNumber.toString().padStart(3, '0');
      const a = ayahNumber.toString().padStart(3, '0');
      const url = `https://everyayah.com/data/${reciter.subpath}/${s}${a}.mp3`;

      audioRef.current.src = url;
      audioRef.current.play();
      setActiveAyahId(ayahNumber);
      setIsPlaying(true);

      audioRef.current.onended = () => {
          if (ayahNumber < surah.numberOfAyahs) {
              playAyah(ayahNumber + 1);
          } else {
              setIsPlaying(false);
          }
      };
      
      audioRef.current.onerror = () => {
          setIsPlaying(false);
          alert("تعذر تشغيل الملف الصوتي. يرجى التحقق من الإنترنت.");
      };
  };

  const handleFavoriteToggle = () => {
      if (!activeAyahId) return;
      const isFav = bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === activeAyahId);
      
      if (isFav) {
          setBookmarks(quranService.removeBookmark(surahNumber, activeAyahId));
      } else {
          setBookmarks(quranService.addBookmark({
              surahNumber,
              ayahNumber: activeAyahId,
              timestamp: Date.now()
          }));
      }
  };

  // --- Styles ---
  const getThemeClasses = () => {
      switch (pageTheme) {
          case 'sepia': return 'bg-[#F4ECD8] text-[#433422]';
          case 'dark': return 'bg-[#151515] text-[#D1D5DB]';
          default: return 'bg-[#FAF9F6] text-gray-800';
      }
  };

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  if (!surah) return <ErrorState onRetry={() => window.location.reload()} />;

  const activeAyahData = surah.ayahs.find(a => a.numberInSurah === activeAyahId);
  const isBookmarked = activeAyahId && bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === activeAyahId);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${getThemeClasses()}`}>
        
        {/* Top Navigation */}
        <div className={`sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-md border-b shadow-sm ${pageTheme === 'dark' ? 'bg-[#1a1a1a]/90 border-gray-800' : 'bg-white/90 border-gray-100'}`}>
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/quran')} className="p-2 rounded-full hover:bg-black/5 transition-colors">
                    <ArrowRight size={20} />
                </button>
                <div>
                    <h1 className="font-bold text-lg font-arabicHead leading-none">{surah.name}</h1>
                    <span className="text-xs opacity-60 font-medium">{surah.englishName}</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {activeAyahId && (
                    <button onClick={handleFavoriteToggle} className={`p-2 rounded-full ${isBookmarked ? 'text-red-500' : 'text-gray-400'}`}>
                        <Heart size={20} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                )}
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-black/5">
                    <Settings size={20} />
                </button>
            </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8" onClick={() => setActiveAyahId(null)}>
            <div className="max-w-3xl mx-auto text-justify leading-[3]" dir="rtl">
                {surahNumber !== 1 && surahNumber !== 9 && (
                    <div className="text-center mb-10 font-quran text-3xl opacity-80">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                )}
                
                {surah.ayahs.map((ayah) => {
                    let text = ayah.text;
                    if (surahNumber !== 1 && ayah.numberInSurah === 1) text = text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "").trim();
                    
                    const isActive = activeAyahId === ayah.numberInSurah;
                    let htmlContent = tajweedMode ? applyTajweed(text) : text;

                    return (
                        <span 
                            key={ayah.number} 
                            id={`ayah-${ayah.numberInSurah}`}
                            onClick={(e) => { e.stopPropagation(); setActiveAyahId(ayah.numberInSurah); }}
                            className={`
                                font-quran inline px-1 py-1 rounded-lg cursor-pointer transition-colors duration-200 select-none
                                ${isActive ? 'bg-emerald-500/20 ring-2 ring-emerald-500/30' : ''}
                                ${hideText ? 'blur-[6px]' : ''}
                            `}
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            <span dangerouslySetInnerHTML={{ __html: htmlContent }} />
                            <span className="text-emerald-500 text-[0.6em] mx-1 font-quran inline-block">
                                ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                            </span>
                        </span>
                    );
                })}
            </div>

            {/* Bottom Nav */}
            <div className="flex justify-between items-center mt-12 mb-20 max-w-3xl mx-auto">
                {surahNumber > 1 && (
                    <button onClick={() => navigate(`/quran/read/${surahNumber - 1}`)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
                        <ChevronRight /> السورة السابقة
                    </button>
                )}
                {surahNumber < 114 && (
                    <button onClick={() => navigate(`/quran/read/${surahNumber + 1}`)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
                        السورة التالية <ChevronLeft />
                    </button>
                )}
            </div>
        </div>

        {/* Floating Controls (When Ayah Selected) */}
        {activeAyahId && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-lg text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-slideUp">
                <button onClick={() => playAyah(activeAyahId)} className="flex flex-col items-center gap-1">
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    <span className="text-[10px]">استماع</span>
                </button>
                <div className="w-px h-8 bg-white/20"></div>
                <button onClick={() => setShowTafsir(true)} className="flex flex-col items-center gap-1">
                    <BookOpen size={24} />
                    <span className="text-[10px]">تفسير</span>
                </button>
            </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowSettings(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4 text-center dark:text-white">إعدادات القراءة</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-2 block">حجم الخط</label>
                            <input 
                                type="range" min="20" max="60" value={fontSize} 
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg accent-emerald-500"
                            />
                        </div>

                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            {['light', 'sepia', 'dark'].map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => { setPageTheme(theme as any); storage.saveQuranTheme(theme as any); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${pageTheme === theme ? 'bg-white text-emerald-600 shadow' : 'text-gray-500'}`}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="text-sm font-bold dark:text-white">أحكام التجويد</span>
                            <button 
                                onClick={() => setTajweedMode(!tajweedMode)}
                                className={`w-10 h-6 rounded-full relative transition-colors ${tajweedMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tajweedMode ? 'left-5' : 'left-1'}`}></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Tafsir Drawer */}
        {showTafsir && activeAyahData && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowTafsir(false)}>
                <div className="bg-white dark:bg-dark-surface w-full max-w-2xl sm:rounded-3xl rounded-t-3xl h-[60vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold font-arabicHead dark:text-white">تفسير الآية {activeAyahData.numberInSurah}</h3>
                        <button onClick={() => setShowTafsir(false)}><X className="dark:text-white" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                        <p className="font-quran text-2xl text-center mb-6 text-emerald-700 dark:text-emerald-400">{activeAyahData.text}</p>
                        <p className="text-lg leading-loose text-gray-700 dark:text-gray-300 text-justify">{activeAyahData.tafsir}</p>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default QuranReader;
    