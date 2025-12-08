
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AZKAR_DATA, CATEGORIES } from '../data';
import DhikrCard from '../components/DhikrCard';
import DhikrFormModal from '../components/DhikrFormModal';
import * as storage from '../services/storage';
import { CheckCircle, Home, BarChart3, Type, Plus } from 'lucide-react';
import { Dhikr, CategoryId } from '../types';

const CategoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === id);
  
  const [favorites, setFavorites] = useState<number[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});
  const [customTargets, setCustomTargets] = useState<{[key: number]: number}>(() => storage.getCustomTargets());
  
  // Data State
  const [items, setItems] = useState<Dhikr[]>([]);
  
  // Track IDs that are "visible" (not completed or skipped)
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Font Size Control State
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');
  const [showFontControls, setShowFontControls] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dhikr | undefined>(undefined);

  // Function to load and merge data
  const loadData = () => {
    if (!id) return;

    // 1. Get Defaults for this category
    const defaults = AZKAR_DATA.filter(item => item.category === id);
    
    // 2. Get Overrides
    const overrides = storage.getDhikrOverrides();
    
    // 3. Get Custom Dhikrs
    const custom = storage.getCustomDhikrs().filter(item => item.category === id);

    // 4. Get Deleted Defaults
    const deletedDefaults = storage.getDeletedDefaults();

    // 5. Merge
    // Map defaults to their overridden version if exists
    const mergedDefaults = defaults.map(item => overrides[item.id] || item);
    
    // Combine merged defaults + custom items, then filter out deleted defaults
    const allItems = [...mergedDefaults, ...custom].filter(item => !deletedDefaults.includes(item.id));
    
    setItems(allItems);
    return allItems;
  };

  useEffect(() => {
    setIsLoading(true);
    setFavorites(storage.getFavorites());
    setFontSize(storage.getFontSize());
    const allProgress = storage.getProgress();
    const today = storage.getTodayKey();
    const todayProgress = allProgress[today] || {};
    setProgress(todayProgress);
    
    const savedTargets = storage.getCustomTargets();
    setCustomTargets(savedTargets);

    const loadedItems = loadData();

    if (loadedItems && id) {
        const incompleteIds = loadedItems
            .filter(item => {
                const count = todayProgress[item.id];
                if (count === -1) return false; // Hide skipped items
                const target = savedTargets[item.id] || item.count;
                return (count || 0) < target;
            })
            .map(i => i.id);
        
        // Auto-Reset Logic
        if (incompleteIds.length === 0 && loadedItems.length > 0) {
             const resetProgressObj = { ...todayProgress };
             loadedItems.forEach(item => {
                 storage.saveProgress(item.id, 0);
                 resetProgressObj[item.id] = 0;
             });
             setProgress(resetProgressObj);
             setVisibleIds(loadedItems.map(i => i.id));
        } else {
             setVisibleIds(incompleteIds);
        }
    }
    setTimeout(() => setIsLoading(false), 300);
  }, [id]);

  const handleToggleFavorite = (dhikrId: number) => {
    const newFavs = storage.toggleFavoriteStorage(dhikrId);
    setFavorites(newFavs);
  };

  const handleComplete = (dhikrId: number) => {
    setVisibleIds(prev => prev.filter(id => id !== dhikrId));
  };

  const handleFontSizeChange = (size: storage.FontSize) => {
    setFontSize(size);
    storage.saveFontSize(size);
  };

  // --- CRUD Handlers ---

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Dhikr) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveDhikr = (dhikrData: Partial<Dhikr>) => {
    // If updating existing
    if (dhikrData.id) {
        // Check if it is a default item (ID < 10000 assume default logic or check AZKAR_DATA)
        // Simple check: if ID exists in AZKAR_DATA, it's a default item being overridden
        const isDefault = AZKAR_DATA.some(d => d.id === dhikrData.id);
        
        if (isDefault) {
            storage.saveDhikrOverride(dhikrData as Dhikr);
        } else {
            storage.saveCustomDhikr(dhikrData as Dhikr);
        }
    } else {
        // New Item
        const newDhikr: Dhikr = {
            ...dhikrData,
            id: Date.now(), // Generate ID
            category: id as CategoryId,
        } as Dhikr;
        
        storage.saveCustomDhikr(newDhikr);
        
        // Make sure it appears
        setVisibleIds(prev => [...prev, newDhikr.id]);
    }
    
    // Reload list
    loadData();
  };

  const handleDeleteDhikr = (id: number) => {
    const isDefault = AZKAR_DATA.some(d => d.id === id);
    
    if (isDefault) {
        // Mark as deleted/hidden from view
        storage.markDefaultAsDeleted(id);
        // Also clean up any overrides to keep storage clean
        storage.deleteDhikrOverride(id);
    } else {
        // Permanently delete custom item
        storage.deleteCustomDhikr(id);
    }
    
    // Remove from current view
    setVisibleIds(prev => prev.filter(vId => vId !== id));
    loadData();
  };

  if (!category) {
    return <Navigate to="/" />;
  }

  const totalCount = items.length;
  const remainingCount = visibleIds.length;
  const completedToday = totalCount - remainingCount;
  const percentage = totalCount > 0 ? (completedToday / totalCount) * 100 : 0;
  const totalRepetitions = items.reduce((acc, item) => acc + (customTargets[item.id] || item.count), 0);

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'orange': return 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'indigo': return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300';
      case 'slate': return 'bg-slate-50 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300';
      case 'yellow': return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'emerald': return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      default: return 'bg-gray-50 text-gray-800 dark:bg-dark-surface dark:text-gray-300';
    }
  };

  const themeClasses = getThemeClasses(category.theme);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Category Header */}
      <div className={`rounded-3xl p-6 md:p-8 text-center mb-8 shadow-sm border border-gray-100 dark:border-dark-border ${themeClasses} relative overflow-visible`}>
        
        {/* Font Size Toggle */}
        <div className="absolute top-4 left-4 z-20">
             <button 
               onClick={() => setShowFontControls(!showFontControls)}
               className="p-2 rounded-full bg-white/60 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 text-inherit transition-all shadow-sm backdrop-blur-sm"
               title="تغيير حجم الخط"
             >
                <Type size={20} />
             </button>
             
             {showFontControls && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-dark-surface p-2 rounded-xl shadow-xl border border-gray-100 dark:border-dark-border min-w-[150px] animate-popIn z-30 flex flex-col gap-1">
                   {(['small', 'medium', 'large', 'xlarge'] as storage.FontSize[]).map((size) => {
                        const labels: Record<string, string> = { small: 'صغير', medium: 'متوسط', large: 'كبير', xlarge: 'ضخم' };
                        return (
                            <button
                                key={size}
                                onClick={() => {
                                    handleFontSizeChange(size);
                                    setShowFontControls(false);
                                }}
                                className={`
                                    px-3 py-2 text-sm font-bold rounded-lg text-right transition-colors
                                    ${fontSize === size 
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                `}
                            >
                                {labels[size]}
                            </button>
                        );
                   })}
                </div>
             )}
        </div>

        {/* Add Button */}
        <div className="absolute top-4 right-4 z-20">
            <button
                onClick={handleAddItem}
                className="p-2 rounded-full bg-white/60 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 text-inherit transition-all shadow-sm backdrop-blur-sm flex items-center gap-1"
                title="إضافة ذكر جديد"
            >
                <Plus size={20} />
            </button>
        </div>

        <h2 className="text-3xl font-bold mb-2 opacity-90 font-serif">{category.title}</h2>
        <div className="flex justify-center items-center gap-2 text-base font-medium opacity-80">
           {remainingCount === 0 ? (
               <span className="flex items-center gap-2 font-bold animate-slideUp text-emerald-600 dark:text-emerald-400">
                   <CheckCircle size={20} />
                   تم إكمال جميع الأذكار!
               </span>
           ) : (
               <span>متبقي {remainingCount} من {totalCount}</span>
           )}
        </div>
        
        {/* Progress Bar */}
        <div 
          className="mt-6 h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden w-4/5 md:w-2/3 mx-auto backdrop-blur-sm shadow-inner"
        >
          <div 
            className="h-full transition-all duration-700 ease-out relative bg-gradient-to-r from-[#F1C40F] to-[#F39C12]"
            style={{ width: `${percentage}%` }}
          >
             <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-l from-white/30 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6 min-h-[50vh]">
        {isLoading ? (
            <div className="space-y-6">
                {items.map((_, idx) => (
                    <div key={idx} className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm animate-pulse">
                        <div className="w-16 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 mb-6"></div>
                        <div className="space-y-4 mb-6">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
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
                    onEdit={handleEditItem}
                    onDelete={handleDeleteDhikr}
                    fontSizeOverride={fontSize}
                />
                </div>
            ))}

            {!isLoading && visibleIds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center animate-slideUp">
                <div className="w-24 h-24 bg-gradient-to-br from-[#2ECC71] to-[#16A085] rounded-full flex items-center justify-center mb-6 text-white shadow-lg animate-popIn">
                    <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 font-serif">فتح الله عليك</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">لقد أنهيت {category.title} لهذا اليوم</p>
                
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
                    className="mt-4 flex items-center justify-center gap-2 w-full max-w-sm px-6 py-3 bg-gradient-to-r from-[#2ECC71] to-[#16A085] text-white rounded-xl hover:shadow-lg transition-all shadow-md font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Home size={18} />
                    <span>العودة للرئيسية</span>
                </button>
            </div>
            )}
          </>
        )}
      </div>

      {/* Edit/Add Modal */}
      <DhikrFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDhikr}
        initialData={editingItem}
        categoryId={id as CategoryId}
      />
    </div>
  );
};

export default CategoryView;
