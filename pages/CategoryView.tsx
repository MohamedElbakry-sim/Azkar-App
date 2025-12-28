import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AZKAR_DATA, CATEGORIES } from '../data';
import DhikrCard from '../components/DhikrCard';
import DhikrFormModal from '../components/DhikrFormModal';
import * as storage from '../services/storage';
import { 
  CheckCircle, Home, Type, Plus, 
  ArrowDownUp, Check, Pin, ArrowRight, Loader2
} from 'lucide-react';
import { Dhikr, CategoryId } from '../types';
import { toArabicNumerals } from '../utils';

const CategoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === id);
  
  const [favorites, setFavorites] = useState<number[]>([]);
  const [progress, setProgress] = useState<{[key: number]: number}>({});
  const [items, setItems] = useState<Dhikr[]>([]);
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pinnedState, setPinnedState] = useState(false);
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');
  const [showFontControls, setShowFontControls] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dhikr | undefined>(undefined);

  const loadData = () => {
    if (!id) return;
    const defaults = AZKAR_DATA.filter(item => item.category === id);
    const overrides = storage.getDhikrOverrides();
    const custom = storage.getCustomDhikrs().filter(item => item.category === id);
    const deletedDefaults = storage.getDeletedDefaults();
    const mergedDefaults = defaults.map(item => overrides[item.id] || item);
    const allItems = [...mergedDefaults, ...custom].filter(item => !deletedDefaults.includes(item.id));
    
    const savedOrder = storage.getDhikrOrder(id);
    if (savedOrder.length > 0) {
        allItems.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            return 0;
        });
    }
    setItems(allItems);
    return allItems;
  };

  useEffect(() => {
    if (category) {
        storage.addRecentView({ id: `azkar-${category.id}`, type: 'azkar', title: category.title, path: `/category/${category.id}` });
        setPinnedState(storage.isPinned(`azkar-${category.id}`));
    }
    
    setIsLoading(true);
    setFavorites(storage.getFavorites());
    setFontSize(storage.getFontSize());
    
    const today = storage.getTodayKey();
    const allProgress = storage.getProgress();
    const todayProgress = allProgress[today] || {};
    setProgress(todayProgress);
    
    const loadedItems = loadData();
    if (loadedItems && id) {
        const currentTargets = storage.getCustomTargets();
        const incompleteIds = loadedItems
            .filter(item => {
                const count = todayProgress[item.id];
                if (count === -1) return false; 
                const target = currentTargets[item.id] || item.count;
                return (count || 0) < target;
            })
            .map(i => i.id);
        setVisibleIds(incompleteIds);
    }
    setTimeout(() => setIsLoading(false), 300);
  }, [id, category]);

  const handleTogglePin = () => {
    if (!category) return;
    storage.togglePin({id: `azkar-${category.id}`, type: 'azkar', title: category.title, path: `/category/${category.id}`});
    setPinnedState(!pinnedState);
  };

  const handleFontSizeChange = (size: storage.FontSize) => {
    setFontSize(size);
    storage.saveFontSize(size);
    setShowFontControls(false);
  };

  const getThemeGradient = (theme: string) => {
    switch (theme) {
      case 'orange': return 'from-orange-500 to-amber-600';
      case 'indigo': return 'from-indigo-600 to-slate-800';
      case 'slate': return 'from-slate-600 to-gray-800';
      case 'yellow': return 'from-yellow-500 to-orange-600';
      case 'emerald': return 'from-emerald-600 to-teal-800';
      default: return 'from-primary-600 to-emerald-800';
    }
  };

  if (!category) return <Navigate to="/" />;

  const completedToday = items.length - visibleIds.length;
  const percentage = items.length > 0 ? (completedToday / items.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 pb-20">
      
      {/* --- Modern Header Wrapper with Overflow Visible --- */}
      <div className={`relative rounded-[2.5rem] text-white shadow-xl bg-gradient-to-br ${getThemeGradient(category.theme)}`}>
        
        {/* Background Clipping Layer (For pattern and progress line) */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
                <div 
                  className="h-full bg-white/60 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                  style={{ width: `${percentage}%` }} 
                />
            </div>
        </div>

        {/* Content Layer (Overflow Visible) */}
        <div className="relative z-10 p-5 md:p-6 pb-12 overflow-visible">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between mb-8 overflow-visible">
                <button 
                  onClick={() => navigate('/athkar')} 
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all active:scale-95"
                >
                  <ArrowRight size={20} className="rtl:rotate-0" />
                </button>
                
                <div className="flex gap-2 overflow-visible">
                    {/* Font Resize Dropdown */}
                    <div className="relative overflow-visible">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowFontControls(!showFontControls); }}
                          className={`p-2.5 rounded-xl transition-all border border-white/10 backdrop-blur-md ${showFontControls ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                          title="حجم الخط"
                        >
                          <Type size={18} />
                        </button>
                        {showFontControls && (
                            <div className="absolute top-full right-0 mt-3 bg-white dark:bg-dark-surface p-2 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border min-w-[140px] animate-popIn z-[100] flex flex-col gap-1 ring-1 ring-black/5">
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

                    <button 
                      onClick={handleTogglePin} 
                      className={`p-2.5 rounded-xl transition-all border border-white/10 backdrop-blur-md ${pinnedState ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      <Pin size={18} className={pinnedState ? 'rotate-0' : 'rotate-45'} fill={pinnedState ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={() => setIsReordering(!isReordering)} 
                      className={`p-2.5 rounded-xl transition-all border border-white/10 backdrop-blur-md ${isReordering ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      {isReordering ? <Check size={18} /> : <ArrowDownUp size={18} />}
                    </button>
                    <button 
                      onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }} 
                      className="p-2.5 rounded-xl bg-white text-gray-900 shadow-lg active:scale-95"
                    >
                      <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Title Section */}
            <div className="text-center md:text-right">
                <h1 className="text-2xl md:text-3xl font-black font-arabicHead mb-1 tracking-tight">{category.title}</h1>
                <p className="text-white/70 text-xs font-arabic line-clamp-1">{category.description}</p>
            </div>

            {/* Centered Remaining Progress Label */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center pointer-events-none">
                <span className="text-[11px] font-bold font-arabic opacity-95 tracking-wide bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                    {visibleIds.length === 0 ? 'تم الانتهاء بنجاح' : `متبقي ${toArabicNumerals(visibleIds.length)} من ${toArabicNumerals(items.length)}`}
                </span>
            </div>
        </div>
      </div>

      {/* --- Compact Items List --- */}
      <div className="space-y-3 min-h-[40vh] pb-10">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20"><Loader2 className="animate-spin" size={32} /></div>
        ) : (
          <>
            {items
            .filter(item => isReordering || visibleIds.includes(item.id))
            .map((item, index) => (
                <div key={item.id} className="animate-slideUp" style={{ animationDelay: `${index * 50}ms` }}>
                    <DhikrCard
                        item={item}
                        isFavorite={favorites.includes(item.id)}
                        initialCount={progress[item.id] || 0}
                        targetCount={storage.getCustomTargets()[item.id] || item.count}
                        onToggleFavorite={(id) => setFavorites(storage.toggleFavoriteStorage(id))}
                        onComplete={(id) => setVisibleIds(prev => prev.filter(vId => vId !== id))}
                        onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                        onDelete={(id) => { storage.markDefaultAsDeleted(id); loadData(); }}
                        onSkip={(id) => setVisibleIds(prev => prev.filter(vId => vId !== id))}
                        fontSizeOverride={fontSize}
                        reorderMode={isReordering}
                        onMoveUp={(id) => {
                             const idx = items.findIndex(i => i.id === id);
                             if (idx > 0) {
                                 const newItems = [...items];
                                 [newItems[idx], newItems[idx-1]] = [newItems[idx-1], newItems[idx]];
                                 setItems(newItems);
                                 storage.saveDhikrOrder(category.id, newItems.map(i => i.id));
                             }
                        }}
                        onMoveDown={(id) => {
                            const idx = items.findIndex(i => i.id === id);
                            if (idx < items.length - 1) {
                                const newItems = [...items];
                                [newItems[idx], newItems[idx+1]] = [newItems[idx+1], newItems[idx]];
                                setItems(newItems);
                                storage.saveDhikrOrder(category.id, newItems.map(i => i.id));
                            }
                        }}
                    />
                </div>
            ))}

            {!isLoading && !isReordering && visibleIds.length === 0 && (
                <div className="text-center py-16 animate-fadeIn bg-white dark:bg-dark-surface rounded-[2.5rem] border border-gray-100 dark:border-dark-border shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle size={48} />
                    </div>
                    <h3 className="text-2xl font-bold font-arabicHead mb-2 text-gray-800 dark:text-white">تقبل الله منك</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-arabic px-10 leading-relaxed">أتممت وردك لهذا القسم بنجاح، جعلها الله في ميزان حسناتك.</p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="px-10 py-3.5 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                    >
                      <Home size={18} />
                      <span>العودة للرئيسية</span>
                    </button>
                </div>
            )}
          </>
        )}
      </div>

      <DhikrFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(data) => { 
          if(data.id) { 
            AZKAR_DATA.some(d => d.id === data.id) ? storage.saveDhikrOverride(data as Dhikr) : storage.saveCustomDhikr(data as Dhikr); 
          } else { 
            storage.saveCustomDhikr({...data, id: Date.now(), category: id as CategoryId} as Dhikr); 
          } 
          loadData(); 
        }} 
        initialData={editingItem} 
        categoryId={id as CategoryId} 
      />
    </div>
  );
};

export default CategoryView;