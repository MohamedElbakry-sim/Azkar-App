
import React, { useState } from 'react';
import { NAMES_OF_ALLAH } from '../data';
import { Search, Scroll } from 'lucide-react';

const NamesOfAllah: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNames = NAMES_OF_ALLAH.filter(name => 
    name.arabic.includes(searchQuery) || 
    name.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
    name.meaning.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-10">
      <div className="text-center py-6 md:py-10">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-4 text-amber-600 dark:text-amber-400">
           <Scroll size={32} />
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">أسماء الله الحسنى</h2>
        <p className="text-gray-500 dark:text-gray-400 md:text-lg max-w-2xl mx-auto">
          "وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا"
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto mb-8">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-4 pr-11 text-base rounded-2xl border-none bg-white dark:bg-dark-surface shadow-sm focus:ring-2 focus:ring-amber-400 placeholder-gray-400 dark:text-white transition-shadow"
          placeholder="ابحث عن اسم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
                
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.meaning}
                </p>
            </div>
          </div>
        ))}
      </div>

      {filteredNames.length === 0 && (
          <div className="text-center py-12 text-gray-500">
              لا توجد نتائج مطابقة
          </div>
      )}
    </div>
  );
};

export default NamesOfAllah;
