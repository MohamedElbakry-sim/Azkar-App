
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAMES_OF_ALLAH } from '../data';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { NameOfAllah } from '../types';

const RandomNameCard: React.FC = () => {
  const navigate = useNavigate();
  const [randomName, setRandomName] = useState<NameOfAllah | null>(null);

  useEffect(() => {
    // Select a random name on component mount
    const randomIndex = Math.floor(Math.random() * NAMES_OF_ALLAH.length);
    setRandomName(NAMES_OF_ALLAH[randomIndex]);
  }, []);

  if (!randomName) return null;

  return (
    <div 
      onClick={() => navigate('/names')}
      className="group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-dark-surface border border-amber-100/50 dark:border-amber-900/20 shadow-soft hover:shadow-xl hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-500 cursor-pointer isolate"
    >
      {/* 1. Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/5 dark:to-orange-900/5 z-0" />
      
      {/* 2. Geometric Motif - Removed AllahIcon as requested */}

      {/* 3. Decorative Top Right Corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/40 dark:from-amber-900/20 to-transparent rounded-bl-[100px] -mr-8 -mt-8 z-0" />

      {/* 4. Content Container */}
      <div className="relative z-10 p-8 flex flex-col items-center text-center">
        
        {/* Modern Badge */}
        <div className="flex items-center gap-2 mb-8 px-4 py-1.5 bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm shadow-sm transition-transform group-hover:scale-105">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] font-arabicHead">أسماء الله الحسنى</span>
        </div>

        {/* Main Name Display */}
        <div className="relative mb-6">
            {/* Soft Glow behind name */}
            <div className="absolute inset-0 bg-amber-400/10 blur-2xl rounded-full scale-150 animate-pulse" />
            
            <h3 className="text-5xl md:text-6xl font-arabicHead font-black text-amber-600 dark:text-amber-400 drop-shadow-[0_2px_10px_rgba(217,119,6,0.1)] transition-transform group-hover:scale-110 duration-500">
                {randomName.arabic}
            </h3>
        </div>
        
        {/* Transliteration with refined style */}
        <div className="space-y-1 mb-6">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em] font-english">
                {randomName.transliteration}
            </p>
            <div className="h-0.5 w-8 bg-amber-200 dark:bg-amber-800 mx-auto rounded-full opacity-50" />
        </div>

        {/* Meaning with better readability */}
        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed font-arabic max-w-[280px]">
            {randomName.meaning}
        </p>
        
        {/* Interactive Footer Hint */}
        <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-amber-500/60 dark:text-amber-400/40 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors uppercase tracking-widest">
            <span>تصفح جميع الأسماء</span>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-full transition-all group-hover:translate-x-[-4px] group-hover:bg-amber-100 dark:group-hover:bg-amber-800/40">
                <ChevronLeft size={12} className="rtl:rotate-0" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default RandomNameCard;
