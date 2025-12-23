import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, Book, MessageCircle, Star, Sparkles, ChevronLeft, Loader2, ArrowRight, Filter } from 'lucide-react';
import { AZKAR_DATA, NAMES_OF_ALLAH, SITUATIONAL_DUAS, CATEGORIES } from '../data';
import * as quranService from '../services/quranService';
import * as storage from '../services/storage';
import { normalizeArabic } from '../utils';

interface SpotlightResult {
  id: string;
  type: 'azkar' | 'quran' | 'names' | 'duas' | 'categories';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ReactNode;
}

type SearchFilter = 'all' | 'quran' | 'azkar' | 'names' | 'duas';

const SpiritualSpotlight: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [quranResults, setQuranResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');

  // Auto-focus input and reset state when opened
  useEffect(() => {
    if (isOpen) {
        setQuery('');
        setSelectedIndex(0);
        setActiveFilter('all');
        setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle Quran search with debounce
  useEffect(() => {
    if (!query.trim() || (activeFilter !== 'all' && activeFilter !== 'quran')) {
        setQuranResults([]);
        return;
    }

    const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
            const results = await quranService.searchGlobal(query);
            setQuranResults(results.slice(0, 5));
        } catch (e) {
            setQuranResults([]);
        } finally {
            setIsSearching(false);
        }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, activeFilter]);

  // Unified Search Logic
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalizedQuery = normalizeArabic(query.toLowerCase());

    const combined: SpotlightResult[] = [];

    // 1. Categories & Duas Library (Quick Navigation)
    if (activeFilter === 'all' || activeFilter === 'duas') {
        [...CATEGORIES, ...SITUATIONAL_DUAS].forEach(cat => {
            if (normalizeArabic(cat.title).includes(normalizedQuery)) {
                combined.push({
                    id: `cat-${cat.id}`,
                    type: 'categories',
                    title: cat.title,
                    subtitle: 'قسم في التطبيق',
                    path: 'theme' in cat ? `/category/${cat.id}` : `/duas`,
                    icon: <ChevronLeft size={18} className="text-gray-400" />
                });
            }
        });

        // Search within situational dua items
        SITUATIONAL_DUAS.forEach((cat, cIdx) => {
            cat.items.forEach((dua, dIdx) => {
                if (normalizeArabic(dua.text).includes(normalizedQuery)) {
                    combined.push({
                        id: `dua-${cIdx}-${dIdx}`,
                        type: 'duas',
                        title: dua.text.substring(0, 50) + '...',
                        subtitle: `في قسم ${cat.title}`,
                        path: `/duas`,
                        icon: <MessageCircle size={18} className="text-teal-500" />
                    });
                }
            });
        });
    }

    // 2. Names of Allah
    if (activeFilter === 'all' || activeFilter === 'names') {
        NAMES_OF_ALLAH.forEach(name => {
            if (normalizeArabic(name.arabic).includes(normalizedQuery) || 
                normalizeArabic(name.meaning).includes(normalizedQuery)) {
                combined.push({
                    id: `name-${name.id}`,
                    type: 'names',
                    title: name.arabic,
                    subtitle: name.meaning,
                    path: '/names',
                    icon: <Star size={18} className="text-amber-500" />
                });
            }
        });
    }

    // 3. Azkar
    if (activeFilter === 'all' || activeFilter === 'azkar') {
        const customDhikrs = storage.getCustomDhikrs();
        [...AZKAR_DATA, ...customDhikrs].forEach(item => {
            if (normalizeArabic(item.text).includes(normalizedQuery)) {
                combined.push({
                    id: `azkar-${item.id}`,
                    type: 'azkar',
                    title: item.text.substring(0, 60) + '...',
                    subtitle: item.source || 'ذكر مأثور',
                    path: item.category === 'custom' ? '/custom-athkar' : `/category/${item.category}`,
                    icon: <Sparkles size={18} className="text-primary-500" />
                });
            }
        });
    }

    // 4. Quran
    if (activeFilter === 'all' || activeFilter === 'quran') {
        quranResults.forEach((q, idx) => {
            combined.push({
                id: `quran-${idx}`,
                type: 'quran',
                title: q.text.substring(0, 60) + '...',
                subtitle: `سورة ${q.surah?.name || ''} - آية ${q.numberInSurah}`,
                path: `/quran/${q.surah?.number}?ayah=${q.numberInSurah}`,
                icon: <Book size={18} className="text-emerald-600" />
            });
        });
    }

    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique.slice(0, 10);
  }, [query, quranResults, activeFilter]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (results.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex].path);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  if (!isOpen) return null;

  const filters: { id: SearchFilter, label: string }[] = [
      { id: 'all', label: 'الكل' },
      { id: 'quran', label: 'قرآن' },
      { id: 'azkar', label: 'أذكار' },
      { id: 'names', label: 'الأسماء' },
      { id: 'duas', label: 'أدعية' }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 px-4 md:pt-32">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md animate-fadeIn" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-dark-surface rounded-[2rem] shadow-2xl shadow-black/20 overflow-hidden animate-slideUp border border-gray-100 dark:border-dark-border">
        
        {/* Search Header */}
        <div className="pt-6">
            <div className="flex items-center pb-4 px-6 border-b border-gray-100 dark:border-dark-border">
              <Search size={24} className="text-gray-400 ml-4 shrink-0" />
              <input 
                ref={inputRef}
                type="text" 
                placeholder="ابحث في القرآن، الأذكار، أو أسماء الله..."
                className="flex-1 bg-transparent border-none outline-none text-xl font-arabic placeholder-gray-400 dark:text-white"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                }}
              />
              {isSearching && <Loader2 size={20} className="animate-spin text-primary-500 mr-2" />}
              <button 
                onClick={onClose}
                className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Filter Tabs Container with Fade Effect */}
            <div className="relative group">
                {/* Left/Right Fades to indicate scrolling */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white dark:from-dark-surface to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-dark-surface to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-center gap-2 py-4 overflow-x-auto no-scrollbar scroll-smooth px-6">
                    <div className="text-gray-400 ml-2 shrink-0">
                        <Filter size={14} />
                    </div>
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => {
                                setActiveFilter(f.id);
                                setSelectedIndex(0);
                            }}
                            className={`
                                px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border shrink-0
                                ${activeFilter === f.id 
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20' 
                                    : 'bg-gray-50 dark:bg-dark-bg text-gray-500 border-gray-100 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-elevated'
                                }
                            `}
                        >
                            {f.label}
                        </button>
                    ))}
                    {/* Extra padding item to ensure last element is fully scrollable and visible */}
                    <div className="w-4 shrink-0 h-1"></div>
                </div>
            </div>
        </div>

        {/* Results Body */}
        <div className="max-h-[50vh] overflow-y-auto no-scrollbar py-2">
            {query && results.length > 0 ? (
                <div className="px-2 space-y-1">
                    {results.map((res, idx) => (
                        <button
                            key={res.id}
                            onClick={() => handleSelect(res.path)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`
                                w-full text-right p-4 rounded-2xl flex items-center justify-between transition-all group
                                ${selectedIndex === idx ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800/50' : 'hover:bg-gray-50 dark:hover:bg-dark-bg'}
                            `}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`p-2.5 rounded-xl transition-colors ${selectedIndex === idx ? 'bg-white dark:bg-dark-surface shadow-sm' : 'bg-gray-100 dark:bg-dark-bg text-gray-400'}`}>
                                    {res.icon}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`font-bold font-arabicHead truncate ${selectedIndex === idx ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                        {res.title}
                                    </span>
                                    {res.subtitle && (
                                        <span className="text-[10px] text-gray-400 font-arabic truncate mt-0.5 opacity-80">
                                            {res.subtitle}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`mr-4 transition-transform ${selectedIndex === idx ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'}`}>
                                <ArrowRight size={18} className="text-primary-500 rtl:rotate-0" />
                            </div>
                        </button>
                    ))}
                </div>
            ) : query ? (
                <div className="py-20 text-center flex flex-col items-center gap-4 animate-fadeIn">
                    <div className="p-5 bg-gray-50 dark:bg-dark-bg rounded-full text-gray-300">
                        <Search size={48} />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold">لا توجد نتائج مطابقة</p>
                        <p className="text-xs text-gray-400 mt-1">حاول استخدام كلمات مختلفة أو تغيير الفلتر</p>
                    </div>
                </div>
            ) : (
                <div className="py-12 px-8">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Sparkles size={14} className="text-primary-500" />
                        اقتراحات سريعة
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { label: 'أذكار الصباح', path: '/category/sabah' },
                            { label: 'سورة الكهف', path: '/quran/18' },
                            { label: 'السبحة', path: '/tasbeeh' },
                            { label: 'مواقيت الصلاة', path: '/prayers' },
                            { label: 'أسماء الله', path: '/names' },
                            { label: 'المفضلة', path: '/favorites' }
                        ].map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSelect(s.path)}
                                className="p-3 bg-gray-50 dark:bg-dark-bg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-bold rounded-xl border border-gray-100 dark:border-dark-border transition-all text-center"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 dark:bg-dark-bg/50 px-6 py-3 border-t border-gray-100 dark:border-dark-border flex justify-between items-center text-[10px] text-gray-400 font-bold">
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border px-1.5 rounded shadow-sm">Enter</kbd> للاختيار</span>
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border px-1.5 rounded shadow-sm">↑↓</kbd> للتنقل</span>
            </div>
            <span>اضغط <kbd className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border px-1.5 rounded shadow-sm">Esc</kbd> للإغلاق</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SpiritualSpotlight;