import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import * as quranService from '../services/quranService';
import * as storage from '../services/storage';
import { 
    Play, Pause, SkipForward, SkipBack, ArrowLeft, 
    Type, AlertCircle, Loader2, Book, AlignRight, Settings, RefreshCw, X, Clock
} from 'lucide-react';
import MushafPagesViewer from '../components/MushafPagesViewer';
import TextModeViewer from '../components/TextModeViewer';

type ViewMode = 'text' | 'mushaf';

const QuranReader: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Audio Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const metadataAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Data State
  const [surah, setSurah] = useState<quranService.SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Settings
  const viewMode: ViewMode = searchParams.get('view') === 'mushaf' ? 'mushaf' : 'text';
  const isTextMode = viewMode === 'text';

  const setViewMode = (mode: ViewMode) => {
      setSearchParams(prev => { prev.set('view', mode); return prev; }, { replace: true });
  };

  const [activeAyahIndex, setActiveAyahIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [reciterId, setReciterId] = useState('ar.alafasy');
  const [bookmarks, setBookmarks] = useState<storage.QuranBookmark[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');

  // Timer States
  const [currentAyahTime, setCurrentAyahTime] = useState(0);
  const [currentAyahDuration, setCurrentAyahDuration] = useState(0);
  const [totalSurahDuration, setTotalSurahDuration] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    if (!isTextMode) return;
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    setScrollProgress(scrolled);
  }, [isTextMode]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Safe Playback Helper
  const safePlay = async () => {
      if (!audioRef.current) return;
      try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
              await playPromise;
              setIsPlaying(true);
          }
      } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
              console.warn("Playback error:", err);
          }
          setIsPlaying(false);
      }
  };

  // Fetch Total Surah Duration
  useEffect(() => {
    if (!surah || !metadataAudioRef.current) return;
    
    const audio = metadataAudioRef.current;
    const fullAudioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciterId}/${surah.number}.mp3`;
    
    setTotalSurahDuration(null);
    audio.src = fullAudioUrl;
    audio.load();

    const onMetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
            setTotalSurahDuration(audio.duration);
        }
    };

    audio.addEventListener('loadedmetadata', onMetadata);
    return () => audio.removeEventListener('loadedmetadata', onMetadata);
  }, [surah, reciterId]);

  const loadSurah = useCallback(async () => {
    if (!surahId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quranService.getSurah(parseInt(surahId));
      setSurah(data);

      const initialAyah = searchParams.get('ayah');
      if (initialAyah) {
          const index = data.ayahs.findIndex(a => a.numberInSurah === parseInt(initialAyah));
          if (index !== -1) { 
              setActiveAyahIndex(index); 
              setCurrentPage(data.ayahs[index].page); 
          }
      } else {
          setCurrentPage(data.ayahs[0].page);
      }
    } catch (e: any) { 
      setError(e.message || 'تعذر تحميل السورة'); 
    } finally { 
      setLoading(false); 
    }
  }, [surahId, searchParams]);

  useEffect(() => {
    loadSurah();
    setBookmarks(storage.getQuranBookmarks());
    setFontSize(storage.getFontSize());
  }, [loadSurah]);

  const playAyah = (index: number) => {
      if (!surah || !audioRef.current || index < 0 || index >= surah.ayahs.length) return;
      const ayah = surah.ayahs[index];
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${ayah.number}.mp3`;
      
      setActiveAyahIndex(index);
      setCurrentAyahTime(0);
      setCurrentAyahDuration(0);
      
      if (viewMode === 'mushaf' && ayah.page !== currentPage) setCurrentPage(ayah.page);
      
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      safePlay();
  };

  const handleTimeUpdate = () => {
      if (audioRef.current) {
          setCurrentAyahTime(audioRef.current.currentTime);
          if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
              setCurrentAyahDuration(audioRef.current.duration);
          }
      }
  };

  const togglePlay = () => {
      if (!audioRef.current) return;
      if (isPlaying) { 
          audioRef.current.pause(); 
          setIsPlaying(false); 
      } else { 
          if (activeAyahIndex === null) playAyah(0); 
          else safePlay(); 
      }
  };

  const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioEnded = () => {
      if (activeAyahIndex !== null && surah) {
          if (activeAyahIndex < surah.ayahs.length - 1) {
              playAyah(activeAyahIndex + 1);
          } else {
              setIsPlaying(false);
              setActiveAyahIndex(null);
          }
      }
  };

  const toggleBookmark = (ayah: quranService.Ayah) => {
      if (!surah) return;
      const isBookmarked = bookmarks.some(b => b.surahNumber === surah.number && b.ayahNumber === ayah.numberInSurah);
      if (isBookmarked) storage.removeQuranBookmark(surah.number, ayah.numberInSurah);
      else storage.saveQuranBookmark({ surahNumber: surah.number, ayahNumber: ayah.numberInSurah, surahName: surah.name, timestamp: Date.now(), pageNumber: currentPage });
      setBookmarks(storage.getQuranBookmarks());
  };

  // Calculate Surah-level progress for the Mushaf viewer footer
  // Fixed: useMemo is now imported from react
  const surahProgress = useMemo(() => {
    if (!surah || activeAyahIndex === null) return 0;
    const ayahProgressFraction = currentAyahDuration > 0 ? (currentAyahTime / currentAyahDuration) : 0;
    return ((activeAyahIndex + ayahProgressFraction) / surah.ayahs.length) * 100;
  }, [surah, activeAyahIndex, currentAyahTime, currentAyahDuration]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  
  if (error || !surah) return (
    <div className="h-screen flex items-center justify-center flex-col gap-6 p-6 text-center">
        <AlertCircle size={48} className="text-red-500"/>
        <p className="text-gray-800 dark:text-white font-bold text-lg">{error || 'تعذر تحميل السورة'}</p>
        <button onClick={loadSurah} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95"><RefreshCw size={20} className="inline ml-2" />إعادة المحاولة</button>
    </div>
  );

  return (
    <div className={`bg-[#FDFDFD] dark:bg-[#0D0D0D] min-h-screen relative flex flex-col ${viewMode === 'mushaf' ? 'h-screen overflow-hidden' : 'pb-32'}`}>
        <audio ref={audioRef} onEnded={handleAudioEnded} onTimeUpdate={handleTimeUpdate} onError={() => setIsPlaying(false)} />
        <audio ref={metadataAudioRef} crossOrigin="anonymous" preload="metadata" />
        
        {/* Header */}
        <div className="sticky top-0 z-50 transition-all duration-300">
            <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-gray-100 dark:border-[#333] px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/quran')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={22} className="text-gray-600 dark:text-gray-300 rtl:rotate-0" />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-800 dark:text-white font-arabicHead leading-tight">{surah.name}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{surah.englishName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-surface p-1 rounded-2xl">
                    <button onClick={() => setViewMode('text')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isTextMode ? 'bg-white dark:bg-[#2A2A2A] shadow-sm text-emerald-600' : 'text-gray-400'}`}>
                        <AlignRight size={16} />
                        <span className="hidden md:inline">نص</span>
                    </button>
                    <button onClick={() => setViewMode('mushaf')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!isTextMode ? 'bg-white dark:bg-[#2A2A2A] shadow-sm text-emerald-600' : 'text-gray-400'}`}>
                        <Book size={16} />
                        <span className="hidden md:inline">مصحف</span>
                    </button>
                </div>

                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-all ${showSettings ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    <Settings size={22} />
                </button>
            </div>
            {isTextMode && (
                <div className="h-1 bg-gray-100 dark:bg-dark-border w-full">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${scrollProgress}%` }}></div>
                </div>
            )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowSettings(false)}>
                <div className="w-full max-w-md bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 shadow-2xl animate-popIn border border-gray-100 dark:border-dark-border relative" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold font-arabicHead">إعدادات القراءة</h3>
                        <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={20} /></button>
                    </div>
                    
                    <div className="space-y-6">
                        <button onClick={() => setShowTranslation(!showTranslation)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${showTranslation ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-transparent text-gray-500'}`}>
                            <div className="flex items-center gap-3"><Type size={20} /><span className="font-bold">إظهار الترجمة</span></div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${showTranslation ? 'border-emerald-600' : 'border-gray-300'}`}>{showTranslation && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}</div>
                        </button>
                        <div className="space-y-3 bg-gray-50 dark:bg-dark-bg p-5 rounded-3xl border border-gray-100 dark:border-dark-border">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block pr-1">سرعة التلاوة</span>
                            <div className="flex gap-2">
                                {[0.75, 1, 1.25, 1.5].map(speed => (
                                    <button key={speed} onClick={() => { setPlaybackSpeed(speed); if (audioRef.current) audioRef.current.playbackRate = speed; }} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${playbackSpeed === speed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-dark-surface text-gray-500'}`}>{speed}x</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 bg-gray-50 dark:bg-dark-bg p-5 rounded-3xl border border-gray-100 dark:border-dark-border">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block pr-1">اختيار القارئ</span>
                            <select value={reciterId} onChange={(e) => setReciterId(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-dark-surface border-none text-sm font-arabic font-bold focus:ring-2 focus:ring-emerald-500 shadow-sm">
                                {quranService.RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`flex-1 w-full mx-auto transition-all ${isTextMode ? 'py-8' : 'p-0 flex flex-col items-center justify-center overflow-hidden h-full'}`}>
            {isTextMode ? (
                <TextModeViewer 
                    surah={surah} activeAyahIndex={activeAyahIndex} isPlaying={isPlaying} 
                    onPlayAyah={playAyah} onToggleBookmark={toggleBookmark} bookmarks={bookmarks} 
                    showTranslation={showTranslation} fontSize={fontSize} 
                    onCopy={(t) => navigator.clipboard.writeText(t)} onShare={async (t) => { if (navigator.share) await navigator.share({ text: t }); }} 
                />
            ) : (
                <MushafPagesViewer 
                    initialPage={currentPage} onPageChange={setCurrentPage} onClose={() => setViewMode('text')} 
                    highlightedAyah={activeAyahIndex !== null ? { surah: surah.number, ayah: surah.ayahs[activeAyahIndex].numberInSurah } : null}
                    onAyahClick={(s, a) => { const idx = surah.ayahs.findIndex(ayah => ayah.numberInSurah === a); if (idx !== -1) playAyah(idx); }}
                    isPlaying={isPlaying} onTogglePlay={togglePlay} reciterId={reciterId} onReciterChange={setReciterId}
                    playbackProgress={surahProgress}
                />
            )}
        </div>

        {/* --- PERFECTLY CENTERED PLAYER WITH TIMER & PROGRESS --- */}
        {activeAyahIndex !== null && (
            <div className="fixed bottom-6 left-0 md:right-72 right-0 z-[60] flex justify-center px-4 animate-slideUp">
                <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center gap-2 md:gap-8 min-w-[310px] max-w-2xl relative overflow-hidden">
                    
                    {/* Top Progress Bar */}
                    <div className="absolute top-0 left-6 right-6 h-0.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-300 ease-linear"
                            style={{ width: `${(currentAyahTime / (currentAyahDuration || 1)) * 100}%` }}
                        />
                    </div>

                    {/* Left: Ayah Number */}
                    <div className="flex items-center gap-3 pr-2 md:pr-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shrink-0">
                            {surah.ayahs[activeAyahIndex].numberInSurah}
                        </div>
                        <div className="hidden sm:flex flex-col min-w-0">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">الآية</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 font-arabicHead truncate">{surah.name}</span>
                        </div>
                    </div>

                    {/* Center: Playback Controls */}
                    <div className="flex items-center gap-1 md:gap-4 flex-1 justify-center">
                        <button onClick={() => playAyah(activeAyahIndex - 1)} disabled={activeAyahIndex === 0} className="p-2 text-gray-400 hover:text-emerald-600 disabled:opacity-20 transition-all active:scale-90">
                            <SkipBack size={22} className="rtl:rotate-180" />
                        </button>
                        
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={togglePlay} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600`}>
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {formatTime(currentAyahTime)}
                            </span>
                        </div>
                        
                        <button onClick={() => playAyah(activeAyahIndex + 1)} disabled={activeAyahIndex === surah.ayahs.length - 1} className="p-2 text-gray-400 hover:text-emerald-600 disabled:opacity-20 transition-all active:scale-90">
                            <SkipForward size={22} className="rtl:rotate-180" />
                        </button>
                    </div>

                    {/* Right: Full Surah Duration Timer */}
                    <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">
                                    <Clock size={10} />
                                    مدة السورة
                                </div>
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 font-bold">
                                    {totalSurahDuration ? formatTime(totalSurahDuration) : '--:--'}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => { if (audioRef.current) audioRef.current.pause(); setIsPlaying(false); setActiveAyahIndex(null); }}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                                title="إغلاق المشغل"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        )}
    </div>
  );
};

export default QuranReader;