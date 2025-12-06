
import React, { useState, useEffect } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import * as storage from '../services/storage';

const Tasbeeh: React.FC = () => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    setCount(storage.getTasbeehCount());
  }, []);

  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    storage.saveTasbeehCount(newCount);
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
    
    // Haptic feedback (respects DND)
    if (storage.shouldTriggerHaptics() && navigator.vibrate) {
       // Stronger vibration on milestones
       if (newCount % 33 === 0) {
         navigator.vibrate([50, 50, 50]);
       } else {
         navigator.vibrate(10);
       }
    }
  };

  const handleReset = () => {
    if (resetConfirm) {
      setCount(0);
      storage.saveTasbeehCount(0);
      setResetConfirm(false);
      // Success Haptic
      if (storage.shouldTriggerHaptics() && navigator.vibrate) navigator.vibrate(50);
    } else {
      setResetConfirm(true);
      // Warning Haptic
      if (storage.shouldTriggerHaptics() && navigator.vibrate) navigator.vibrate(20);
      
      // Auto dismiss after 3s
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center py-6 animate-fadeIn min-h-[70vh]">
      
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">المسبحة الإلكترونية</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">اضغط في أي مكان للعد</p>
      </div>

      {/* Main Counter Display */}
      <button 
        onClick={increment}
        className={`
          w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 
          shadow-[0_10px_40px_rgba(16,185,129,0.3)] dark:shadow-[0_10px_40px_rgba(16,185,129,0.15)]
          flex items-center justify-center cursor-pointer 
          border-8 border-white dark:border-gray-800 relative select-none
          transition-all duration-150 ease-out outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800
          active:scale-95 hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)]
          ${isAnimating ? 'scale-[1.02] shadow-[0_15px_50px_rgba(16,185,129,0.5)]' : 'scale-100'}
        `}
        aria-label={`تسبحة. العدد الحالي: ${count}`}
        aria-live="polite"
      >
        {/* Subtle Ripple/Ring Effect */}
        <div className={`absolute inset-0 rounded-full border-4 border-white/20 pointer-events-none transition-all duration-300 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}></div>

        <div className="text-center text-white relative z-10">
           <span className="block text-7xl md:text-8xl font-bold font-mono tracking-wider">{count}</span>
           <span className="text-primary-100 text-sm md:text-base mt-2 md:mt-4 block">تسبيحة</span>
        </div>
      </button>

      {/* Controls */}
      <div className="flex gap-4 w-full justify-center mt-12">
        <button 
          onClick={handleReset}
          className={`
            flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl 
            transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
            ${resetConfirm 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 scale-105 ring-2 ring-red-400' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-400'}
          `}
          title={resetConfirm ? "تأكيد التصفير" : "تصفير"}
          aria-label={resetConfirm ? "تأكيد تصفير العداد" : "تصفير العداد"}
        >
          {resetConfirm ? <Check size={24} className="md:w-8 md:h-8" /> : <RotateCcw size={24} className="md:w-8 md:h-8" />}
          <span className="text-xs md:text-sm mt-1 font-bold">
            {resetConfirm ? 'تأكيد' : 'تصفير'}
          </span>
        </button>
      </div>

    </div>
  );
};

export default Tasbeeh;
