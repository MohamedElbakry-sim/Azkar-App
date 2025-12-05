import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AZKAR_DATA, CATEGORIES } from '../data';
import DhikrCard from '../components/DhikrCard';
import * as storage from '../services/storage';
import { CheckCircle, Sunrise, Sunset, Moon, Sun, BookHeart } from 'lucide-react';

const CategoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const category = CATEGORIES.find(c => c.id === id);
  
  const [favorites, setFavorites] = useState<number[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});
  const [customTargets, setCustomTargets] = useState<{[key: number]: number}>(() => storage.getCustomTargets());
  
  // Track IDs that are "visible"
  const [visibleIds, setVisibleIds] = useState<number[]>([]);

  useEffect(() => {
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
        const catItems = AZKAR_DATA.filter(item => item.category === id);
        
        const incompleteIds = catItems
            .filter(item => {
                const count = todayProgress[item.id];
                if (count === -1) return false; // Hide skipped items
                const target = savedTargets[item.id] || item.count;
                return (count || 0) < target;
            })
            .map(i => i.id);
        
        setVisibleIds(incompleteIds);
    }
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

  const items = AZKAR_DATA.filter(item => item.category === id);
  const totalCount = items.length;
  const remainingCount = visibleIds.length;
  const completedToday = totalCount - remainingCount;
  
  const percentage = totalCount > 0 ? (completedToday / totalCount) * 100 : 0;

  // Determine color based on progress
  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]';
    if (pct > 66) return 'bg-green-500';
    if (pct > 33) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'sunrise': return <Sunrise size={48} strokeWidth={1.5} />;
      case 'sunset': return <Sunset size={48} strokeWidth={1.5} />;
      case 'moon': return <Moon size={48} strokeWidth={1.5} />;
      case 'sun': return <Sun size={48} strokeWidth={1.5} />;
      case 'prayer': return <BookHeart size={48} strokeWidth={1.5} />;
      default: return <Sun size={48} strokeWidth={1.5} />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Category Header */}
      <div className={`rounded-3xl p-8 text-center mb-8 shadow-sm ${category.color} animate-fadeIn`}>
        <div className="mb-4 inline-flex p-4 bg-white/30 rounded-2xl backdrop-blur-sm">
           {getIcon(category.icon)}
        </div>
        <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">{category.title}</h2>
        <div className="flex justify-center items-center gap-2 text-base font-medium opacity-90 text-gray-700 dark:text-gray-300">
           {remainingCount === 0 ? (
               <span className="flex items-center gap-2 font-bold text-green-700 dark:text-green-300 animate-slideUp">
                   <CheckCircle size={20} />
                   تم إكمال جميع الأذكار!
               </span>
           ) : (
               <span>متبقي {remainingCount} من {totalCount}</span>
           )}
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="mt-6 h-3 bg-white/40 dark:bg-black/20 rounded-full overflow-hidden w-4/5 md:w-2/3 mx-auto backdrop-blur-sm shadow-inner">
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

        {visibleIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-slideUp">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400 shadow-sm">
                <CheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">فتح الله عليك</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">لقد أنهيت أذكار هذا القسم</p>
            <button 
                onClick={() => window.history.back()}
                className="mt-8 px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-700 font-medium"
            >
                العودة للرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryView;