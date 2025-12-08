
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAMES_OF_ALLAH } from '../data';
import { Sparkles } from 'lucide-react';
import { NameOfAllah } from '../types';

const RandomNameCard: React.FC = () => {
  const navigate = useNavigate();
  const [randomName, setRandomName] = useState<NameOfAllah | null>(null);

  useEffect(() => {
    // Select a random name on component mount (refresh)
    const randomIndex = Math.floor(Math.random() * NAMES_OF_ALLAH.length);
    setRandomName(NAMES_OF_ALLAH[randomIndex]);
  }, []);

  if (!randomName) return null;

  return (
    <div 
      onClick={() => navigate('/names')}
      className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-amber-100 dark:border-amber-900/30 cursor-pointer group hover:shadow-md transition-all duration-300 relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-50 dark:bg-amber-900/10 rounded-tr-full -ml-4 -mb-4 transition-transform group-hover:scale-110"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-1.5 rounded-full">
            <Sparkles size={18} />
            <span className="text-sm font-bold">أسماء الله الحسنى</span>
        </div>

        <h3 className="text-4xl md:text-5xl font-serif text-amber-600 dark:text-amber-400 mb-2 drop-shadow-sm">
            {randomName.arabic}
        </h3>
        
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
            {randomName.transliteration}
        </p>

        <p className="text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
            {randomName.meaning}
        </p>
        
        <div className="mt-4 text-xs text-gray-400 group-hover:text-amber-500 transition-colors flex items-center gap-1">
            <span>عرض الكل</span>
            <Sparkles size={12} />
        </div>
      </div>
    </div>
  );
};

export default RandomNameCard;
