import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getPageContent } from '../services/quranService';
import { Ayah } from '../types';
import { toArabicNumerals } from '../utils';

interface MushafPageViewerProps {
  pageNumber: number;
  onPageChange: (newPage: number) => void;
  highlightedAyahId?: number | null; 
  onAyahClick?: (ayah: Ayah) => void;
}

const VerseMarker: React.FC<{ number: number }> = ({ number }) => (
  <span className="relative inline-flex items-center justify-center mx-1 align-middle translate-y-[-0.1em] select-none scale-90 md:scale-100">
    <div className="flex items-center text-[#D4B886] dark:text-[#C4A052]">
      <svg width="14" height="28" viewBox="0 0 14 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M12 2C6 8 6 20 12 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M6 14L3 11L0 14L3 17L6 14Z" fill="currentColor"/>
      </svg>
      <span className="px-0.5 text-[0.7em] font-bold text-[#8B7355] dark:text-[#D4B886] font-arabic pt-[0.1em] leading-none">
        {toArabicNumerals(number)}
      </span>
      <svg width="14" height="28" viewBox="0 0 14 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M2 2C8 8 8 20 2 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 14L11 11L14 14L11 17L8 14Z" fill="currentColor"/>
      </svg>
    </div>
  </span>
);

const MushafPageViewer: React.FC<MushafPageViewerProps> = ({ 
  pageNumber, 
  onPageChange, 
  highlightedAyahId,
  onAyahClick 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPageContent(pageNumber);
      setAyahs(data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [pageNumber]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleNext = () => { if (pageNumber < 604) onPageChange(pageNumber + 1); };
  const handlePrev = () => { if (pageNumber > 1) onPageChange(pageNumber - 1); };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
  };

  const groupedAyahs = ayahs.reduce((groups, ayah) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].surah?.number === ayah.surah?.number) lastGroup.push(ayah);
    else groups.push([ayah]);
    return groups;
  }, [] as Ayah[][]);

  const BASMALA = "بِسْم. ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative select-none overflow-hidden bg-gray-50 dark:bg-[#121212]">
      <div className="absolute inset-y-0 right-0 w-20 z-20 cursor-pointer hidden md:flex items-center justify-end pr-4 group" onClick={handlePrev}>
         <div className="bg-black/5 dark:bg-white/5 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
            <ChevronRight size={32} className="text-gray-400" />
         </div>
      </div>
      <div className="absolute inset-y-0 left-0 w-20 z-20 cursor-pointer hidden md:flex items-center justify-start pl-4 group" onClick={handleNext}>
         <div className="bg-black/5 dark:bg-white/5 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
            <ChevronLeft size={32} className="text-gray-400" />
         </div>
      </div>

      <div 
        className="relative flex-shrink-0 transition-all duration-500 shadow-2xl overflow-hidden bg-[#FFFBF2] dark:bg-[#1A1A1A] border-4 border-[#D4B886]/40 dark:border-[#333] flex flex-col"
        style={{ height: 'min(96vh, 98%)', aspectRatio: '0.66', maxHeight: '100%', maxWidth: '100vw' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#FFFBF2]/90 dark:bg-[#1A1A1A]/90 backdrop-blur-sm">
            <Loader2 size={48} className="animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#FFFBF2]/90 dark:bg-[#1A1A1A]/90 backdrop-blur-sm p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <p className="text-gray-800 dark:text-white font-bold mb-6">تعذر تحميل الصفحة</p>
            <button 
                onClick={fetchPage}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
            >
                <RefreshCw size={18} />
                إعادة المحاولة
            </button>
          </div>
        ) : null}

        {!loading && !error && (
            <div className="w-full h-full flex flex-col px-[5%] py-[6%] overflow-y-auto no-scrollbar scroll-smooth">
                <div className="flex justify-between items-center text-[min(3vw,14px)] md:text-[min(1.8vh,16px)] font-bold text-[#8B7355] dark:text-dark-muted mb-4 font-arabicHead px-1 border-b border-[#D4B886]/20 dark:border-white/5 pb-2">
                    <span>{ayahs[0]?.surah?.name}</span>
                    <span>الجزء {toArabicNumerals(ayahs[0]?.juz)}</span>
                </div>

                <div className="flex-1 relative dir-rtl">
                    <div className="flex flex-col gap-4">
                        {groupedAyahs.map((group, groupIndex) => {
                            const surah = group[0].surah;
                            const isFirstInSurah = group[0].numberInSurah === 1;
                            return (
                                <div key={groupIndex} className="relative">
                                    {isFirstInSurah && (
                                        <div className="my-4 border-2 border-[#D4B886] dark:border-emerald-900/50 bg-[#FBF5E4] dark:bg-[#222] py-2 md:py-3 text-center rounded-xl relative overflow-hidden shadow-sm">
                                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none"></div>
                                            <h3 className="font-quran text-[1.4em] md:text-[1.8em] text-gray-900 dark:text-emerald-400 drop-shadow-sm relative z-10 font-bold">{surah?.name}</h3>
                                        </div>
                                    )}
                                    {isFirstInSurah && surah?.number !== 9 && surah?.number !== 1 && (
                                        <div className="text-center font-quran text-[1.1em] md:text-[1.4em] mb-4 text-gray-800 dark:text-gray-300">{BASMALA}</div>
                                    )}
                                    <div className="text-justify font-quran leading-[2.1] md:leading-[2.2] text-gray-900 dark:text-gray-100" dir="rtl" style={{ textAlignLast: 'center', fontSize: 'clamp(18px, 4.8vw, 3.2vh)' }}>
                                        {group.map((ayah) => {
                                            const isHighlighted = highlightedAyahId === ayah.number;
                                            let displayText = ayah.text;
                                            if (isFirstInSurah && ayah.numberInSurah === 1 && surah?.number !== 1 && surah?.number !== 9) {
                                                if (displayText.startsWith(BASMALA)) displayText = displayText.replace(BASMALA, '').trim();
                                            }
                                            return (
                                                <span 
                                                    key={ayah.number}
                                                    onClick={() => onAyahClick && onAyahClick(ayah)}
                                                    className={`relative inline px-0.5 transition-all duration-300 cursor-pointer rounded-lg ${isHighlighted ? 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-500/30' : 'hover:bg-[#D4B886]/10 dark:hover:bg-white/5'}`}
                                                >
                                                    {displayText}
                                                    <VerseMarker number={ayah.numberInSurah} />
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="text-center text-[min(3vw,14px)] md:text-[min(1.8vh,16px)] font-mono text-[#8B7355] dark:text-dark-muted mt-4 pt-2 border-t border-[#D4B886]/20 dark:border-white/5">{toArabicNumerals(pageNumber)}</div>
            </div>
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all">
          <div className="bg-black/70 dark:bg-[#1E1E1E]/90 backdrop-blur-xl p-1.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-2">
              <button onClick={handlePrev} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors disabled:opacity-20" disabled={pageNumber <= 1}><ChevronRight size={20} /></button>
              <div className="flex items-center gap-3 px-4 border-x border-white/10 h-6">
                  <span className="text-sm font-bold text-white font-mono">{pageNumber}</span>
                  <span className="text-xs text-white/40">/ 604</span>
              </div>
              <button onClick={handleNext} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors disabled:opacity-20" disabled={pageNumber >= 604}><ChevronLeft size={20} /></button>
          </div>
      </div>
    </div>
  );
};

export default MushafPageViewer;
