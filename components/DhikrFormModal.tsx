
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dhikr, CategoryId } from '../types';
import { X, Save } from 'lucide-react';

interface DhikrFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dhikr: Partial<Dhikr>) => void;
  initialData?: Dhikr;
  categoryId: CategoryId;
}

const DhikrFormModal: React.FC<DhikrFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  categoryId 
}) => {
  const [text, setText] = useState('');
  const [count, setCount] = useState(1);
  const [source, setSource] = useState('');
  const [benefit, setBenefit] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setText(initialData.text);
        setCount(initialData.count);
        setSource(initialData.source || '');
        setBenefit(initialData.benefit || '');
      } else {
        // Reset for new item
        setText('');
        setCount(1);
        setSource('');
        setBenefit('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSave({
      id: initialData?.id, // undefined if new
      text: text.trim(),
      count: count,
      source: source.trim() || undefined,
      benefit: benefit.trim() || undefined,
      category: categoryId
    });
    onClose();
  };

  if (!isOpen) return null;

  // Use Portal to render outside of the transformed parent (Layout)
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden animate-popIn relative"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white font-serif">
            {initialData ? 'تعديل الذكر' : 'إضافة ذكر جديد'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-bg rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              نص الذكر <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none font-serif text-lg leading-loose"
              placeholder="اكتب الذكر هنا..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                العدد <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                المصدر (اختياري)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="مثال: البخاري"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              الفضل (اختياري)
            </label>
            <input
              type="text"
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              placeholder="فضل قراءة هذا الذكر..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-gray-600 dark:text-gray-300 font-bold bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 rounded-xl text-white font-bold bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              حفظ
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};

export default DhikrFormModal;
