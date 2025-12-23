import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, Settings, Vibrate, Bell, ChevronDown } from 'lucide-react';
import * as storage from '../services/storage';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const Tasbeeh: React.FC = () => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  
  // Haptic Settings
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [milestone, setMilestone] = useState(33);
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  useEffect(() => {
    setCount(storage.getTasbeehCount());
    setHapticEnabled(storage.isTasbeehHapticEnabled());
    setMilestone(storage.getTasbeehMilestone());
  }, []);

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (!hapticEnabled) return;

    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.impact({ style });
        } catch (e) {
            if (navigator.vibrate) navigator.vibrate(style === ImpactStyle.Heavy ? 100 : 10);
        }
    } else {
        if (navigator.vibrate) navigator.vibrate(style === ImpactStyle.Heavy ? 100 : 10);
    }
  };

  const triggerMilestoneHaptic = async () => {
    if (!hapticEnabled) return;

    if (Capacitor.isNativePlatform()) {
        try {
            // Notification SUCCESS usually gives a nice double pulse
            await Haptics.notification({ type: 'SUCCESS' as any }); 
        } catch (e) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
    } else {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    storage.saveTasbeehCount(newCount);
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);

    // Haptic Logic
    if (milestone > 0 && newCount % milestone === 0) {
        triggerMilestoneHaptic();
    } else {
        triggerHaptic(ImpactStyle.Light);
    }
  };

  const handleReset = () => {
    if (resetConfirm) {
      setCount(0);
      storage.saveTasbeehCount(0);
      setResetConfirm(false);
      triggerMilestoneHaptic();
    } else {
      setResetConfirm(true);
      triggerHaptic(ImpactStyle.Medium);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  const updateHapticToggle = (val: boolean) => {
      setHapticEnabled(val);
      storage.setTasbeehHapticEnabled(val);
  };

  const updateMilestone = (val: number) => {
      setMilestone(val);
      storage.setTasbeehMilestone(val);
      triggerHaptic(ImpactStyle.Heavy);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center py-6 min-h-[70vh] relative">
      
      {/* Quick Settings Trigger */}
      <div className="absolute top-0 left-0 w-full flex justify-between px-4">
          <button 
            onClick={() => setShowQuickSettings(!showQuickSettings)}
            className={`p-3 rounded-2xl transition-all border ${showQuickSettings ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-200' : 'bg-white dark:bg-dark-surface text-gray-400 border-gray-100 dark:border-dark-border'}`}
          >
              <Settings size={20} />
          </button>
          
          <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-100 dark:border-dark-border text-gray-400 text-xs font-bold flex items-center gap-2">
              <Vibrate size={14} className={hapticEnabled ? 'text-emerald-500' : ''} />
              <span>{milestone > 0 ? `تنبيه كل ${milestone}` : 'تنبيه معطل'}</span>
          </div>
      </div>

      {/* Quick Settings Drawer */}
      {showQuickSettings && (
          <div className="absolute top-16 left-4 right-4 z-40 bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-dark-border animate-slideUp">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-800 dark:text-white font-arabicHead">إعدادات الاهتزاز</h3>
                  <button onClick={() => setShowQuickSettings(false)} className="text-gray-400"><Check size={20} /></button>
              </div>

              <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-dark-border">
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-300">تفعيل الاهتزاز</span>
                      <button 
                        onClick={() => updateHapticToggle(!hapticEnabled)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${hapticEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                      >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${hapticEnabled ? 'left-[calc(100%-1.5rem)]' : 'left-1'}`} />
                      </button>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-dark-border">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-3 mr-1">نغمة الاهتزاز (كل عدد)</label>
                      <div className="grid grid-cols-4 gap-2">
                          {[33, 100, 1000, 0].map((val) => (
                              <button
                                key={val}
                                onClick={() => updateMilestone(val)}
                                className={`py-2 rounded-xl text-xs font-bold transition-all border ${milestone === val ? 'bg-primary-600 text-white border-primary-700 shadow-md' : 'bg-white dark:bg-dark-surface text-gray-500 border-gray-100 dark:border-dark-border'}`}
                              >
                                  {val === 0 ? 'معطل' : val}
                              </button>
                          ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-3 mr-1">يصدر التطبيق نبضة قوية ومزدوجة عند الوصول لهذا العدد لمساعدتك على العد دون النظر للشاشة.</p>
                  </div>
              </div>
          </div>
      )}
      
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 font-arabicHead">المسبحة الإلكترونية</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">اضغط في أي مكان للعد</p>
      </div>

      {/* Main Counter Display with Primary Gradient */}
      <button 
        onClick={increment}
        className={`
          w-64 h-64 md:w-80 md:h-80 rounded-full 
          bg-gradient-to-br from-[#2ECC71] via-[#1ABC9C] to-[#16A085]
          shadow-[0_10px_40px_rgba(26,188,156,0.4)] dark:shadow-[0_10px_40px_rgba(22,160,133,0.4)]
          flex items-center justify-center cursor-pointer 
          border-8 border-white dark:border-dark-surface relative select-none
          transition-all duration-150 ease-out outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800
          active:scale-95 hover:shadow-[0_20px_60px_rgba(26,188,156,0.5)] overflow-hidden
          ${isAnimating ? 'scale-[1.02] shadow-[0_15px_50px_rgba(26,188,156,0.6)]' : 'scale-100'}
        `}
        aria-label={`تسبحة. العدد الحالي: ${count}`}
        aria-live="polite"
      >
        {/* Subtle Islamic Pattern Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="islamic-geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="white" strokeWidth="1"/>
                        <circle cx="20" cy="20" r="3" fill="white" />
                        <path d="M0 0 L10 10 M30 30 L40 40 M0 40 L10 30 M30 10 L40 0" stroke="white" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#islamic-geo)" />
            </svg>
        </div>

        {/* Subtle Ripple/Ring Effect */}
        <div className={`absolute inset-0 rounded-full border-4 border-white/20 pointer-events-none transition-all duration-300 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}></div>

        <div className="text-center text-white relative z-10">
           <span className="block text-7xl md:text-8xl font-bold font-mono tracking-wider drop-shadow-sm">{count}</span>
           <span className="text-primary-50 text-sm md:text-base mt-2 md:mt-4 block font-medium">تسبيحة</span>
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
              ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 scale-105 ring-2 ring-red-400 border border-red-200' 
              : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-400 border border-gray-100 dark:border-dark-border'}
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