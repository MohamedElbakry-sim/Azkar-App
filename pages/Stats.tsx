
import React, { useEffect, useState } from 'react';
import { Flame, CheckCircle, BarChart3 } from 'lucide-react';
import * as storage from '../services/storage';

const Stats: React.FC = () => {
  const [stats, setStats] = useState<storage.StatsData | null>(null);
  const [heatmapData, setHeatmapData] = useState<{ [date: string]: number }>({});

  useEffect(() => {
    setStats(storage.getStats());
    setHeatmapData(storage.getHeatmapData());
  }, []);

  if (!stats) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">إحصائياتك</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">تابع تقدمك واستمر في الذكر</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
      </div>

      {/* Heatmap Section */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2">
            سجل الاستمرارية
            <span className="text-xs md:text-sm font-normal text-gray-400">(آخر 3 أشهر)</span>
        </h3>
        
        <ContributionGraph data={heatmapData} />
        
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

const ContributionGraph: React.FC<{ data: { [date: string]: number } }> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

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

    return (
        <div className="relative w-full">
            <div className="flex flex-wrap gap-1 md:gap-2 justify-center dir-ltr">
                {days.map((date) => {
                    const key = date.toISOString().split('T')[0];
                    const count = data[key] || 0;
                    return (
                        <div 
                            key={key}
                            onMouseEnter={(e) => handleMouseEnter(e, date, count)}
                            onMouseLeave={() => setTooltip(null)}
                            className={`w-3 h-3 md:w-5 md:h-5 rounded-sm ${getColor(count)} transition-colors hover:ring-2 ring-primary-300 cursor-pointer`}
                        />
                    );
                })}
            </div>
            
            {tooltip && (
                <div 
                    className="fixed z-50 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{ left: tooltip.x, top: tooltip.y - 8 }}
                >
                     <div className="text-center font-bold mb-0.5">{tooltip.count} ذكر</div>
                     <div className="text-gray-300 whitespace-nowrap">{tooltip.date}</div>
                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                </div>
            )}
        </div>
    );
};

export default Stats;
