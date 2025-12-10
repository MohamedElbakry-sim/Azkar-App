import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Flame, CheckCircle, BarChart3, ListTodo, X, Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import * as storage from '../services/storage';
import { AZKAR_DATA, CATEGORIES } from '../data';
import { ProgressState } from '../types';

/**
 * Stats Page Component.
 * Displays user progress, streaks, and a contribution heatmap.
 */
const Stats: React.FC = () => {
  const [stats, setStats] = useState<storage.StatsData | null>(null);
  const [history, setHistory] = useState<ProgressState>({});
  const [totalMissed, setTotalMissed] = useState(0);

  // Heatmap Customization State
  const [timeRange, setTimeRange] = useState<number>(30); // Default Last Month
  // Removed 'orange' as requested, kept 'emerald' (default), 'blue', and 'flame'
  const [themeColor, setThemeColor] = useState<'emerald' | 'blue' | 'flame'>('emerald');
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStats(storage.getStats());
    setHistory(storage.getHistory());
    
    // Calculate total missed prayers
    const missed = storage.getMissedPrayers();
    const missedSum = Object.values(missed).reduce((a, b) => a + b, 0);
    setTotalMissed(missedSum);

    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsRangeDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!stats) return <div className="p-10 text-center flex justify-center"><RefreshCw className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">إحصائياتك</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">تابع تقدمك واستمر في الذكر</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Streak */}
        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 md:p-4 rounded-full text-orange-600 dark:text-orange-400 mb-3">
                <Flame size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{stats.currentStreak}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">أيام متتالية</span>
        </div>

        {/* Weekly */}
        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-blue-100 dark:bg-blue-900/30 p-3 md:p-4 rounded-full text-blue-600 dark:text-blue-400 mb-3">
                <BarChart3 size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{stats.weeklyCount}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">ذكر هذا الأسبوع</span>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 md:p-4 rounded-full text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{stats.todayCount}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">ذكر اليوم</span>
        </div>

        {/* Missed Prayers (Qada) */}
        <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-2xl shadow-sm border border-red-100 dark:border-dark-border flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-red-100 dark:bg-red-900/30 p-3 md:p-4 rounded-full text-red-600 dark:text-red-400 mb-3">
                <ListTodo size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{totalMissed}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">صلاة فائتة</span>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white dark:bg-dark-surface p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                سجل الاستمرارية
            </h3>
            
            {/* Customization Controls */}
            <div className="flex items-center gap-3">
                {/* Range Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <Calendar size={14} />
                        {timeRange === 7 ? 'أسبوع' : timeRange === 30 ? 'شهر' : '3 أشهر'}
                        <ChevronDown size={12} className={`transition-transform ${isRangeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isRangeDropdownOpen && (
                        <div className="absolute left-0 top-full mt-2 w-32 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-gray-100 dark:border-dark-border z-20 overflow-hidden animate-fadeIn">
                            {[7, 30, 90].map(days => (
                                <button
                                    key={days}
                                    onClick={() => {
                                        setTimeRange(days);
                                        setIsRangeDropdownOpen(false);
                                    }}
                                    className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${timeRange === days ? 'text-primary-500 font-bold bg-primary-50 dark:bg-primary-900/10' : 'text-gray-600 dark:text-gray-300'}`}
                                >
                                    {days === 7 ? 'آخر أسبوع' : days === 30 ? 'آخر شهر' : 'آخر 3 أشهر'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme Selector */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                    {(['emerald', 'blue', 'flame'] as const).map(color => (
                        <button
                            key={color}
                            onClick={() => setThemeColor(color)}
                            className={`w-5 h-5 rounded-md transition-all ${
                                color === 'emerald' ? 'bg-emerald-500' : 
                                color === 'blue' ? 'bg-blue-500' : 
                                'bg-gradient-to-br from-yellow-400 to-red-500' // Flame Icon
                            } ${themeColor === color ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 scale-110' : 'opacity-50 hover:opacity-100'}`}
                            aria-label={`Theme ${color}`}
                            title={color === 'flame' ? 'لهب' : color}
                        />
                    ))}
                </div>
            </div>
        </div>
        
        {/* Graph Component */}
        <ContributionGraph history={history} daysCount={timeRange} theme={themeColor} />
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-6 text-xs text-gray-400" dir="rtl">
            <span>أقل</span>
            <div className="flex gap-1" dir="ltr">
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700"></div>
                
                {/* Dynamic Legend based on Theme */}
                {themeColor === 'flame' ? (
                    <>
                        <div className="w-3 h-3 rounded-sm bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                        <div className="w-3 h-3 rounded-sm bg-red-600"></div>
                    </>
                ) : (
                    <>
                        <div className={`w-3 h-3 rounded-sm ${
                            themeColor === 'blue' ? 'bg-blue-300' : 
                            'bg-emerald-300'
                        }`}></div>
                        <div className={`w-3 h-3 rounded-sm ${
                            themeColor === 'blue' ? 'bg-blue-500' : 
                            'bg-emerald-500'
                        }`}></div>
                        <div className={`w-3 h-3 rounded-sm ${
                            themeColor === 'blue' ? 'bg-blue-600' : 
                            'bg-emerald-600'
                        }`}></div>
                    </>
                )}
            </div>
            <span>أكثر</span>
        </div>
      </div>
    </div>
  );
};

// --- Heatmap Sub-Components & Types ---

interface TooltipData {
  x: number;
  y: number;
  date: string;
  count: number;
}

interface DetailModalData {
    date: string;
    count: number;
    categories: { title: string; count: number; isQada: boolean }[];
}

interface ContributionGraphProps {
    history: ProgressState;
    daysCount: number;
    theme: 'emerald' | 'blue' | 'flame';
}

/**
 * Renders the contribution heatmap grid.
 * If range is > 30 days (e.g., 90), it splits the view into monthly blocks.
 */
const ContributionGraph: React.FC<ContributionGraphProps> = ({ history, daysCount, theme }) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [selectedDay, setSelectedDay] = useState<DetailModalData | null>(null);

    const getCountForDate = (date: Date) => {
        const key = date.toISOString().split('T')[0];
        const dayData = history[key];
        if (!dayData) return 0;
        return Object.values(dayData).reduce((a, b) => (b > 0 ? a + b : a), 0);
    };

    const getColor = (count: number) => {
        if (!count) return 'bg-gray-100 dark:bg-gray-700/50';
        
        if (theme === 'blue') {
            if (count < 5) return 'bg-blue-300 dark:bg-blue-400';
            if (count < 15) return 'bg-blue-500';
            return 'bg-blue-600';
        }
        if (theme === 'flame') {
            if (count < 5) return 'bg-yellow-400';
            if (count < 15) return 'bg-orange-500';
            return 'bg-red-600';
        }
        // Default Emerald
        if (count < 5) return 'bg-emerald-300 dark:bg-emerald-400';
        if (count < 15) return 'bg-emerald-500';
        return 'bg-emerald-600';
    };

    const handleMouseEnter = (e: React.MouseEvent, date: Date) => {
        const count = getCountForDate(date);
        const rect = e.currentTarget.getBoundingClientRect();
        const dateStr = new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top,
            date: dateStr,
            count
        });
    };

    const handleDayClick = (date: Date) => {
        const count = getCountForDate(date);
        setTooltip(null);
        
        if (count === 0) return;

        const dateKey = date.toISOString().split('T')[0];
        const dateStr = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        
        const dayData = history[dateKey] || {};
        const catCounts: { [key: string]: { count: number, isQada: boolean } } = {};
        
        Object.entries(dayData).forEach(([dhikrIdStr, val]) => {
            const value = val as number;
            const dhikrId = parseInt(dhikrIdStr);
            if (value <= 0) return;
            
            if (dhikrId === 9999) {
                catCounts['صلوات مقضية'] = { count: value, isQada: true };
            } else {
                const dhikr = AZKAR_DATA.find(d => d.id === dhikrId);
                if (dhikr) {
                    const cat = CATEGORIES.find(c => c.id === dhikr.category);
                    const title = cat ? cat.title : 'أخرى';
                    const current = catCounts[title] || { count: 0, isQada: false };
                    catCounts[title] = { count: current.count + value, isQada: false };
                }
            }
        });

        const sortedCategories = Object.entries(catCounts)
            .map(([title, data]) => ({ title, count: data.count, isQada: data.isQada }))
            .sort((a, b) => b.count - a.count);

        setSelectedDay({
            date: dateStr,
            count,
            categories: sortedCategories
        });
    };

    // --- Data Grouping Logic ---

    // Generate Array of Dates [Oldest ... Newest]
    const allCells = useMemo(() => {
        const arr = [];
        const today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            arr.push(d);
        }
        return arr;
    }, [daysCount]);

    // Group dates by Month if viewing 90 days (3 months)
    const monthGroups = useMemo(() => {
        if (daysCount < 90) return null;

        const groups: { [key: string]: Date[] } = {};
        allCells.forEach(date => {
            const monthKey = date.toLocaleString('ar-SA', { month: 'long', year: 'numeric' });
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(date);
        });
        
        // Return array of groups. Order: Oldest Month -> Newest Month.
        return Object.entries(groups).map(([name, dates]) => ({ name, dates }));
    }, [allCells, daysCount]);

    // Helper component for a single grid block
    const HeatmapGridBlock = ({ dates, label }: { dates: Date[], label?: string }) => {
        const startDay = dates.length > 0 ? dates[0].getDay() : 0;
        const paddingArray = Array(startDay).fill(null);

        return (
            <div className="flex flex-col gap-2">
                {label && <span className="text-xs font-bold text-gray-400 dark:text-gray-500 text-center">{label}</span>}
                <div className="grid grid-rows-7 grid-flow-col gap-1.5 auto-cols-max">
                    {paddingArray.map((_, i) => (
                        <div key={`pad-${i}`} className="w-3 h-3 md:w-4 md:h-4 bg-transparent" />
                    ))}
                    {dates.map((date) => {
                        const key = date.toISOString().split('T')[0];
                        const count = getCountForDate(date);
                        return (
                            <button 
                                key={key}
                                onMouseEnter={(e) => handleMouseEnter(e, date)}
                                onMouseLeave={() => setTooltip(null)}
                                onClick={() => handleDayClick(date)}
                                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${getColor(count)} transition-all hover:scale-125 hover:ring-2 hover:ring-gray-400 focus:outline-none`}
                                aria-label={`${count} ذكر في ${key}`}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full overflow-x-auto pb-4">
            <div className="flex justify-center gap-8 min-w-max px-4">
                
                {monthGroups ? (
                    // 3-Block View
                    monthGroups.map((group) => (
                        <HeatmapGridBlock key={group.name} dates={group.dates} label={group.name} />
                    ))
                ) : (
                    // Single Grid View (7 or 30 days)
                    <HeatmapGridBlock dates={allCells} />
                )}

            </div>
            
            {/* Tooltip */}
            {tooltip && (
                <div 
                    className="fixed z-50 px-3 py-1.5 bg-gray-900/90 backdrop-blur text-white text-xs rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full border border-gray-700 whitespace-nowrap"
                    style={{ left: tooltip.x, top: tooltip.y - 8 }}
                >
                     <div className="text-center">
                        <span className="font-bold ml-1">{tooltip.count}</span>
                        <span>ذكر - {tooltip.date}</span>
                     </div>
                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900/90"></div>
                </div>
            )}

            {/* Modal */}
            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedDay(null)}>
                    <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-popIn border border-gray-100 dark:border-dark-border" onClick={e => e.stopPropagation()}>
                        <div className={`p-6 text-white text-center relative bg-gradient-to-r ${
                            theme === 'blue' ? 'from-blue-500 to-blue-600' :
                            theme === 'flame' ? 'from-orange-500 to-red-600' :
                            'from-emerald-500 to-emerald-600'
                        }`}>
                            <button 
                                onClick={() => setSelectedDay(null)}
                                className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <Calendar size={32} className="mx-auto mb-2 opacity-80" />
                            <h3 className="text-xl font-bold font-serif">{selectedDay.date}</h3>
                            <div className="mt-2 inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                                إجمالي {selectedDay.count} ذكر
                            </div>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-100 dark:border-dark-border pb-2">تفاصيل</h4>
                            <div className="space-y-3">
                                {selectedDay.categories.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
                                        <span className={`font-medium ${cat.isQada ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {cat.title}
                                        </span>
                                        <span className={`font-mono font-bold text-lg ${
                                            theme === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                            theme === 'flame' ? 'text-red-600 dark:text-red-400' :
                                            'text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                            {cat.count}
                                        </span>
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

export default Stats;