
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as quranService from '../services/quranService';
import { SurahData } from '../types';
import { QURAN_META } from '../data/quranMeta';
import { ArrowRight, Play, Pause, Bookmark, Type, ChevronLeft, ChevronRight, Loader2, Share2, Copy, Check, X, BookOpen, Search, SearchX, Globe } from 'lucide-react';
import ErrorState from '../components/ErrorState';
import { toArabicNumerals, normalizeArabic } from '../utils';

// --- Components ---

const AyahEndSymbol = ({ number }: { number: number }) => (
  <span className="inline-flex items-center justify-center w-8 h-8 align-middle relative mx-1 select-none text-emerald-600 dark:text-emerald-400">
    <svg viewBox="0 0 40 40" className="w-full h-full absolute inset-0 text-emerald-500/20 dark:text-emerald-400/20" fill="currentColor">
       <path d="M20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36C28.8366 36 36 28.8366 36 20C36 11.1634 28.8366 4 20 4ZM20 0C31.0457 0 40 8.9543 40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0Z" fillRule="evenodd" clipRule="evenodd" />
       <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
    <span className="relative z-10 text-[0.6em] font-bold pt-1 font-arabicNumbers">
        {toArabicNumerals(number)}
    </span>
  </span>
);

const QuranReader: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [surah, setSurah] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Settings
  const [fontSize, setFontSize] = useState(32);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'local' | 'global'>('local');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Player & Interaction State
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null); // Number In Surah
  const [sheetView, setSheetView] = useState<'actions' | 'tafsir'>('actions');
  const [justCopied, setJustCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const surahNumber = parseInt(surahId || '1');
  const initialScrollAyah = location.state?.scrollToAyah;

  useEffect(() => {
    const fetchSurah = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await quranService.getSurah(surahNumber);
        setSurah(data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSurah();
    setIsPlaying(null);
    setSelectedAyah(null);
    setSheetView('actions');
    setShowSearch(false);
    setShowSettings(false);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
  }, [surahNumber]);

  useEffect(() => {
    if (!loading && surah && initialScrollAyah) {
        setTimeout(() => {
            scrollToAyah(initialScrollAyah, 'center');
            setSelectedAyah(initialScrollAyah);
        }, 600);
    }
  }, [loading, surah, initialScrollAyah]);

  useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };
  }, []);

  // -- Search Logic --
  useEffect(() => {
    const performSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const normalizedQuery = normalizeArabic(searchQuery);

        if (searchScope === 'local' && surah) {
            const matches = surah.ayahs.filter(ayah => 
                normalizeArabic(ayah.text).includes(normalizedQuery)
            ).map(ayah => ({
                text: ayah.text,
                numberInSurah: ayah.numberInSurah,
                surah: { name: surah.name, number: surah.number }
            }));
            setSearchResults(matches);
            setIsSearching(false);
        } else {
            try {
                const matches = await quranService.searchGlobal(searchQuery); 
                setSearchResults(matches);
            } catch (e) {
                console.error(e);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const timer = setTimeout(performSearch, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchScope, surah]);

  const handleSearchResultClick = (result: any) => {
      setShowSearch(false);
      setSearchQuery('');
      if (result.surah.number === surahNumber) {
          setTimeout(() => {
              scrollToAyah(result.numberInSurah, 'center');
              setSelectedAyah(result.numberInSurah);
          }, 300);
      } else {
          navigate(`/quran/${result.surah.number}`, { state: { scrollToAyah: result.numberInSurah } });
      }
  };

  const scrollToAyah = (numberInSurah: number, block: ScrollLogicalPosition = 'center') => {
      const element = document.getElementById(`ayah-${numberInSurah}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block });
      }
  };

  const handleAyahClick = (numberInSurah: number) => {
      // Close auxiliary drawers
      setShowSettings(false);
      setShowSearch(false);

      if (selectedAyah === numberInSurah) {
          setSelectedAyah(null); 
          setSheetView('actions');
      } else {
          setSelectedAyah(numberInSurah);
          setSheetView('actions');
          
          // Smart Scroll: Bring the selected ayah a bit up so the sheet doesn't cover it
          setTimeout(() => {
              const el = document.getElementById(`ayah-${numberInSurah}`);
              if(el) {
                  // Custom scroll logic to place it in the upper third
                  const rect = el.getBoundingClientRect();
                  const offset = window.innerHeight * 0.25; // Target position from top
                  const top = window.scrollY + rect.top - offset;
                  window.scrollTo({ top, behavior: 'smooth' });
              }
          }, 200);
      }
  };

  const playAudio = (numberInSurah: number) => {
    if (isPlaying === numberInSurah) {
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
                setIsPlaying(null); 
                return; 
            }
        }
    } else {
        if (audioRef.current) audioRef.current.pause();

        const s = surahNumber.toString().padStart(3, '0');
        const a = numberInSurah.toString().padStart(3, '0');
        const url = `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;

        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.play();
        setIsPlaying(numberInSurah);
        setSelectedAyah(numberInSurah);
        
        // Ensure visible when playing
        scrollToAyah(numberInSurah, 'center');

        audio.onended = () => {
            const nextAyah = numberInSurah + 1;
            if (surah && nextAyah <= surah.numberOfAyahs) {
                playAudio(nextAyah);
            } else {
                setIsPlaying(null);
            }
        };
        
        audio.onerror = () => {
            alert('تعذر تشغيل الملف الصوتي');
            setIsPlaying(null);
        };
    }
  };

  const handleBookmark = () => {
      if (selectedAyah) {
        quranService.saveBookmark({
            surahNumber,
            ayahNumber: selectedAyah,
            timestamp: Date.now()
        });
        alert('تم حفظ مكان القراءة');
        setSelectedAyah(null);
      }
  };

  const handleCopy = () => {
      if (selectedAyah && surah) {
          const ayah = surah.ayahs.find(a => a.numberInSurah === selectedAyah);
          if (ayah) {
              const text = `${ayah.text} ﴿${toArabicNumerals(ayah.numberInSurah)}﴾\n[سورة ${surah.name}]`;
              navigator.clipboard.writeText(text);
              setJustCopied(true);
              setTimeout(() => setJustCopied(false), 2000);
          }
      }
  };

  const handleShare = async () => {
      if (selectedAyah && surah) {
          const ayah = surah.ayahs.find(a => a.numberInSurah === selectedAyah);
          if (ayah) {
              const text = `${ayah.text} ﴿${toArabicNumerals(ayah.numberInSurah)}﴾\n[سورة ${surah.name}]`;
              if (navigator.share) {
                  try {
                      await navigator.share({
                          title: `سورة ${surah.name} - آية ${selectedAyah}`,
                          text: text,
                      });
                  } catch (e) {
                      console.log('Share cancelled');
                  }
              } else {
                  handleCopy();
              }
          }
      }
  };

  const nextSurah = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (surahNumber < 114) navigate(`/quran/${surahNumber + 1}`);
  };
  
  const prevSurah = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (surahNumber > 1) navigate(`/quran/${surahNumber - 1}`);
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-dark-bg">
              <Loader2 size={40} className="animate-spin text-emerald-500" />
          </div>
      );
  }

  if (error || !surah) {
      return (
          <div className="p-8 min-h-screen bg-[#FAF9F6] dark:bg-dark-bg flex flex-col justify-center">
            <ErrorState 
                title="خطأ في تحميل السورة"
                message="تأكد من اتصالك بالإنترنت وحاول مرة أخرى."
                onRetry={() => window.location.reload()}
            />
          </div>
      );
  }

  const isBismillahIncluded = surahNumber !== 1 && surahNumber !== 9; 
  const currentAyahObj = selectedAyah ? surah.ayahs.find(a => a.numberInSurah === selectedAyah) : null;

  return (
    <div className="bg-[#FAF9F6] dark:bg-dark-bg min-h-screen transition-colors duration-300 relative selection:bg-emerald-200 dark:selection:bg-emerald-900">
        
        {/* --- Top Navigation Bar --- */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-gray-100 dark:border-dark-border px-4 py-2 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => navigate('/quran')} 
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-600 dark:text-gray-300 transition-colors"
                    aria-label="العودة"
                >
                    <ArrowRight size={22} />
                </button>
            </div>
            
            <div className="flex flex-col items-center">
                <h1 className="text-lg font-bold text-gray-800 dark:text-white font-arabicHead">{surah.name}</h1>
                <span className="text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-dark-elevated px-2 py-0.5 rounded-full">
                    {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية
                </span>
            </div>

            <div className="flex items-center gap-1">
                <button 
                    onClick={prevSurah} 
                    disabled={surahNumber <= 1}
                    className={`p-2 rounded-full ${surahNumber <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated'}`}
                >
                    <ChevronRight size={20} />
                </button>
                <button 
                    onClick={nextSurah} 
                    disabled={surahNumber >= 114}
                    className={`p-2 rounded-full ${surahNumber >= 114 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated'}`}
                >
                    <ChevronLeft size={20} />
                </button>
            </div>
        </div>

        {/* Spacer for Header */}
        <div className="h-[65px]"></div>

        {/* --- Main Content Area --- */}
        <div className="max-w-3xl mx-auto px-5 md:px-10 pt-6 pb-48"> {/* Massive bottom padding for menus */}
            
            {/* Basmala */}
            {isBismillahIncluded && (
                <div className="text-center mb-12 mt-4 select-none relative group animate-fadeIn">
                    <div className="font-quran text-3xl md:text-4xl text-gray-900 dark:text-white leading-[2] drop-shadow-sm opacity-90">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                </div>
            )}

            {/* Verses */}
            <div 
                className="font-quran leading-[2.8] text-justify text-gray-800 dark:text-gray-100" 
                style={{ direction: 'rtl' }}
            >
                {surah.ayahs.map((ayah) => {
                    const isSelected = selectedAyah === ayah.numberInSurah;
                    const isActive = isPlaying === ayah.numberInSurah;
                    
                    let ayahText = ayah.text;
                    if (surahNumber !== 1 && ayah.numberInSurah === 1) {
                        const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                        if (ayahText.startsWith(BASMALA)) {
                            ayahText = ayahText.replace(BASMALA, "").trim();
                        }
                    }

                    return (
                        <div key={ayah.number} className={`relative ${showTranslation ? 'block mb-8' : 'inline'}`}>
                            <span 
                                id={`ayah-${ayah.numberInSurah}`}
                                onClick={() => handleAyahClick(ayah.numberInSurah)}
                                style={{ fontSize: `${fontSize}px` }}
                                className={`
                                    decoration-clone box-decoration-clone py-2 px-1 transition-all duration-300 cursor-pointer rounded-lg
                                    ${isSelected ? 'bg-emerald-100/80 dark:bg-emerald-900/50 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                                    ${isActive && !isSelected ? 'text-emerald-600 dark:text-emerald-400' : ''}
                                `}
                            >
                                {ayahText}
                                <AyahEndSymbol number={ayah.numberInSurah} />
                            </span>
                            
                            {/* Inline Translation */}
                            {showTranslation && ayah.translation && (
                                <p 
                                    className="text-gray-500 dark:text-gray-400 text-base md:text-lg font-english mt-3 mb-4 leading-relaxed text-left px-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4 ml-2" 
                                    dir="ltr"
                                >
                                    {ayah.translation}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Navigation Footer */}
            <div className="mt-24 flex justify-between items-center border-t border-gray-100 dark:border-dark-border pt-8 opacity-60 hover:opacity-100 transition-opacity">
                {surahNumber < 114 ? (
                    <button onClick={nextSurah} className="flex flex-col items-start gap-1 group">
                        <span className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                            السورة التالية <ChevronLeft size={12} />
                        </span>
                        <span className="font-bold text-gray-600 dark:text-gray-300">{QURAN_META[surahNumber].name}</span>
                    </button>
                ) : <div />}

                {surahNumber > 1 ? (
                    <button onClick={prevSurah} className="flex flex-col items-end gap-1 group">
                        <span className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                            <ChevronRight size={12} /> السورة السابقة
                        </span>
                        <span className="font-bold text-gray-600 dark:text-gray-300">{QURAN_META[surahNumber - 2].name}</span>
                    </button>
                ) : <div />}
            </div>
        </div>

        {/* --- Floating Bottom Toolbar (Quick Access) --- */}
        {/* We use translate-y to hide it smoothly when Actions Menu opens, preventing visual collision */}
        <div 
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${selectedAyah ? 'translate-y-32 opacity-0 scale-90 pointer-events-none' : 'translate-y-0 opacity-100 scale-100'}`}
        >
            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-dark-border p-1.5 rounded-full">
                <button 
                    onClick={() => { setShowSearch(!showSearch); setShowSettings(false); }}
                    className={`p-3 rounded-full transition-all duration-300 ${showSearch ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-600 dark:text-gray-300'}`}
                >
                    {showSearch ? <X size={20} /> : <Search size={20} />}
                </button>
                
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                <button 
                    onClick={() => { setShowSettings(!showSettings); setShowSearch(false); }}
                    className={`p-3 rounded-full transition-all duration-300 ${showSettings ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-600 dark:text-gray-300'}`}
                >
                    {showSettings ? <Check size={20} /> : <Type size={20} />}
                </button>

                <button 
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${showTranslation ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                >
                    <Globe size={16} />
                    <span>EN</span>
                </button>
            </div>
        </div>

        {/* --- Search Drawer --- */}
        <div 
            className={`fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-dark-surface shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-[2rem] border-t border-gray-100 dark:border-dark-border transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${showSearch ? 'translate-y-0' : 'translate-y-[110%]'}`}
        >
            <div className="p-6 max-w-3xl mx-auto pb-24 pt-8">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6 opacity-50"></div>
                <div className="relative mb-6">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث..."
                        className="w-full px-4 py-3 pr-12 rounded-2xl bg-gray-100 dark:bg-dark-bg border-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-arabic text-right text-lg"
                        autoFocus={showSearch}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={20} /></div>
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><X size={18} /></button>}
                </div>
                {/* Search Scope & Results */}
                <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-xl mb-6">
                    <button onClick={() => setSearchScope('local')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${searchScope === 'local' ? 'bg-white dark:bg-dark-elevated shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>في السورة</button>
                    <button onClick={() => setSearchScope('global')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${searchScope === 'global' ? 'bg-white dark:bg-dark-elevated shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>في القرآن</button>
                </div>
                <div className="max-h-[40vh] overflow-y-auto custom-scrollbar">
                    {isSearching ? <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-emerald-500" /></div> : searchResults.length > 0 ? (
                        <div className="space-y-3">
                            {searchResults.map((result, idx) => (
                                <button key={idx} onClick={() => handleSearchResultClick(result)} className="w-full text-right p-4 rounded-2xl bg-gray-50 dark:bg-dark-bg hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">سورة {result.surah.name} : {result.numberInSurah}</span>
                                    <p className="text-gray-700 dark:text-gray-200 font-quran text-lg line-clamp-1">{result.text}</p>
                                </button>
                            ))}
                        </div>
                    ) : <div className="text-center py-8 text-gray-400 text-sm">ابدأ الكتابة للبحث</div>}
                </div>
            </div>
        </div>

        {/* --- Settings Drawer --- */}
        <div 
            className={`fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-dark-surface shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-[2rem] border-t border-gray-100 dark:border-dark-border transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${showSettings ? 'translate-y-0' : 'translate-y-[110%]'}`}
        >
            <div className="p-6 pb-28 pt-8 flex flex-col gap-8 max-w-md mx-auto">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto opacity-50"></div>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300 font-bold px-1"><span>حجم الخط</span><span>{fontSize}px</span></div>
                    <div className="flex items-center justify-center gap-4 bg-gray-50 dark:bg-dark-bg p-4 rounded-2xl">
                        <button onClick={() => setFontSize(Math.max(20, fontSize - 2))} className="w-10 h-10 rounded-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border flex items-center justify-center shadow-sm">A-</button>
                        <input type="range" min="20" max="60" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                        <button onClick={() => setFontSize(Math.min(60, fontSize + 2))} className="w-10 h-10 rounded-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border flex items-center justify-center shadow-sm">A+</button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Actions Menu (Context Sheet) --- */}
        {selectedAyah && (
            <>
                {/* Backdrop to focus attention and close on click */}
                <div 
                    className="fixed inset-0 bg-black/20 dark:bg-black/50 z-50 backdrop-blur-[2px] transition-opacity duration-300"
                    onClick={() => setSelectedAyah(null)}
                ></div>

                <div className="fixed bottom-0 left-0 right-0 z-60 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] rounded-t-3xl border-t border-gray-100 dark:border-dark-border animate-slideUp">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 opacity-50"></div>
                    
                    <div className="max-w-3xl mx-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold font-arabic">
                                    آية {toArabicNumerals(selectedAyah)}
                                </span>
                                {sheetView === 'tafsir' && <span className="text-gray-500 text-sm font-bold">التفسير</span>}
                            </div>
                            <div className="flex gap-2">
                                {sheetView === 'tafsir' && <button onClick={() => setSheetView('actions')} className="px-3 py-1 bg-gray-100 dark:bg-dark-elevated rounded-lg text-sm font-bold">عودة</button>}
                                <button onClick={() => setSelectedAyah(null)} className="p-1 rounded-full bg-gray-100 dark:bg-dark-elevated hover:bg-gray-200"><X size={20} /></button>
                            </div>
                        </div>

                        {sheetView === 'actions' ? (
                            <div className="grid grid-cols-5 gap-3 md:gap-6">
                                <ActionButton icon={isPlaying === selectedAyah ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />} label={isPlaying === selectedAyah ? 'إيقاف' : 'استماع'} onClick={() => selectedAyah && playAudio(selectedAyah)} active={isPlaying === selectedAyah} />
                                <ActionButton icon={<BookOpen size={24} />} label="تفسير" onClick={() => setSheetView('tafsir')} />
                                <ActionButton icon={<Bookmark size={24} />} label="حفظ" onClick={handleBookmark} />
                                <ActionButton icon={justCopied ? <Check size={24} /> : <Copy size={24} />} label="نسخ" onClick={handleCopy} />
                                <ActionButton icon={<Share2 size={24} />} label="مشاركة" onClick={handleShare} />
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-dark-elevated p-5 rounded-2xl max-h-[40vh] overflow-y-auto animate-fadeIn">
                                {currentAyahObj?.tafsir ? <p className="text-gray-700 dark:text-gray-200 leading-loose text-lg font-arabic text-justify">{currentAyahObj.tafsir}</p> : <p className="text-center text-gray-400">لا يوجد تفسير متاح.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

// Sub-component for buttons to keep JSX clean
const ActionButton = ({ icon, label, onClick, active = false }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg scale-110' : 'bg-gray-50 dark:bg-dark-elevated text-gray-600 dark:text-gray-300 group-hover:scale-105 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20'}`}>
            {icon}
        </div>
        <span className={`text-xs font-bold transition-colors ${active ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-600'}`}>{label}</span>
    </button>
);

export default QuranReader;
