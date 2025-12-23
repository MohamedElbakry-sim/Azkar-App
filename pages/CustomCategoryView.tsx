
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
// FIX: Added missing BookOpen import from lucide-react
import { Plus, ArrowRight, ArrowDownUp, Check, CheckCircle, BarChart3, Home, BookOpen } from 'lucide-react';
import * as storage from '../services/storage';
import { Dhikr, CustomCategory } from '../types';
import DhikrCard from '../components/DhikrCard';
import DhikrFormModal from '../components/DhikrFormModal';

const CustomCategoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState<CustomCategory | null>(null);
  const [items, setItems] = useState<Dhikr[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});
  const [customTargets, setCustomTargets] = useState<{[key: number]: number}>(() => storage.getCustomTargets());
  
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dhikr | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  const loadData = () => {
    if (!id) return;
    
    const allCats = storage.getCustomCategories();
    const currentCat = allCats.find(c => c.id === id);
    if (!currentCat) return;
    setCategory(currentCat);

    const allDhikrs = storage.getCustomDhikrs();
    const catDhikrs = allDhikrs.filter(d => d.customCategoryId === id);
    
    // Apply Order
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
    
    const incompleteIds = catDhikrs
        .filter(item => {
            const count = todayProgress[item.id] || 0;
            const target = customTargets[item.id] || item.count;
            return count < target;
        })
        .map(i => i.id);
    
    setVisibleIds(incompleteIds);
    setIsLoading(false);
  };

  useEffect(() => {
    setFavorites(storage.getFavorites());
    loadData();
  }, [id]);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  const handleComplete = (dhikrId: number) => {
    setVisibleIds(prev => prev.filter(vId => vId !== dhikrId));
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
    <div className="space-y-6 max-w-3xl mx-auto pb-20 animate-fadeIn">
        {/* Category Header Card */}
        <div className="bg-gradient-to-br from-primary-600 to-emerald-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-primary-500/10">
            <div className="absolute top-4 left-4 flex gap-2">
                <button onClick={() => setIsReordering(!isReordering)} className={`p-2 rounded-xl backdrop-blur-md border border-white/10 transition-all ${isReordering ? 'bg-white text-primary-700' : 'bg-white/10'}`}>
                    {isReordering ? <Check size={20} /> : <ArrowDownUp size={20} />}
                </button>
                <button onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }} className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                    <Plus size={20} />
                </button>
            </div>

            <button 
                onClick={() => navigate('/custom-athkar')}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4 text-sm"
            >
                <ArrowRight size={16} className="rtl:rotate-0" />
                الرجوع للأقسام
            </button>

            <h2 className="text-3xl font-bold font-arabicHead mb-2">{category.title}</h2>
            
            {items.length > 0 ? (
                <>
                    <p className="text-primary-50 opacity-80 text-sm mb-6">
                        {visibleIds.length === 0 ? 'تم إكمال جميع الأوراد!' : `متبقي ${visibleIds.length} من ${items.length}`}
                    </p>
                    <div className="h-2.5 bg-white/20 rounded-full overflow-hidden w-full backdrop-blur-sm">
                        <div className="h-full bg-white transition-all duration-700 ease-out" style={{ width: `${percentage}%` }} />
                    </div>
                </>
            ) : (
                <p className="text-primary-50 opacity-80 text-sm italic">لا توجد أذكار مضافة بعد</p>
            )}
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
                            targetCount={customTargets[item.id] || item.count}
                            onToggleFavorite={handleToggleFavorite}
                            onComplete={handleComplete}
                            onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                            onDelete={handleDeleteDhikr}
                            reorderMode={isReordering}
                            onMoveUp={() => moveItem(item.id, 'up')}
                            onMoveDown={() => moveItem(item.id, 'down')}
                        />
                    </div>
                ))
            }

            {items.length > 0 && !isReordering && visibleIds.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-slideUp">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">تقبل الله طاعتك</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">لقد أكملت جميع الأذكار في هذا القسم</p>
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg"><Home size={18} />الرئيسية</button>
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
