
import React, { useState, useEffect, useRef } from 'react';
import { AZKAR_DATA, SITUATIONAL_DUAS } from '../data';
import DhikrCard from '../components/DhikrCard';
import * as storage from '../services/storage';
import { HeartOff, Trash2, Hand, Heart } from 'lucide-react';
import { Dhikr, CategoryId } from '../types';

// --- Swipeable Card Component ---
interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onDelete }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].clientX;
    currentX.current = x;
    const diff = currentX.current - startX.current;
    
    // Limit swipe to left direction
    if (diff < 0) {
      setOffsetX(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const diff = currentX.current - startX.current;
    
    if (diff < -120) {
      setOffsetX(-500); // Animate out
      setTimeout(() => {
        onDelete();
        setOffsetX(0); 
      }, 300);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className="relative select-none touch-pan-y">
      <div 
        className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end px-8 text-white transition-opacity duration-200"
        style={{ opacity: Math.abs(offsetX) > 20 ? 1 : 0 }}
      >
        <div className="flex items-center gap-2 font-bold">
            <span>حذف</span>
            <Trash2 size={24} />
        </div>
      </div>

      <div 
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};

const Favorites: React.FC = () => {
  // Data States
  const [favorites, setFavorites] = useState<number[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});

  useEffect(() => {
    setFavorites(storage.getFavorites());
    const allProgress = storage.getProgress();
    const today = storage.getTodayKey();
    setProgress(allProgress[today] || {});
  }, []);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  // Generate IDs for Situational Duas
  const situationalItems: Dhikr[] = SITUATIONAL_DUAS.flatMap((cat, catIdx) => 
    cat.items.map((item, itemIdx) => ({
      id: 90000 + (catIdx * 1000) + itemIdx,
      category: 'prayer' as CategoryId,
      text: item.text,
      count: 1,
      source: item.source || cat.title,
      benefit: ''
    }))
  );

  const allItems = [...AZKAR_DATA, ...situationalItems];
  const favoriteItems = allItems.filter(item => favorites.includes(item.id));

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col gap-6 mb-6">
         <div className="flex items-center gap-3">
            <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-full text-rose-500">
                <Heart size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white font-arabicHead">المفضلة</h2>
         </div>
      </div>

      {/* Content */}
      {favoriteItems.length > 0 ? (
        <div className="space-y-4 md:space-y-6">
            {favoriteItems.map(item => (
            <SwipeableCard 
                key={item.id} 
                onDelete={() => handleToggleFavorite(item.id)}
            >
                <DhikrCard
                item={item}
                isFavorite={true}
                initialCount={progress[item.id] || 0}
                onToggleFavorite={handleToggleFavorite}
                readonly={true}
                />
            </SwipeableCard>
            ))}
            
            <div className="text-center mt-8 text-gray-400 text-xs md:hidden flex items-center justify-center gap-2 opacity-60">
                <Hand size={16} />
                <span>اسحب البطاقة لليسار للحذف</span>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-dark-border border-dashed">
            <HeartOff size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 font-arabic">لا توجد أذكار في المفضلة</p>
            <p className="text-sm opacity-70 mt-2 font-arabic">اضغط على رمز القلب لإضافة الأذكار هنا</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
