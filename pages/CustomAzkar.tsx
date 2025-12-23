import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Trash2, Edit3, Sparkles, ChevronLeft, BookOpen, AlertCircle, X } from 'lucide-react';
import * as storage from '../services/storage';
import { CustomCategory, Dhikr } from '../types';

const CustomAzkar: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [dhikrs, setDhikrs] = useState<Dhikr[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const loadData = () => {
    setCategories(storage.getCustomCategories());
    setDhikrs(storage.getCustomDhikrs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCategory = () => {
    if (!newTitle.trim()) return;
    
    const cat: CustomCategory = {
      id: editingCatId || Date.now().toString(),
      title: newTitle.trim(),
      createdAt: Date.now()
    };
    
    storage.saveCustomCategory(cat);
    setNewTitle('');
    setEditingCatId(null);
    setIsModalOpen(false);
    loadData();
  };

  const handleDeleteCategory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الأذكار بداخله أيضاً.')) {
      storage.deleteCustomCategory(id);
      loadData();
    }
  };

  const handleEditCategory = (e: React.MouseEvent, cat: CustomCategory) => {
    e.stopPropagation();
    setEditingCatId(cat.id);
    setNewTitle(cat.title);
    setIsModalOpen(true);
  };

  const getItemsCount = (catId: string) => {
    return dhikrs.filter(d => d.customCategoryId === catId).length;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-arabicHead mb-2 flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
                    <Sparkles size={28} />
                </div>
                أذكار خاصة
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-arabic">
                نظم أورادك وأدعيتك الشخصية في أقسام
            </p>
        </div>
        
        <button 
            onClick={() => {
                setEditingCatId(null);
                setNewTitle('');
                setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
            <Plus size={20} />
            <span>قسم جديد</span>
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
                <div 
                    key={cat.id}
                    onClick={() => navigate(`/custom-category/${cat.id}`)}
                    className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all group cursor-pointer relative"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                            <Folder size={32} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleEditCategory(e, cat)}
                                className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl"
                            >
                                <Edit3 size={18} />
                            </button>
                            <button 
                                onClick={(e) => handleDeleteCategory(e, cat.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white font-arabicHead mb-2">
                        {cat.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-dark-bg px-3 py-1 rounded-full border border-gray-100 dark:border-dark-border">
                            {getItemsCount(cat.id)} ذكر
                        </span>
                        <ChevronLeft size={18} className="text-gray-300 group-hover:text-primary-500 group-hover:-translate-x-1 transition-all rtl:rotate-0" />
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-dark-surface rounded-[2.5rem] border border-dashed border-gray-200 dark:border-dark-border shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6 text-gray-300">
                <Folder size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">لا توجد أقسام خاصة</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8 font-arabic">
                ابدأ بإنشاء أول قسم لتنظيم أذكارك وأدعيتك المفضلة
            </p>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-primary-600 font-bold flex items-center gap-2 hover:underline"
            >
                <Plus size={18} />
                أنشئ أول قسم الآن
            </button>
        </div>
      )}

      {/* Modal for adding/editing categories */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsModalOpen(false)}>
              <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-popIn" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold font-arabicHead">{editingCatId ? 'تعديل القسم' : 'قسم جديد'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-400 mb-2 mr-1">اسم القسم</label>
                          <input 
                            autoFocus
                            type="text" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="مثلاً: أدعية الشفاء"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 outline-none font-arabicHead text-lg"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                          />
                      </div>
                      <button 
                        onClick={handleSaveCategory}
                        disabled={!newTitle.trim()}
                        className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all disabled:opacity-50"
                      >
                          حفظ القسم
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomAzkar;