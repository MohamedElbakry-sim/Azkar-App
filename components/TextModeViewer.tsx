import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Share2, Copy, Bookmark, BookOpen, Quote, Edit3, Save, Trash2, X, ArrowUp, ChevronLeft } from 'lucide-react';
import { SurahDetail, Ayah } from '../services/quranService';
import * as storage from '../services/storage';
import { toArabicNumerals, applyTajweed, normalizeArabic, getHighlightRegex } from '../utils';
import { QURAN_META } from '../data/quranMeta';
import { useNavigate } from 'react-router-dom';

/**
 * Highlight Layer Priorities
 */
enum HighlightPriority {
    PLAYBACK = 1,
    SELECTION = 2,
    SEARCH = 3,
    BOOKMARK = 4,
    NONE = 99
}

interface TextModeViewerProps {
  surah: SurahDetail;
  activeAyahIndex: number | null;
  isPlaying: boolean;
  onPlayAyah: (index: number) => void;
  onToggleBookmark: (ayah: Ayah) => void;
  bookmarks: storage.QuranBookmark[];
  showTranslation: boolean;
  fontSize: storage.FontSize;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  // New props from parity spec
  tajweedMode?: boolean;
  hideText?: boolean;
  pageTheme?: storage.PageTheme;
  highlightTerm?: string;
}

const BISMILLAH_TEXT = "بِسْم. ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const VerseMarker: React.FC<{ number: number; classes?: string }> = ({ number, classes = "" }) => (
  <span className={`font-quran text-[1.1em] mx-1 select-none inline-block translate-y-[0.02em] ${classes}`}>
    ﴿{toArabicNumerals(number)}﴾
  </span>
);

const TextModeViewer: React.FC<TextModeViewerProps> = ({
  surah, activeAyahIndex, isPlaying, onPlayAyah, onToggleBookmark,
  bookmarks, showTranslation, fontSize, onCopy, onShare,
  tajweedMode = false, hideText = false, pageTheme = 'light', highlightTerm = ''
}) => {
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<storage.AyahReflection[]>([]);
  const [editingRefId, setEditingRefId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showTafsirAyah, setShowTafsirAyah] = useState<Record<number, boolean>>({});
  
  // Selection state (L2 highlight)
  const [selectedAyahs, setSelectedAyahs] = useState<Set<string>>(new Set());
  
  const lastScrolledIndex = useRef<number | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (activeAyahIndex !== null && activeAyahIndex !== lastScrolledIndex.current) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`ayah-${activeAyahIndex}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          lastScrolledIndex.current = activeAyahIndex;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeAyahIndex]);

  useEffect(() => {
    setReflections(storage.getAyahReflections());
  }, []);

  /**
   * Resolves visual style based on layered priority
   */
  const getAyahHighlight = useCallback((surahNum: number, ayahNum: number, text: string) => {
      const id = `${surahNum}:${ayahNum}`;
      
      // L1: Playback
      if (activeAyahIndex !== null && surah.ayahs[activeAyahIndex].numberInSurah === ayahNum) {
          return {
              priority: HighlightPriority.PLAYBACK,
              cardClasses: 'border-blue-400 dark:border-blue-600 bg-blue-50/20 dark:bg-blue-900/10 shadow-xl shadow-blue-500/10',
              textClasses: 'text-blue-900 dark:text-blue-100',
              markerClasses: 'text-blue-600 dark:text-blue-400'
          };
      }

      // L2: User Selection
      if (selectedAyahs.has(id)) {
          return {
              priority: HighlightPriority.SELECTION,
              cardClasses: 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-lg',
              textClasses: 'text-emerald-900 dark:text-emerald-100',
              markerClasses: 'text-emerald-600 dark:text-emerald-400'
          };
      }

      // L3: Search Match
      if (highlightTerm) {
          const normalizedAyah = normalizeArabic(text);
          const normalizedTerm = normalizeArabic(highlightTerm);
          if (normalizedAyah.includes(normalizedTerm)) {
              return {
                  priority: HighlightPriority.SEARCH,
                  cardClasses: 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10',
                  textClasses: 'text-amber-900 dark:text-amber-100',
                  markerClasses: 'text-amber-600 dark:text-amber-400'
              };
          }
      }

      // L4: Bookmark
      const isBookmarked = bookmarks.some(b => b.surahNumber === surahNum && b.ayahNumber === ayahNum);
      if (isBookmarked) {
          return {
              priority: HighlightPriority.BOOKMARK,
              cardClasses: 'border-rose-200 dark:border-rose-900 bg-rose-50/10 dark:bg-rose-900/5',
              textClasses: 'text-gray-800 dark:text-gray-200',
              markerClasses: 'text-rose-500 dark:text-rose-400'
          };
      }

      return { 
          priority: HighlightPriority.NONE, 
          cardClasses: 'border-gray-100 dark:border-dark-border/50 bg-white/60 dark:bg-dark-surface/40',
          textClasses: 'text-gray-900 dark:text-gray-100',
          markerClasses: 'text-emerald-700/80 dark:text-emerald-400/80'
      };
  }, [activeAyahIndex, surah, selectedAyahs, highlightTerm, bookmarks]);

  const handleAyahClick = (ayah: Ayah) => {
      const id = `${surah.number}:${ayah.numberInSurah}`;
      setSelectedAyahs(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-2xl leading-[2.4]';
      case 'medium': return 'text-3xl md:text-4xl leading-[2.4]';
      case 'large': return 'text-4xl md:text-5xl leading-[2.6]';
      case 'xlarge': return 'text-5xl md:text-6xl leading-[3]';
      default: return 'text-3xl leading-[2.4]';
    }
  };

  const toggleTafsir = (ayahNum: number) => {
    setShowTafsirAyah(prev => ({ ...prev, [ayahNum]: !prev[ayahNum] }));
  };

  const startEditing = (ayah: Ayah) => {
    const existing = reflections.find(r => r.surahNumber === surah.number && r.ayahNumber === ayah.numberInSurah);
    setEditingText(existing ? existing.text : '');
    setEditingRefId(ayah.numberInSurah);
  };

  const saveRef = (ayah: Ayah) => {
    if (!editingText.trim()) {
        storage.deleteAyahReflection(surah.number, ayah.numberInSurah);
    } else {
        storage.saveAyahReflection({
            surahNumber: surah.number,
            ayahNumber: ayah.numberInSurah,
            text: editingText.trim(),
            updatedAt: Date.now()
        });
    }
    setReflections(storage.getAyahReflections());
    setEditingRefId(null);
  };

  const nextSurah = surah.number < 114 ? QURAN_META[surah.number] : null;

  return (
    <div className={`space-y-8 max-w-4xl mx-auto px-2 ${pageTheme === 'sepia' ? 'text-[#5c4b37]' : ''}`}>
      {surah.number !== 1 && surah.number !== 9 && (
        <div className="flex flex-col items-center py-8 opacity-80">
          <div className="flex items-center gap-4 w-full max-w-xs mb-4">
             <div className="h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700 flex-1"></div>
             <span className="text-gray-400">﷽</span>
             <div className="h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700 flex-1"></div>
          </div>
          <div className={`font-quran text-4xl ${pageTheme === 'sepia' ? 'text-[#5c4b37]' : 'text-gray-800 dark:text-gray-200'}`}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
        </div>
      )}

      {surah.ayahs.map((ayah, index) => {
        const isActive = activeAyahIndex === index;
        const isBookmarked = bookmarks.some(b => b.surahNumber === surah.number && b.ayahNumber === ayah.numberInSurah);
        const reflection = reflections.find(r => r.surahNumber === surah.number && r.ayahNumber === ayah.numberInSurah);
        const isTafsirOpen = showTafsirAyah[ayah.numberInSurah];
        
        let ayahDisplay = ayah.text;
        if (surah.number !== 1 && ayah.numberInSurah === 1) {
            if (ayahDisplay.includes(BISMILLAH_TEXT)) {
                ayahDisplay = ayahDisplay.replace(BISMILLAH_TEXT, "").trim();
            }
        }

        const highlights = getAyahHighlight(surah.number, ayah.numberInSurah, ayahDisplay);

        let finalAyahContent: React.ReactNode = ayahDisplay;
        if (highlightTerm) {
            const regex = getHighlightRegex(highlightTerm);
            if (regex) {
                const parts = ayahDisplay.split(regex);
                finalAyahContent = parts.map((part, i) => 
                    regex.test(part) ? <span key={i} className="bg-amber-400/30 text-amber-900 dark:text-amber-100 rounded px-0.5">{part}</span> : part
                );
            }
        } else if (tajweedMode) {
            finalAyahContent = <span dangerouslySetInnerHTML={{ __html: applyTajweed(ayahDisplay) }} />;
        }

        return (
          <div 
            key={ayah.number} 
            id={`ayah-${index}`} 
            className={`
              relative rounded-[2rem] p-6 md:p-8 transition-all duration-500 border 
              ${highlights.cardClasses}
              ${isActive ? 'scale-[1.02] z-10 ring-4 ring-blue-50 dark:ring-blue-900/10' : 'hover:scale-[1.005]'}
            `}
          >
            <div className={`flex items-center justify-between mb-6 border-b border-gray-100 dark:border-dark-border/50 pb-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">الآية</span>
                    <span className={`text-xs font-bold font-english opacity-60 ${highlights.markerClasses}`}>{surah.number}:{ayah.numberInSurah}</span>
                </div>
                
                <div className="flex gap-1">
                    <button onClick={() => toggleTafsir(ayah.numberInSurah)} className={`p-2 rounded-full transition-all ${isTafsirOpen ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`} title="التفسير"><BookOpen size={20} /></button>
                    <button onClick={() => startEditing(ayah)} className={`p-2 rounded-full transition-all ${reflection ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`} title="تدبر وملاحظات"><Edit3 size={20} /></button>
                    <button onClick={() => onToggleBookmark(ayah)} className={`p-2 rounded-full transition-all active:scale-90 ${isBookmarked ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`} title="حفظ العلامة"><Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} /></button>
                    <button onClick={() => onCopy(ayahDisplay)} className="p-2 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-dark-bg transition-all" title="نسخ"><Copy size={20} /></button>
                    <button onClick={() => onPlayAyah(index)} className={`p-2 rounded-full transition-all active:scale-90 ${isActive && isPlaying ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`} title="استماع"><Play size={20} fill={isActive && isPlaying ? "currentColor" : "none"} /></button>
                </div>
            </div>

            <div className="relative mb-4">
              <p 
                className={`font-quran text-right cursor-pointer select-text transition-all duration-300 ${getFontSizeClass()} ${highlights.textClasses} ${hideText ? 'blur-[8px] hover:blur-none active:blur-none' : ''}`} 
                onClick={() => handleAyahClick(ayah)} 
                dir="rtl"
              >
                  {finalAyahContent}
                  <VerseMarker number={ayah.numberInSurah} classes={highlights.markerClasses} />
              </p>
            </div>

            {editingRefId === ayah.numberInSurah && (
                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 animate-slideUp">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">ملاحظة وتدبر</span>
                        <button onClick={() => setEditingRefId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16}/></button>
                    </div>
                    <textarea 
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full bg-white dark:bg-dark-bg p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-arabic min-h-[100px]"
                        placeholder="اكتب ما تدبرته من هذه الآية الكريمة..."
                    />
                    <div className="flex justify-end mt-3">
                        <button onClick={() => saveRef(ayah)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                            <Save size={16} />
                            حفظ الملاحظة
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4 animate-fadeIn">
                {showTranslation && (
                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-200 dark:bg-emerald-800 rounded-full opacity-50"></div>
                        <div className="pl-6 text-left">
                            <p className="text-gray-600 dark:text-gray-300 font-english text-lg leading-relaxed italic">{ayah.translation}</p>
                        </div>
                    </div>
                )}
                
                {isTafsirOpen && (
                    <div className="text-right bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 relative overflow-hidden animate-slideUp">
                        <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
                            <BookOpen size={18} />
                            <span className="text-xs font-bold font-arabicHead">التفسير الميسر</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-loose font-arabic text-justify">{ayah.tafsir}</p>
                        <Quote size={40} className="absolute -bottom-2 -left-2 text-amber-500/5 rotate-180 pointer-events-none" />
                    </div>
                )}

                {reflection && editingRefId !== ayah.numberInSurah && (
                    <div className="text-right bg-blue-50/30 dark:bg-blue-900/5 p-4 rounded-2xl border border-blue-100/30 dark:border-blue-900/30 animate-fadeIn">
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <Edit3 size={14} />
                                <span className="text-[10px] font-bold font-arabicHead uppercase tracking-wider">خاطرة تدبر</span>
                             </div>
                             <button onClick={() => { if(confirm('حذف الملاحظة؟')) { storage.deleteAyahReflection(surah.number, ayah.numberInSurah); setReflections(storage.getAyahReflections()); }}} className="p-1 text-red-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-base font-arabic">{reflection.text}</p>
                    </div>
                )}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col md:flex-row gap-4 pt-12 pb-16">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-1 flex items-center justify-center gap-3 p-6 rounded-[2rem] bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-200 transition-all font-bold group shadow-sm"
        >
          <ArrowUp size={20} className="group-hover:-translate-y-1 transition-transform" />
          <span>العودة لبداية السورة</span>
        </button>

        {nextSurah && (
          <button 
            onClick={() => {
                navigate(`/quran/${nextSurah.number}`);
                window.scrollTo(0, 0);
            }}
            className="flex-1 flex items-center justify-center gap-3 p-6 rounded-[2rem] bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-600/20 group"
          >
            <span>السورة التالية: {nextSurah.name}</span>
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform rtl:rotate-0" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TextModeViewer;