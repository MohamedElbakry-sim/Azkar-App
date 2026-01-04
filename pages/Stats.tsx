import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Flame, CheckCircle, BarChart3, Calendar, RefreshCw, X, Award, ChevronLeft, ChevronRight, Circle, Palette, Check } from 'lucide-react';
import * as storage from '../services/storage';
import { AZKAR_DATA, CATEGORIES } from '../data';
import { ProgressState } from '../types';

/**
 * Generates a consistent date key YYYY-MM-DD in local time to avoid UTC offset issues.
 */
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Stats: React.FC = () => {
  const [stats, setStats] = useState<storage.StatsData | null>(null);
  const [history, setHistory] = useState<ProgressState>({});
  const [themeColor, setThemeColor] = useState<storage.HeatmapTheme>(() => storage.getHeatmapTheme());
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  // Navigation Limit: End of next year
  const maxMonthOffset = useMemo(() => {
    const now = new Date();
    const endOfNextYear = new Date(now.getFullYear() + 1, 11, 1);
    const diffMonths = (endOfNextYear.getFullYear() - now.getFullYear()) * 12 + (endOfNextYear.getMonth() - now.getMonth());
    return diffMonths;
  }, []);

  useEffect(() => {
    setStats(storage.getStats());
    setHistory(storage.getHistory());
    
    const handleThemeChange = () => {
        setThemeColor(storage.getHeatmapTheme());
    };
    window.addEventListener('heatmap-theme-changed', handleThemeChange);
    return () => window.removeEventListener('heatmap-theme-changed', handleThemeChange);
  }, []);

  const themes: { id: storage.HeatmapTheme; label: string; color: string }[] = [
      { id: 'lime', label: 'ليموني', color: 'bg-lime-500' },
      { id: 'olive', label: 'زيتوني', color: 'bg-[#808000]' },
      { id: 'ice', label: 'جليدي', color: 'bg-sky-400' },
      { id: 'magenta', label: 'أرجواني', color: 'bg-fuchsia-500' },
      { id: 'flame', label: 'لهبي', color: 'bg-orange-500' },
      { id: 'emerald', label: 'زمردي', color: 'bg-emerald-500' },
  ];

  const handleThemeSelect = (theme: storage.HeatmapTheme) => {
      storage.saveHeatmapTheme(theme);
      setShowThemePicker(false);
  };

  const goToToday = () => {
    setMonthOffset(0);
    if (heatmapScrollRef.current) {
        // In RTL, 0 is the rightmost scroll position
        heatmapScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  if (!stats) return <div className="p-10 text-center flex justify-center"><RefreshCw className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 px-4">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2 font-arabicHead">إحصائياتك</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">تابع تقدمك واستمر في الذكر</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 md:p-4 rounded-full text-orange-600 dark:text-orange-400 mb-3">
                <Flame size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-5xl font-black text-gray-900 dark:text-gray-100 font-arabicHead">{stats.currentStreak}</span>
            <span className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-1 font-bold font-arabic">أيام متتالية</span>
        </div>

        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 md:p-4 rounded-full text-emerald-600 dark:text-emerald-400 mb-3">
                <Award size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-5xl font-black text-gray-900 dark:text-gray-100 font-arabicHead">{stats.totalDhikrCompleted}</span>
            <span className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-1 font-bold font-arabic">إجمالي الأذكار</span>
        </div>

        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-blue-100 dark:bg-blue-900/30 p-3 md:p-4 rounded-full text-blue-600 dark:text-blue-400 mb-3">
                <BarChart3 size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-5xl font-black text-gray-900 dark:text-gray-100 font-arabicHead">{stats.weeklyCount}</span>
            <span className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-1 font-bold font-arabic">ذكر هذا الأسبوع</span>
        </div>

        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 md:p-4 rounded-full text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-5xl font-black text-gray-900 dark:text-gray-100 font-arabicHead">{stats.todayCount}</span>
            <span className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-1 font-bold font-arabic">ذكر اليوم</span>
        </div>
      </div>

      {/* --- HEATMAP SECTION (RTL) --- */}
      <div className="mt-12 bg-white dark:bg-dark-surface p-6 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-dark-border shadow-soft relative" dir="rtl">
        
        {/* Top bar controls */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 font-arabic">سجل النشاط اليومي</span>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Navigation */}
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-dark-elevated p-1 rounded-xl" dir="ltr">
                    <button 
                        onClick={() => setMonthOffset(prev => prev - 1)}
                        className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
                        title="الماضي"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                        onClick={goToToday}
                        className={`p-2 transition-colors ${monthOffset === 0 ? 'text-primary-500' : 'text-gray-500 hover:text-primary-500'}`}
                        title="العودة لليوم"
                    >
                        <Circle size={14} fill={monthOffset === 0 ? "currentColor" : "none"} />
                    </button>
                    <button 
                        onClick={() => setMonthOffset(prev => Math.min(maxMonthOffset, prev + 1))}
                        disabled={monthOffset >= maxMonthOffset}
                        className="p-2 text-gray-500 hover:text-primary-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="المستقبل"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Color Palette Toggle */}
                <div className="relative">
                    <button 
                        onClick={() => setShowThemePicker(!showThemePicker)}
                        className={`p-2.5 rounded-xl transition-all ${showThemePicker ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-400 hover:text-primary-500 bg-gray-50 dark:bg-dark-elevated'}`}
                        title="تغيير الألوان"
                    >
                        <Palette size={18} />
                    </button>
                    
                    {showThemePicker && (
                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-dark-surface p-3 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border z-[60] min-w-[140px] animate-popIn">
                            <div className="space-y-1">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleThemeSelect(t.id)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors text-right"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${t.color}`} />
                                            <span className="text-xs font-bold font-arabic text-gray-700 dark:text-gray-200">{t.label}</span>
                                        </div>
                                        {themeColor === t.id && <Check size={14} className="text-primary-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div 
          ref={heatmapScrollRef}
          className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-6 scroll-smooth"
        >
            {/* Weekday Labels (Arabic) */}
            <div className="flex flex-col gap-[4px] -mt-[2px] text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-gray-500 pl-2 select-none border-l border-gray-100 dark:border-gray-800 w-12 md:w-14 shrink-0">
                <span className="h-[14px] md:h-[16px] flex items-center justify-start">الإثنين</span>
                <span className="h-[14px] md:h-[16px] flex items-center justify-start">الثلاثاء</span>
                <span className="h-[14px] md:h-[16px] flex items-center justify-start">الأربعاء</span>
                <span className="h-[14px] md:h-[16px] flex items-center justify-start">الخميس</span>
                <span className="h-[14px] md:h-[16px] flex items-center justify-start">الجمعة</span>
                <span className="h-[14px] md:h-[16px] flex items-center justify-start">السبت</span>
                <span className="h-[14px] md:h-[16px] flex items-center justify-start">الأحد</span>
            </div>

            {/* Monthly Grid Blocks */}
            <AnkiStyleGrid history={history} theme={themeColor} monthOffset={monthOffset} />
        </div>
        
        {/* Legend (RTL Order) */}
        <div className="mt-4 flex justify-start items-center gap-2">
            <span className="text-[10px] text-gray-400 font-arabic">أكثر</span>
            <div className="flex gap-1" dir="ltr">
                {[0, 5, 15, 30, 50].map((v) => (
                    <div key={v} className={`w-3 h-3 rounded-[2px] ${getLegendColor(v, themeColor)}`} />
                ))}
            </div>
            <span className="text-[10px] text-gray-400 font-arabic">أقل</span>
        </div>
      </div>
    </div>
  );
};

// Legend color helper
const getLegendColor = (count: number, theme: storage.HeatmapTheme) => {
    if (count === 0) return 'bg-gray-100 dark:bg-[#2d333b]';
    return getHeatmapColor(count, theme);
};

// Central color logic for the heatmap
const getHeatmapColor = (count: number, theme: storage.HeatmapTheme) => {
    if (count === 0) return 'bg-gray-100 dark:bg-[#2d333b]';
    
    switch(theme) {
        case 'lime':
            if (count < 5) return 'bg-lime-900/60';
            if (count < 15) return 'bg-lime-700';
            if (count < 30) return 'bg-lime-500';
            return 'bg-lime-300';
        case 'olive':
            if (count < 5) return 'bg-[#556B2F]/60';
            if (count < 15) return 'bg-[#6B8E23]';
            if (count < 30) return 'bg-[#808000]';
            return 'bg-[#BDB76B]';
        case 'ice':
            if (count < 5) return 'bg-sky-900/60';
            if (count < 15) return 'bg-sky-600';
            if (count < 30) return 'bg-sky-400';
            return 'bg-sky-200';
        case 'magenta':
            if (count < 5) return 'bg-fuchsia-900/60';
            if (count < 15) return 'bg-fuchsia-700';
            if (count < 30) return 'bg-fuchsia-500';
            return 'bg-fuchsia-300';
        case 'flame':
            if (count < 5) return 'bg-red-900/60';
            if (count < 15) return 'bg-orange-600';
            if (count < 30) return 'bg-orange-400';
            return 'bg-yellow-400';
        default: // Emerald
            if (count < 5) return 'bg-emerald-900/60';
            if (count < 15) return 'bg-emerald-700';
            if (count < 30) return 'bg-emerald-500';
            return 'bg-emerald-300';
    }
};

// --- Sub-Component: AnkiStyleGrid ---

interface AnkiGridProps {
    history: ProgressState;
    theme: storage.HeatmapTheme;
    monthOffset: number;
}

const AnkiStyleGrid: React.FC<AnkiGridProps> = ({ history, theme, monthOffset }) => {
    const [tooltip, setTooltip] = useState<any>(null);
    const [selectedDay, setSelectedDay] = useState<any>(null);

    const months = useMemo(() => {
        const result = [];
        const baseDate = new Date();
        for (let i = 0; i <= 8; i++) {
            const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset - i, 1);
            result.push(date);
        }
        return result;
    }, [monthOffset]);

    const getCountForDate = (date: Date): number => {
        const key = getLocalDateKey(date);
        const dayData = history[key];
        if (!dayData) return 0;
        return (Object.values(dayData) as number[]).reduce((a, b) => (b > 0 ? a + b : a), 0);
    };

    const handleMouseEnter = (e: React.MouseEvent, date: Date) => {
        const count = getCountForDate(date);
        const rect = e.currentTarget.getBoundingClientRect();
        const dateStr = new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        setTooltip({ x: rect.left + rect.width / 2, y: rect.top, date: dateStr, count });
    };

    const handleDayClick = (date: Date) => {
        const count = getCountForDate(date);
        if (count === 0) return;
        const dateKey = getLocalDateKey(date);
        const dateStr = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        const dayData = history[dateKey] || {};
        const catCounts: any = {};
        Object.entries(dayData).forEach(([id, val]) => {
            const v = val as number;
            if (v <= 0) return;
            const dhikr = AZKAR_DATA.find(d => d.id === parseInt(id));
            const title = dhikr ? (CATEGORIES.find(c => c.id === dhikr.category)?.title || 'أخرى') : 'أخرى';
            catCounts[title] = (catCounts[title] || 0) + v;
        });
        setSelectedDay({ 
            date: dateStr, 
            count, 
            categories: Object.entries(catCounts).map(([title, count]) => ({ title, count: count as number })) 
        });
    };

    return (
        <div className="flex gap-6">
            {months.map((monthStart, mIdx) => {
                const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
                const startDayOffset = (monthStart.getDay() + 6) % 7; 
                
                const monthName = monthStart.toLocaleString('ar-SA', { month: 'long' });
                const yearFull = monthStart.getFullYear();
                const monthLabel = `${monthName} ${yearFull}`;

                return (
                    <div key={mIdx} className="flex flex-col gap-3">
                        <div className="grid grid-rows-7 grid-flow-col gap-[4px]">
                            {Array.from({ length: startDayOffset }).map((_, i) => (
                                <div key={`pad-${i}`} className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
                                const count = getCountForDate(date);
                                const isToday = getLocalDateKey(date) === getLocalDateKey(new Date());

                                return (
                                    <button 
                                        key={i}
                                        onMouseEnter={(e) => handleMouseEnter(e, date)}
                                        onMouseLeave={() => setTooltip(null)}
                                        onClick={() => handleDayClick(date)}
                                        className={`
                                            w-[14px] h-[14px] md:w-[16px] md:h-[16px] rounded-[2px] transition-all cursor-pointer relative
                                            ${getHeatmapColor(count, theme)}
                                            ${isToday ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-dark-surface z-10' : 'hover:ring-1 hover:ring-primary-400'}
                                        `}
                                    />
                                );
                            })}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 text-center tracking-tight font-arabicHead whitespace-nowrap">
                            {monthLabel}
                        </span>
                    </div>
                );
            })}

            {tooltip && (
                <div 
                    className="fixed z-50 px-3 py-1.5 bg-gray-900/95 backdrop-blur text-white text-[10px] rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full border border-gray-700 whitespace-nowrap mb-2 font-arabicHead"
                    style={{ left: tooltip.x, top: tooltip.y - 4 }}
                >
                     <div className="text-center">
                        <span className="font-black ml-1">{tooltip.count}</span>
                        <span>ذكر - {tooltip.date}</span>
                     </div>
                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900/95"></div>
                </div>
            )}

            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedDay(null)}>
                    <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-popIn border border-gray-100 dark:border-dark-border" onClick={e => e.stopPropagation()}>
                        <div className={`p-6 text-white text-center relative bg-gradient-to-r ${getModalGradient(theme)}`}>
                            <button onClick={() => setSelectedDay(null)} className="absolute top-4 left-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"><X size={18} /></button>
                            <Calendar size={32} className="mx-auto mb-2 opacity-80" />
                            <h3 className="text-xl font-bold font-arabicHead">{selectedDay.date}</h3>
                            <div className="mt-2 inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-bold backdrop-blur-md font-arabicHead">إجمالي {selectedDay.count} ذكر</div>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-100 dark:border-dark-border pb-2 font-arabicHead">تفاصيل اليوم</h4>
                            <div className="space-y-3">
                                {selectedDay.categories.map((cat: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
                                        <span className="font-medium text-gray-700 dark:text-gray-200 font-arabic">{cat.title}</span>
                                        <span className={`font-arabicHead font-black text-xl ${getTextColor(theme)}`}>{cat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getModalGradient = (theme: storage.HeatmapTheme) => {
    switch(theme) {
        case 'lime': return 'from-lime-600 to-lime-700';
        case 'olive': return 'from-[#808000] to-[#556B2F]';
        case 'ice': return 'from-sky-500 to-sky-700';
        case 'magenta': return 'from-fuchsia-600 to-fuchsia-800';
        case 'flame': return 'from-orange-500 to-red-600';
        default: return 'from-emerald-600 to-teal-700';
    }
};

const getTextColor = (theme: storage.HeatmapTheme) => {
    switch(theme) {
        case 'lime': return 'text-lime-600 dark:text-lime-400';
        case 'olive': return 'text-[#808000] dark:text-[#BDB76B]';
        case 'ice': return 'text-sky-600 dark:text-sky-400';
        case 'magenta': return 'text-fuchsia-600 dark:text-fuchsia-400';
        case 'flame': return 'text-red-600 dark:text-red-400';
        default: return 'text-emerald-600 dark:text-emerald-400';
    }
};

export default Stats;