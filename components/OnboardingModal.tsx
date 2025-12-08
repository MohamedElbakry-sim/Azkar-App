
import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Activity, BarChart2, ChevronRight, Check } from 'lucide-react';
import * as storage from '../services/storage';

const OnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!storage.hasSeenTutorial()) {
      // Small delay to ensure smooth entrance after app loads
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    storage.markTutorialAsSeen();
  };

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const steps = [
    {
      title: "مرحباً بك في نور",
      description: "رفيقك اليومي للحفاظ على الأذكار وتتبع إنجازك الروحاني بسهولة وخصوصية تامة.",
      icon: <Sparkles size={48} className="text-primary-500" />,
    },
    {
      title: "أذكار متنوعة",
      description: "تصفح أذكار الصباح والمساء، النوم، والاستيقاظ. يتم تنظيمها بشكل يسهل عليك القراءة والمتابعة.",
      icon: <BookOpen size={48} className="text-blue-500" />,
    },
    {
      title: "المسبحة الإلكترونية",
      description: "سبحة ذكية مع ردود فعل اهتزازية لتشعر بكل تسبيحة، مع إمكانية حفظ العدد تلقائياً.",
      icon: <Activity size={48} className="text-orange-500" />,
    },
    {
      title: "تابع إنجازك",
      description: "راقب استمراريتك من خلال الرسوم البيانية والإحصائيات المفصلة لتحفيز نفسك على المزيد.",
      icon: <BarChart2 size={48} className="text-purple-500" />,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative overflow-hidden animate-popIn border border-white/10">
        
        {/* Top Graphics */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 dark:bg-primary-900/20 rounded-bl-[100px] -mr-8 -mt-8 z-0"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-tr-[100px] -ml-8 -mb-8 z-0"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* Icon Container */}
          <div className="w-24 h-24 mb-6 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border flex items-center justify-center shadow-sm transition-all duration-500 transform">
            {steps[step].icon}
          </div>

          {/* Text Content */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 transition-all duration-300">
            {steps[step].title}
          </h2>
          <p className="text-gray-500 dark:text-gray-300 leading-relaxed mb-8 h-20 transition-all duration-300">
            {steps[step].description}
          </p>

          {/* Dots Indicator */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${idx === step ? 'w-8 bg-primary-500' : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
            >
              تخطي
            </button>
            <button
              onClick={nextStep}
              className="flex-[2] py-3 px-4 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
            >
              {step === steps.length - 1 ? (
                <>
                  <span>بدء الاستخدام</span>
                  <Check size={18} />
                </>
              ) : (
                <>
                  <span>التالي</span>
                  <ChevronRight size={18} className="rotate-180" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
