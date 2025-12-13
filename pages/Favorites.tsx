
import React, { useState, useEffect, useRef } from 'react';
import { AZKAR_DATA, SITUATIONAL_DUAS } from '../data';
import { QURAN_META } from '../data/quranMeta';
import DhikrCard from '../components/DhikrCard';
import * as storage from '../services/storage';
import * as quranService from '../services/quranService';
import { HeartOff, Trash2, Hand, Bookmark as BookmarkIcon, Heart } from 'lucide-react';
import { Dhikr, CategoryId } from '../types';
import { useNavigate } from 'react-router-dom';

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
    
    // Limit swipe to left direction (negative values in LTR, but in RTL logic we want to move it 'out')
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'azkar' | 'quran'>('azkar');
  
  // Data States
  const [favorites, setFavorites] = useState<number[]>([]);
  const [quranBookmarks, setQuranBookmarks] = useState<quranService.Bookmark[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});

  useEffect(() => {
    setFavorites(storage.getFavorites());
    setQuranBookmarks(quranService.getBookmarks());
    const allProgress = storage.getProgress();
    const today = storage.getTodayKey();
    setProgress(allProgress[today] || {});
  }, []);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  const handleDeleteBookmark = (surah: number, ayah: number) => {
      const updated = quranService.removeBookmark(surah, ayah);
      setQuranBookmarks(updated);
  };

  const handleContinueReading = (bm: quranService.Bookmark) => {
      navigate(`/quran/read/${bm.surahNumber}`, { state: { scrollToAyah: bm.ayahNumber }});
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
      
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6 mb-6">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white font-arabicHead">المفضلة</h2>
         </div>

         <div className="flex bg-gray-100 dark:bg-dark-surface p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('azkar')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'azkar' ? 'bg-white dark:bg-dark-elevated text-emerald-600 shadow-sm' : 'text-gray-500'}`}
             >
                 <Heart size={18} />
                 الأذكار
                 <span className="bg-gray-100 dark:bg-dark-bg text-xs px-2 py-0.5 rounded-full ml-1 opacity-70">
                     {favoriteItems.length}
                 </span>
             </button>
             <button 
                onClick={() => setActiveTab('quran')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'quran' ? 'bg-white dark:bg-dark-elevated text-emerald-600 shadow-sm' : 'text-gray-500'}`}
             >
                 <BookmarkIcon size={18} />
                 الآيات المحفوظة
                 <span className="bg-gray-100 dark:bg-dark-bg text-xs px-2 py-0.5 rounded-full ml-1 opacity-70">
                     {quranBookmarks.length}
                 </span>
             </button>
         </div>
      </div>

      {/* Content */}
      {activeTab === 'azkar' ? (
          favoriteItems.length > 0 ? (
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
          )
      ) : (
          quranBookmarks.length > 0 ? (
            <div className="space-y-3">
                {quranBookmarks.map((bm, idx) => (
                    <SwipeableCard
                        key={`${bm.surahNumber}-${bm.ayahNumber}`}
                        onDelete={() => handleDeleteBookmark(bm.surahNumber, bm.ayahNumber)}
                    >
                        <div 
                            onClick={() => handleContinueReading(bm)}
                            className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-100 dark:border-dark-border flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <BookmarkIcon size={24} />
                                </div>
                                <div>
                                    <span className="font-bold text-gray-800 dark:text-white font-arabicHead text-lg block">
                                        سورة {QURAN_META[bm.surahNumber - 1].name}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        الآية {bm.ayahNumber} {bm.pageNumber && `• صفحة ${bm.pageNumber}`}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteBookmark(bm.surahNumber, bm.ayahNumber); }}
                                className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </SwipeableCard>
                ))}
                
                <div className="text-center mt-8 text-gray-400 text-xs md:hidden flex items-center justify-center gap-2 opacity-60">
                    <Hand size={16} />
                    <span>اسحب البطاقة لليسار للحذف</span>
                </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-dark-border border-dashed">
              <BookmarkIcon size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400 font-arabic">لا توجد آيات محفوظة</p>
              <p className="text-sm opacity-70 mt-2 font-arabic">استخدم زر الحفظ (القلب) أثناء القراءة لحفظ الآيات هنا</p>
            </div>
          )
      )}
    </div>
  );
};

export default Favorites;
