
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AZKAR_DATA, CATEGORIES } from '../data';
import DhikrCard from '../components/DhikrCard';
import * as storage from '../services/storage';
import { CheckCircle, Home, BarChart3 } from 'lucide-react';

const CategoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === id);
  
  const [favorites, setFavorites] = useState<number[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});
  const [customTargets, setCustomTargets] = useState<{[key: number]: number}>(() => storage.getCustomTargets());
  
  // Track IDs that are "visible"
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get raw items immediately to determine skeleton count
  const items = AZKAR_DATA.filter(item => item.category === id);

  useEffect(() => {
    setIsLoading(true);
    setFavorites(storage.getFavorites());
    const allProgress = storage.getProgress();
    const today = storage.getTodayKey();
    const todayProgress = allProgress[today] || {};
    setProgress(todayProgress);
    
    // We update customTargets from storage here too in case it changed elsewhere
    const savedTargets = storage.getCustomTargets();
    setCustomTargets(savedTargets);

    // Initial Filter: Only show items not yet completed and not skipped
    if (id) {
        const incompleteIds = items
            .filter(item => {
                const count = todayProgress[item.id];
                if (count === -1) return false; // Hide skipped items
                const target = savedTargets[item.id] || item.count;
                return (count || 0) < target;
            })
            .map(i => i.id);
        
        setVisibleIds(incompleteIds);
    }
    // Simulate a slight network/processing delay for smoother skeleton transition
    setTimeout(() => setIsLoading(false), 300);
  }, [id]);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  const handleComplete = (dhikrId: number) => {
    // This is called after the animation finishes
    setVisibleIds(prev => prev.filter(id => id !== dhikrId));
  };

  const handleTargetChange = (dhikrId: number, newTarget: number) => {
    storage.saveCustomTarget(dhikrId, newTarget);
    setCustomTargets(prev => ({ ...prev, [dhikrId]: newTarget }));
  };

  if (!category) {
    return <Navigate to="/" />;
  }

  const totalCount = items.length;
  const remainingCount = visibleIds.length;
  const completedToday = totalCount - remainingCount;
  
  const percentage = totalCount > 0 ? (completedToday / totalCount) * 100 : 0;
  
  // Calculate Stats for Success Screen
  const totalRepetitions = items.reduce((acc, item) => acc + (customTargets[item.id] || item.count), 0);

  // Determine color based on progress
  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]';
    if (pct > 66) return 'bg-green-500';
    if (pct > 33) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  // Helper to generate dynamic background classes based on theme
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'orange': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'indigo': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'slate': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'yellow': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'emerald': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const themeClasses = getThemeClasses(category.theme);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Category Header */}
      <div className={`rounded-3xl p-8 text-center mb-8 shadow-sm ${themeClasses} animate-fadeIn relative overflow-hidden`}>
        <h2 className="text-3xl font-bold mb-2 opacity-90">{category.title}</h2>
        <div className="flex justify-center items-center gap-2 text-base font-medium opacity-80">
           {remainingCount === 0 ? (
               <span className="flex items-center gap-2 font-bold animate-slideUp">
                   <CheckCircle size={20} />
                   تم إكمال جميع الأذكار!
               </span>
           ) : (
               <span>متبقي {remainingCount} من {totalCount}</span>
           )}
        </div>
        
        {/* Enhanced Progress Bar */}
        <div 
          className="mt-6 h-3 bg-white/40 dark:bg-black/20 rounded-full overflow-hidden w-4/5 md:w-2/3 mx-auto backdrop-blur-sm shadow-inner"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="نسبة الإنجاز"
        >
          <div 
            className={`h-full transition-all duration-700 ease-out relative ${getProgressColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          >
             {/* Shine effect */}
             <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-l from-white/30 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6 min-h-[50vh]">
        {isLoading ? (
            // Skeleton Loader Loop
            <div className="space-y-6">
                {items.map((_, idx) => (
                    <div key={idx} className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm animate-pulse">
                        {/* Header Skeleton */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                            <div className="w-16 h-6 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        {/* Body Skeleton */}
                        <div className="space-y-4 mb-6 px-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mx-auto"></div>
                        </div>
                        {/* Footer Skeleton */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-dark-border mt-4">
                            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
          <>
            {items
            .filter(item => visibleIds.includes(item.id))
            .map((item, index) => (
                <div 
                key={item.id} 
                className="animate-slideUp opacity-0 fill-mode-forwards"
                style={{ animationDelay: `${index * 80}ms` }}
                >
                <DhikrCard
                    item={item}
                    isFavorite={favorites.includes(item.id)}
                    initialCount={progress[item.id] || 0}
                    targetCount={customTargets[item.id] || item.count}
                    onToggleFavorite={handleToggleFavorite}
                    onComplete={handleComplete}
                    onTargetChange={handleTargetChange}
                />
                </div>
            ))}

            {!isLoading && visibleIds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center animate-slideUp">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400 shadow-sm animate-popIn">
                    <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">فتح الله عليك</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">لقد أنهيت {category.title} لهذا اليوم</p>
                
                {/* Stats Card */}
                <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-6 w-full max-w-sm mb-8 border border-gray-100 dark:border-dark-border shadow-sm">
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 flex items-center justify-center gap-2">
                        <BarChart3 size={16} />
                        ملخص الإنجاز
                    </h4>
                    <div className="flex items-center justify-around divide-x divide-x-reverse divide-gray-200 dark:divide-gray-700">
                        <div className="flex flex-col items-center p-2">
                            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{items.length}</span>
                            <span className="text-xs text-gray-400 mt-1">عدد الأذكار</span>
                        </div>
                        <div className="flex flex-col items-center p-2">
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalRepetitions}</span>
                            <span className="text-xs text-gray-400 mt-1">مجموع التكرار</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/')}
                    className="mt-4 flex items-center justify-center gap-2 w-full max-w-sm px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Home size={18} />
                    <span>العودة للرئيسية</span>
                </button>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryView;
