
import React, { useEffect, useState, useMemo } from 'react';
import { Flame, CheckCircle, BarChart3, ListTodo, X, Calendar } from 'lucide-react';
import * as storage from '../services/storage';
import { AZKAR_DATA, CATEGORIES } from '../data';
import { ProgressState } from '../types';

const Stats: React.FC = () => {
  const [stats, setStats] = useState<storage.StatsData | null>(null);
  const [history, setHistory] = useState<ProgressState>({});
  const [totalMissed, setTotalMissed] = useState(0);

  useEffect(() => {
    setStats(storage.getStats());
    setHistory(storage.getHistory());
    
    // Calculate total missed prayers
    const missed = storage.getMissedPrayers();
    const missedSum = Object.values(missed).reduce((a, b) => a + b, 0);
    setTotalMissed(missedSum);
  }, []);

  // Derive simple heatmap data (date -> total count) for the graph visuals using History
  const heatmapData = useMemo(() => {
    const data: { [date: string]: number } = {};
    Object.keys(history).forEach(date => {
      const dayData = history[date];
      const values = Object.values(dayData) as number[];
      const total = values.reduce((a, b) => (b > 0 ? a + b : a), 0);
      if (total > 0) {
        data[date] = total;
      }
    });
    return data;
  }, [history]);

  if (!stats) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">إحصائياتك</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">تابع تقدمك واستمر في الذكر</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Streak */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700 flex flex-col items-center justify-center transition-transform hover:scale-105">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 md:p-4 rounded-full text-orange-600 dark:text-orange-400 mb-3">
                <Flame size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{stats.currentStreak}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">أيام متتالية</span>
        </div>

        {/* Weekly */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700 flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-blue-100 dark:bg-blue-900/30 p-3 md:p-4 rounded-full text-blue-600 dark:text-blue-400 mb-3">
                <BarChart3 size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{stats.weeklyCount}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">ذكر هذا الأسبوع</span>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700 flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-purple-100 dark:bg-purple-900/30 p-3 md:p-4 rounded-full text-purple-600 dark:text-purple-400 mb-3">
                <CheckCircle size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{stats.todayCount}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">ذكر اليوم</span>
        </div>

        {/* Missed Prayers (Qada) */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-red-100 dark:border-gray-700 flex flex-col items-center justify-center transition-transform hover:scale-105">
             <div className="bg-red-100 dark:bg-red-900/30 p-3 md:p-4 rounded-full text-red-600 dark:text-red-400 mb-3">
                <ListTodo size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{totalMissed}</span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">صلاة فائتة</span>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2">
            سجل الاستمرارية
            <span className="text-xs md:text-sm font-normal text-gray-400">(آخر 3 أشهر)</span>
        </h3>
        
        <ContributionGraph data={heatmapData} history={history} />
        
        <div className="flex items-center justify-end gap-2 mt-6 text-xs text-gray-400">
            <span>أقل</span>
            <div className="flex gap-1">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-gray-100 dark:bg-gray-700"></div>
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-primary-200"></div>
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-primary-400"></div>
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-primary-600"></div>
            </div>
            <span>أكثر</span>
        </div>
      </div>
    </div>
  );
};

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

const ContributionGraph: React.FC<{ data: { [date: string]: number }, history: ProgressState }> = ({ data, history }) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [selectedDay, setSelectedDay] = useState<DetailModalData | null>(null);

    // Generate last 90 days for mobile friendliness
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days.push(d);
    }

    const getColor = (count: number) => {
        if (!count) return 'bg-gray-100 dark:bg-gray-700';
        if (count < 5) return 'bg-primary-200 dark:bg-primary-900/40';
        if (count < 15) return 'bg-primary-300 dark:bg-primary-700/60';
        if (count < 30) return 'bg-primary-400 dark:bg-primary-600';
        return 'bg-primary-500 dark:bg-primary-500';
    };

    const handleMouseEnter = (e: React.MouseEvent, date: Date, count: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dateStr = new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top,
            date: dateStr,
            count
        });
    };

    const handleDayClick = (date: Date, count: number) => {
        if (count === 0) return;

        const dateKey = date.toISOString().split('T')[0];
        const dateStr = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        
        // Calculate Details Breakdown
        const dayData = history[dateKey] || {};
        const catCounts: { [key: string]: { count: number, isQada: boolean } } = {};
        
        Object.entries(dayData).forEach(([dhikrIdStr, val]) => {
            const value = val as number;
            const dhikrId = parseInt(dhikrIdStr);
            if (value <= 0) return;
            
            // Check for Qada ID (9999)
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

    return (
        <div className="relative w-full">
            <div className="flex flex-wrap gap-1 md:gap-2 justify-center dir-ltr">
                {days.map((date) => {
                    const key = date.toISOString().split('T')[0];
                    const count = data[key] || 0;
                    return (
                        <button 
                            key={key}
                            onMouseEnter={(e) => handleMouseEnter(e, date, count)}
                            onMouseLeave={() => setTooltip(null)}
                            onClick={() => handleDayClick(date, count)}
                            className={`w-3 h-3 md:w-5 md:h-5 rounded-sm ${getColor(count)} transition-all hover:scale-125 hover:ring-2 ring-primary-300 focus:outline-none`}
                            aria-label={`${count} ذكر في ${key}`}
                        />
                    );
                })}
            </div>
            
            {/* Simple Hover Tooltip */}
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

            {/* Detailed Click Modal/Card */}
            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedDay(null)}>
                    <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-popIn border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white text-center relative">
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
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">تفاصيل الإنجاز</h4>
                            <div className="space-y-3">
                                {selectedDay.categories.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-gray-700">
                                        <span className={`font-medium ${cat.isQada ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {cat.title}
                                        </span>
                                        <span className="font-mono font-bold text-lg text-primary-600 dark:text-primary-400">
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
