
import React, { useState, useEffect } from 'react';
import { AZKAR_DATA } from '../data';
import DhikrCard from '../components/DhikrCard';
import * as storage from '../services/storage';
import { HeartOff } from 'lucide-react';

const Favorites: React.FC = () => {
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

  const favoriteItems = AZKAR_DATA.filter(item => favorites.includes(item.id));

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">المفضلة</h2>
        <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full text-sm font-bold">
          {favorites.length}
        </span>
      </div>

      {favoriteItems.length > 0 ? (
        <div className="space-y-4 md:space-y-6">
          {favoriteItems.map(item => (
            <DhikrCard
              key={item.id}
              item={item}
              isFavorite={true}
              initialCount={progress[item.id] || 0}
              onToggleFavorite={handleToggleFavorite}
              readonly={true}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
          <HeartOff size={64} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">لا توجد أذكار في المفضلة بعد</p>
          <p className="text-sm opacity-70 mt-2">اضغط على رمز القلب لإضافة الأذكار هنا</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
