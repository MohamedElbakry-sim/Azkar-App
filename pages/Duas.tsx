
import React, { useState } from 'react';
import { SITUATIONAL_DUAS } from '../data';
import { ArrowRight, Copy, Check, Share2, BookOpen } from 'lucide-react';
import { DuaCategory } from '../types';

const Duas: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<DuaCategory | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'دعاء',
          text: `${text}\n\nتطبيق ريان`,
        });
      } catch (err) {
        // Shared cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('تم نسخ الدعاء');
    }
  };

  const getThemeColor = (color: string) => {
      switch(color) {
          case 'emerald': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
          case 'indigo': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
          case 'slate': return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400';
          case 'blue': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
          case 'orange': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
          case 'rose': return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
          case 'cyan': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400';
          case 'purple': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
          default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {!selectedCategory ? (
        // --- Categories Grid View ---
        <div className="animate-fadeIn">
            <div className="text-center py-6 md:py-10">
                <div className="inline-flex items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-4 text-amber-600 dark:text-amber-400">
                    <BookOpen size={32} />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">حصن المسلم</h2>
                <p className="text-gray-500 dark:text-gray-400 md:text-lg">
                أدعية مختارة لكل أحوال المسلم في يومه وليلته
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {SITUATIONAL_DUAS.map((category) => {
                    const Icon = category.icon;
                    return (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category)}
                            className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900 transition-all group text-center flex flex-col items-center gap-4"
                        >
                            <div className={`p-4 rounded-2xl ${getThemeColor(category.color)} transition-transform group-hover:scale-110`}>
                                <Icon size={32} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 font-serif">
                                {category.title}
                            </h3>
                            <span className="text-xs text-gray-400 font-medium bg-gray-50 dark:bg-dark-bg px-2 py-1 rounded-md">
                                {category.items.length} دعاء
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
      ) : (
        // --- Single Category List View ---
        <div className="animate-slideUp">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => setSelectedCategory(null)}
                    className="p-2 rounded-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowRight size={24} />
                </button>
                <div className={`p-2 rounded-xl ${getThemeColor(selectedCategory.color)}`}>
                    <selectedCategory.icon size={24} />
                </div>
                <h2 className="text-2xl font-bold font-serif text-gray-800 dark:text-white">
                    أدعية {selectedCategory.title}
                </h2>
            </div>

            {/* List */}
            <div className="space-y-4">
                {selectedCategory.items.map((dua, index) => (
                    <div key={index} className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
                        <p className="font-serif text-2xl md:text-3xl leading-[2.5] text-gray-800 dark:text-gray-100 text-center mb-6" dir="rtl">
                            {dua.text}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                            <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-bg px-3 py-1 rounded-lg">
                                {dua.source || 'حصن المسلم'}
                            </span>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleCopy(dua.text, index)}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                                    title="نسخ"
                                >
                                    {copiedIndex === index ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                </button>
                                <button 
                                    onClick={() => handleShare(dua.text)}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                                    title="مشاركة"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Duas;
