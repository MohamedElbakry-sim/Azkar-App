
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, ArrowUpRight } from 'lucide-react';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import DailySahabi from '../components/DailySahabi';
import SmartAzkarSuggestion from '../components/SmartAzkarSuggestion';
import AlKahfAlert from '../components/AlKahfAlert';
import HabitQuickView from '../components/HabitQuickView';
import * as quranService from '../services/quranService';
import { QURAN_META } from '../data/quranMeta';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [lastRead, setLastRead] = useState<quranService.Bookmark | null>(null);

  useEffect(() => {
    setLastRead(quranService.getLastRead());
  }, []);

  const handleContinueReading = () => {
    if (lastRead) {
      navigate(`/quran/read/${lastRead.surahNumber}`, { state: { scrollToAyah: lastRead.ayahNumber }});
    } else {
        navigate('/quran');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      <AlKahfAlert />
      
      {/* Welcome Header */}
      <div className="flex justify-between items-end px-2 pt-4">
        <div>
            <h1 className="text-display font-bold text-gray-900 dark:text-white font-arabicHead mb-1">
            السلام عليكم
            </h1>
            <p className="text-body text-gray-500 dark:text-dark-muted font-arabic">
            طبت وطاب يومك بذكر الله
            </p>
        </div>
        
        {/* Date Badge */}
        <div className="hidden md:block bg-white dark:bg-dark-surface px-4 py-2 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm text-small font-bold text-gray-600 dark:text-gray-300">
            {new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long' }).format(new Date())}
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="space-y-6">
          {/* Smart Suggestion (Morning/Evening Azkar) */}
          <SmartAzkarSuggestion />

          {/* New Habit Quick View Widget */}
          <HabitQuickView />

          {/* Continue Reading Widget */}
          {lastRead ? (
            <div 
                onClick={handleContinueReading}
                className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-card cursor-pointer group hover:border-emerald-200 dark:hover:border-emerald-900 transition-all relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <span className="text-caption font-bold text-gray-400 uppercase tracking-wider mb-1 block">متابعة القراءة</span>
                            <h2 className="text-h2 font-bold text-gray-800 dark:text-white font-arabicHead">
                                سورة {QURAN_META[lastRead.surahNumber - 1].name}
                            </h2>
                            <p className="text-small text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                {lastRead.pageNumber ? `صفحة ${lastRead.pageNumber}` : `الآية ${lastRead.ayahNumber}`}
                            </p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <ArrowLeft size={20} className="rtl:rotate-0" />
                    </div>
                </div>
            </div>
          ) : (
             <button
                onClick={() => navigate('/quran')}
                className="w-full bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-card flex items-center justify-between group hover:border-emerald-200 dark:hover:border-emerald-900 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-dark-bg rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <BookOpen size={24} />
                    </div>
                    <div className="text-right">
                        <h2 className="text-h2 font-bold text-gray-800 dark:text-white font-arabicHead">القرآن الكريم</h2>
                        <p className="text-small text-gray-500 dark:text-dark-muted">ابدأ وردك اليومي</p>
                    </div>
                </div>
                <ArrowUpRight size={20} className="text-gray-400" />
            </button>
          )}
      </div>

      {/* Daily Content Feed */}
      <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
             <h3 className="text-h2 font-bold text-gray-900 dark:text-white px-2">قطوف اليوم</h3>
             <DailyWisdom />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <RandomNameCard />
             <DailySahabi />
          </div>
      </div>
    </div>
  );
};

export default Home;
