
import React, { useEffect, useState } from 'react';
import { BookOpen, Scroll, Loader2, Share2, Quote, AlertCircle } from 'lucide-react';
import { getDailyContent } from '../services/dailyContent';
import { DailyContent } from '../types';

const DailyWisdom: React.FC = () => {
  const [content, setContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDailyContent();
        setContent(data);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError(true);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleShare = async (text: string, source: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'نور - آية وحديث اليوم',
          text: `${text}\n\n${source}\n\nتطبيق نور`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${text}\n\n${source}`);
      alert('تم نسخ النص');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-primary-500" />
        <p className="text-gray-500 animate-pulse">جاري جلب نفحات اليوم...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">حدث خطأ في التحميل</h3>
        <p className="text-gray-500 mt-2">يرجى التحقق من الاتصال والمحاولة مرة أخرى</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">آية وحديث اليوم</h2>
        <p className="text-gray-500 dark:text-gray-400">تجدد إيمانك يومياً بآية من كتاب الله وحديث لنبيه</p>
      </div>

      {/* Quran Card */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative group">
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
            <div className="p-2 bg-white dark:bg-dark-surface rounded-full shadow-sm">
                <BookOpen size={24} />
            </div>
            <span className="font-bold text-lg">آية من القرآن الكريم</span>
          </div>
          <button 
            onClick={() => handleShare(content.verse.text, `سورة ${content.verse.surah} - آية ${content.verse.ayahNumber}`)}
            className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="مشاركة"
          >
            <Share2 size={20} />
          </button>
        </div>
        
        <div className="p-6 md:p-10 text-center relative">
          <Quote size={40} className="absolute top-6 right-6 text-emerald-100 dark:text-emerald-900/40 opacity-50" />
          
          <div className="mb-8 relative z-10">
            <p className="font-serif text-3xl md:text-4xl leading-[2.2] text-gray-800 dark:text-gray-100 mb-6">
              {content.verse.text}
            </p>
            <div className="inline-block px-4 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
               سورة {content.verse.surah} • آية {content.verse.ayahNumber}
            </div>
          </div>

          {content.verse.tafsir && (
            <div className="bg-gray-50 dark:bg-dark-bg/50 p-5 rounded-2xl text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed border border-gray-100 dark:border-dark-border">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-2">التفسير الميسر:</span>
              {content.verse.tafsir}
            </div>
          )}
        </div>
      </div>

      {/* Hadith Card */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-sm border border-amber-100 dark:border-amber-900/30 relative group">
        <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 flex items-center justify-between border-b border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
            <div className="p-2 bg-white dark:bg-dark-surface rounded-full shadow-sm">
                <Scroll size={24} />
            </div>
            <span className="font-bold text-lg">حديث نبوي شريف</span>
          </div>
          <button 
            onClick={() => handleShare(content.hadith.text, `${content.hadith.source} (${content.hadith.grade})`)}
            className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title="مشاركة"
          >
            <Share2 size={20} />
          </button>
        </div>

        <div className="p-6 md:p-10 text-center relative">
          <Quote size={40} className="absolute top-6 right-6 text-amber-100 dark:text-amber-900/40 opacity-50" />
          
          <div className="mb-8 relative z-10">
            <p className="font-serif text-2xl md:text-3xl leading-[2.2] text-gray-800 dark:text-gray-100 mb-6">
              "{content.hadith.text}"
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm font-bold">
                    {content.hadith.source}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold border border-green-100 dark:border-green-900/30">
                    {content.hadith.grade}
                </span>
            </div>
          </div>

          {content.hadith.explanation && (
            <div className="bg-gray-50 dark:bg-dark-bg/50 p-5 rounded-2xl text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed border border-gray-100 dark:border-dark-border">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-2">شرح مختصر:</span>
              {content.hadith.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyWisdom;
