
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Plus, ArrowRight, ArrowDownUp, Check, CheckCircle, Home, BookOpen, Pin, Type } from 'lucide-react';
import * as storage from '../services/storage';
import { Dhikr, CustomCategory } from '../types';
import DhikrCard from '../components/DhikrCard';
import DhikrFormModal from '../components/DhikrFormModal';
import { toArabicNumerals } from '../utils';

const CustomCategoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState<CustomCategory | null>(null);
  const [items, setItems] = useState<Dhikr[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});
  
  // FIX: Added customTargets state to fix "Cannot find name 'customTargets'" error during render
  const [customTargets, setCustomTargets] = useState<{[key: number]: number}>({});
  
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dhikr | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [pinnedState, setPinnedState] = useState(false);

  // Font Size Control State
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');
  const [showFontControls, setShowFontControls] = useState(false);

  const loadData = () => {
    if (!id) return;
    
    const allCats = storage.getCustomCategories();
    const currentCat = allCats.find(c => c.id === id);
    if (!currentCat) return;
    setCategory(currentCat);

    // Track as recent
    storage.addRecentView({
        id: `custom-azkar-${currentCat.id}`,
        type: 'azkar',
        title: currentCat.title,
        subtitle: 'قسم خاص',
        path: `/custom-category/${currentCat.id}`
    });
    setPinnedState(storage.isPinned(`custom-azkar-${currentCat.id}`));

    const allDhikrs = storage.getCustomDhikrs();
    const catDhikrs = allDhikrs.filter(d => d.customCategoryId === id);
    
    const savedOrder = storage.getDhikrOrder(`custom_${id}`);
    if (savedOrder.length > 0) {
        catDhikrs.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            return 0;
        });
    }
    
    setItems(catDhikrs);
    const today = storage.getTodayKey();
    const todayProgress = storage.getProgress()[today] || {};
    setProgress(todayProgress);
    
    // FIX: Updating customTargets state from storage
    const currentTargets = storage.getCustomTargets();
    setCustomTargets(currentTargets);

    const incompleteIds = catDhikrs
        .filter(item => {
            const count = todayProgress[item.id] || 0;
            const target = currentTargets[item.id] || item.count;
            return count < target;
        })
        .map(i => i.id);
    
    setVisibleIds(incompleteIds);
    setIsLoading(false);
  };

  useEffect(() => {
    setFavorites(storage.getFavorites());
    setFontSize(storage.getFontSize());
    loadData();
  }, [id]);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  const handleFontSizeChange = (size: storage.FontSize) => {
    setFontSize(size);
    storage.saveFontSize(size);
    setShowFontControls(false);
  };

  const handleComplete = (dhikrId: number) => {
    setVisibleIds(prev => prev.filter(vId => vId !== dhikrId));
  };

  const handlePin = () => {
      if (!category) return;
      storage.togglePin({
          id: `custom-azkar-${category.id}`,
          type: 'custom_azkar',
          title: category.title,
          path: `/custom-category/${category.id}`
      });
      setPinnedState(storage.isPinned(`custom-azkar-${category.id}`));
  };

  const handleSaveDhikr = (dhikrData: Partial<Dhikr>) => {
    const newDhikr: Dhikr = {
        ...dhikrData,
        id: dhikrData.id || Date.now(),
        category: 'custom',
        customCategoryId: id
    } as Dhikr;
    
    storage.saveCustomDhikr(newDhikr);
    loadData();
  };

  const handleDeleteDhikr = (dhikrId: number) => {
    if (confirm('حذف هذا الذكر؟')) {
        storage.deleteCustomDhikr(dhikrId);
        loadData();
    }
  };

  const moveItem = (itemId: number, direction: 'up' | 'down') => {
      const currentIndex = items.findIndex(i => i.id === itemId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex >= 0 && newIndex < items.length) {
          const newItems = [...items];
          [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];
          setItems(newItems);
          storage.saveDhikrOrder(`custom_${id}`, newItems.map(i => i.id));
      }
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!category) return <Navigate to="/custom-athkar" />;

  const completedCount = items.length - visibleIds.length;
  const percentage = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20 animate-fadeIn px-2 md:px-0">
        {/* Category Header Card */}
        <div className="bg-gradient-to-br from-primary-600 to-emerald-800 rounded-[2.5rem] text-white relative shadow-xl border border-white/10">
            
            {/* Background Layers (Pattern and Progress) */}
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                    <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                </div>
            </div>

            {/* Content (Overflow Visible for Dropdown) */}
            <div className="relative z-10 p-6 md:p-10 overflow-visible">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4 mb-8 overflow-visible">
                    <div className="flex gap-2 overflow-visible">
                        <button 
                            onClick={() => navigate('/custom-athkar')}
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all active:scale-95"
                        >
                            <ArrowRight size={20} className="rtl:rotate-0" />
                        </button>
                        
                        <div className="relative overflow-visible">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowFontControls(!showFontControls); }} 
                                className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 transition-all ${showFontControls ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                <Type size={20} />
                            </button>
                            {showFontControls && (
                                <div className="absolute top-full right-0 mt-3 bg-white dark:bg-dark-surface p-2 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border min-w-[150px] animate-popIn z-[100] flex flex-col gap-1 ring-1 ring-black/5">
                                    {(['small', 'medium', 'large', 'xlarge'] as storage.FontSize[]).map((size) => (
                                        <button 
                                            key={size} 
                                            onClick={(e) => { e.stopPropagation(); handleFontSizeChange(size); }} 
                                            className={`px-4 py-2.5 text-xs font-bold rounded-xl text-right transition-colors ${fontSize === size ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                        >
                                            {({ small: 'صغير', medium: 'متوسط', large: 'كبير', xlarge: 'ضخم' } as any)[size]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePin()} 
                            className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 transition-all ${pinnedState ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                            <Pin size={20} className={pinnedState ? 'rotate-0' : 'rotate-45'} fill={pinnedState ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                            onClick={() => setIsReordering(!isReordering)} 
                            className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 transition-all ${isReordering ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                            {isReordering ? <Check size={20} /> : <ArrowDownUp size={20} />}
                        </button>
                        <button 
                            onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }} 
                            className="p-2.5 rounded-xl bg-white text-gray-900 shadow-lg active:scale-95"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative text-center md:text-right">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl md:text-3xl font-black font-arabicHead mb-1 tracking-tight">{category.title}</h1>
                        <p className="text-white/70 text-xs font-arabic">أذكار مخصصة</p>
                    </div>
                    
                    {/* Centered Remaining Label */}
                    <div className="absolute bottom-[-16px] left-0 right-0 flex justify-center items-center pointer-events-none">
                        <span className="text-[11px] font-bold font-arabic opacity-95 tracking-wide bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                            {visibleIds.length === 0 ? 'مكتمل' : `متبقي ${toArabicNumerals(visibleIds.length)} من ${toArabicNumerals(items.length)}`}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Dhikr List */}
        <div className="space-y-6 min-h-[40vh]">
            {items
                .filter(item => isReordering || visibleIds.includes(item.id))
                .map((item, idx) => (
                    <div key={item.id} className="animate-slideUp" style={{ animationDelay: `${idx * 100}ms` }}>
                        <DhikrCard 
                            item={item}
                            isFavorite={favorites.includes(item.id)}
                            initialCount={progress[item.id] || 0}
                            // FIX: Successfully using customTargets from state
                            targetCount={customTargets[item.id] || item.count}
                            onToggleFavorite={handleToggleFavorite}
                            onComplete={handleComplete}
                            onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                            onDelete={handleDeleteDhikr}
                            fontSizeOverride={fontSize}
                            reorderMode={isReordering}
                            onMoveUp={() => moveItem(item.id, 'up')}
                            onMoveDown={() => moveItem(item.id, 'down')}
                        />
                    </div>
                ))
            }

            {items.length > 0 && !isReordering && visibleIds.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-slideUp bg-white dark:bg-dark-surface rounded-[2.5rem] border border-gray-100 dark:border-dark-border shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold font-arabicHead mb-2 text-gray-800 dark:text-white">تقبل الله طاعتك</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-arabic px-10">لقد أكملت جميع الأذكار في هذا القسم بنجاح.</p>
                    <button onClick={() => navigate('/')} className="px-10 py-3.5 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center gap-2"><Home size={18} />العودة للرئيسية</button>
                </div>
            )}

            {items.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <BookOpen size={64} className="mb-4" />
                    <p className="font-bold">ابدأ بإضافة أول ذكر لهذا القسم</p>
                </div>
            )}
        </div>

        <DhikrFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveDhikr} 
            initialData={editingItem} 
            categoryId="custom" 
        />
    </div>
  );
};

export default CustomCategoryView;
