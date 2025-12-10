
import React, { useState, useEffect } from 'react';
import { BookOpen, X, Check } from 'lucide-react';
import * as storage from '../services/storage';

const AlKahfAlert: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if today is Friday (5)
    const today = new Date();
    const isFriday = today.getDay() === 5;

    if (isFriday) {
      // Check storage if already seen today
      const hasSeen = storage.hasSeenAlKahfPrompt();
      if (!hasSeen) {
        // Show after a small delay to not block initial render
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    storage.markAlKahfPromptSeen();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-popIn border border-emerald-100 dark:border-emerald-900/30 relative">
        
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
        <div className="absolute top-4 right-4 text-white/20">
            <BookOpen size={64} />
        </div>

        <div className="relative pt-12 px-6 pb-6 text-center">
            {/* Icon Badge */}
            <div className="w-20 h-20 mx-auto bg-white dark:bg-dark-surface rounded-full flex items-center justify-center shadow-lg border-4 border-emerald-500 mb-4 relative z-10">
                <BookOpen size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 font-serif">
                جمعة مباركة
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-sm">
                عن أبي سعيد الخدري قال: قال رسول الله صلى الله عليه وسلم:<br/>
                <span className="font-serif text-emerald-700 dark:text-emerald-400 text-lg block mt-2">
                    "من قرأ سورة الكهف يوم الجمعة أضاء له من النور ما بين الجمعتين"
                </span>
            </p>

            <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:shadow-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
                <Check size={20} />
                <span>سأقرأها إن شاء الله</span>
            </button>
            
            <button 
                onClick={handleClose}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                تذكير لاحقاً
            </button>
        </div>
      </div>
    </div>
  );
};

export default AlKahfAlert;
