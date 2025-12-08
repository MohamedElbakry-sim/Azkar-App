
import React, { useState, useMemo, useEffect } from 'react';
import { NAMES_OF_ALLAH } from '../data';
import { Search, X } from 'lucide-react';
import { normalizeArabic } from '../utils';
import { AllahIcon } from '../components/Layout';

const NamesOfAllah: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) return NAMES_OF_ALLAH;

    const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());

    return NAMES_OF_ALLAH.filter(name => {
      const normArabic = normalizeArabic(name.arabic);
      const normMeaning = normalizeArabic(name.meaning);
      const normTranslit = name.transliteration.toLowerCase();

      return normArabic.includes(normalizedQuery) || 
             normTranslit.includes(normalizedQuery) ||
             normMeaning.includes(normalizedQuery);
    });
  }, [searchQuery]);

  // Warn user before leaving if they have an active search
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (searchQuery.trim().length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="text-center py-6 md:py-10">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-4 text-amber-600 dark:text-amber-400">
           <AllahIcon size={40} />
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">أسماء الله الحسنى</h2>
        <p className="text-gray-500 dark:text-gray-400 md:text-lg max-w-2xl mx-auto">
          "وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا"
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto mb-8">
        <label htmlFor="names-search" className="sr-only">بحث في الأسماء الحسنى</label>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id="names-search"
          type="text"
          className="block w-full p-4 pr-11 text-base rounded-2xl border-none bg-white dark:bg-dark-surface shadow-sm focus:ring-2 focus:ring-amber-400 placeholder-gray-400 dark:text-white transition-shadow"
          placeholder="ابحث عن اسم، معنى، أو نطق..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
            aria-label="مسح البحث"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredNames.map((item) => (
          <div 
            key={item.id}
            className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border hover:shadow-md transition-all duration-300 hover:border-amber-200 dark:hover:border-amber-900/50 group flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 dark:bg-amber-900/10 rounded-bl-[50px] -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
            
            <div className="relative z-10 w-full">
                <span className="absolute top-0 right-0 text-xs font-mono text-gray-300 dark:text-gray-600">#{item.id}</span>
                
                <h3 className="font-serif text-3xl md:text-4xl text-amber-600 dark:text-amber-400 mb-3 mt-2">{item.arabic}</h3>
                
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{item.transliteration}</p>
                
                <div className="w-8 h-0.5 bg-gray-100 dark:bg-gray-700 mx-auto mb-3"></div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-loose">
                    {item.meaning}
                </p>
            </div>
          </div>
        ))}
      </div>

      {filteredNames.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center animate-fadeIn">
              <div className="p-4 bg-gray-100 dark:bg-dark-surface rounded-full mb-4">
                  <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد نتائج مطابقة لـ "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                مسح البحث
              </button>
          </div>
      )}
    </div>
  );
};

export default NamesOfAllah;
