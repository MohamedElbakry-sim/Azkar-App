import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, Scroll, Loader2, Share2, Quote, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { getDailyContent } from '../services/dailyContent';
import { DailyContent } from '../types';
import Logo from './Logo';
import ErrorState from './ErrorState';

const DailyWisdom: React.FC = () => {
  const [content, setContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Image Sharing State
  const [isSharing, setIsSharing] = useState<'verse' | 'hadith' | null>(null);
  const [shareData, setShareData] = useState<{
    type: 'verse' | 'hadith';
    text: string;
    source: string;
    subSource?: string;
  } | null>(null);
  
  // UI State for Explanation
  const [expandExplanation, setExpandExplanation] = useState(false);
  
  const shareRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getDailyContent();
      setContent(data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShareText = async (text: string, source: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ريان - آية وحديث اليوم',
          text: `${text}\n\n${source}\n\nتطبيق ريان`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${text}\n\n${source}`);
      alert('تم نسخ النص');
    }
  };

  const handleShareImage = async (type: 'verse' | 'hadith') => {
    if (!content || isSharing) return;

    if (type === 'verse') {
        setShareData({
            type: 'verse',
            text: content.verse.text,
            source: `سورة ${content.verse.surah}`,
            subSource: `الآية ${content.verse.ayahNumber}`
        });
    } else {
        setShareData({
            type: 'hadith',
            text: content.hadith.text,
            source: content.hadith.source,
            subSource: content.hadith.grade
        });
    }

    setIsSharing(type);

    setTimeout(async () => {
        try {
            if (!shareRef.current) return;
            
            const html2canvas = (window as any).html2canvas;
            if (!html2canvas) {
                alert('خطأ في تحميل مكتبة الصور');
                setIsSharing(null);
                return;
            }

            const canvas = await html2canvas(shareRef.current, {
                scale: 3, 
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });

            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) {
                     setIsSharing(null);
                     return;
                }
                
                const file = new File([blob], `rayyan-${type}.jpg`, { type: 'image/jpeg' });
                
                if (navigator.share) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: type === 'verse' ? 'آية اليوم' : 'حديث اليوم',
                        });
                    } catch (shareError) {
                        console.log('Share cancelled');
                    }
                } else {
                    const link = document.createElement('a');
                    link.download = `rayyan-${type}.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.95);
                    link.click();
                }
                setIsSharing(null);
                setShareData(null);
            }, 'image/jpeg', 0.95);

        } catch (error) {
            console.error('Image generation failed', error);
            setIsSharing(null);
            setShareData(null);
        }
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !content) {
      return (
          <div className="mb-12">
            <ErrorState 
                title="تعذر تحميل المحتوى"
                message="واجهنا مشكلة في جلب آية وحديث اليوم. يرجى التحقق من اتصالك."
                onRetry={fetchData}
            />
          </div>
      );
  }

  return (
    <div className="space-y-10 mb-12 animate-fadeIn">
      
      {/* --- Minimalist Gallery Template (Hidden) --- */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        {shareData && (
            <div 
                ref={shareRef}
                className="w-[1080px] h-[1080px] flex flex-col items-center justify-center p-20 bg-white relative"
            >
                {/* 1. Background Layer: Subtle Warm/Cool Glow */}
                <div className={`absolute inset-0 z-0 opacity-40 ${
                    shareData.type === 'verse' 
                    ? 'bg-[radial-gradient(circle_at_top_right,_#D1FAE5_0%,_#ffffff_60%)]' 
                    : 'bg-[radial-gradient(circle_at_top_right,_#FEF3C7_0%,_#ffffff_60%)]'
                }`} />

                {/* 2. Fine Line Decoration */}
                <div className={`absolute inset-16 border-t border-r opacity-20 ${shareData.type === 'verse' ? 'border-emerald-500' : 'border-amber-500'}`} />
                <div className={`absolute inset-16 border-b border-l opacity-20 ${shareData.type === 'verse' ? 'border-emerald-500' : 'border-amber-500'}`} />

                {/* 3. Subtle Motif Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                     <svg width="600" height="600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 0L61.2 38.8H100L68.8 61.2L80 100L50 77.6L20 100L31.2 61.2L0 38.8H38.8L50 0Z" fill="currentColor" />
                     </svg>
                </div>

                {/* 4. Content Layer */}
                <div className="relative z-10 w-full flex flex-col items-center text-center">
                    
                    {/* Centered Arabic Logo (Header Only) */}
                    <div className="mb-20 animate-fadeIn">
                        <Logo size={80} color={shareData.type === 'verse' ? '#10B981' : '#F59E0B'} showEnglish={false} />
                    </div>

                    {/* Main Text Body */}
                    <div className="px-12 w-full">
                        <Quote size={80} className={`mx-auto mb-10 opacity-10 ${shareData.type === 'verse' ? 'text-emerald-500' : 'text-amber-500'}`} />
                        
                        <p className={`text-gray-800 leading-[2.8] ${
                            shareData.type === 'verse' 
                            ? 'font-quran text-6xl' 
                            : 'font-arabic text-5xl font-medium'
                        }`} dir="rtl">
                            {shareData.text}
                        </p>

                        <div className="mt-16 mb-4 flex flex-col items-center gap-4">
                            <div className={`h-1 w-12 rounded-full ${shareData.type === 'verse' ? 'bg-emerald-200' : 'bg-amber-200'}`} />
                            <h4 className="text-3xl font-black font-arabicHead text-gray-800">{shareData.source}</h4>
                            {shareData.subSource && (
                                <span className="text-xl font-bold text-gray-400 font-arabic bg-gray-50 px-4 py-1 rounded-lg">
                                    {shareData.subSource}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* --- UI Components (Stay same as they were good) --- */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative">
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <BookOpen size={20} />
            <span className="font-bold text-sm md:text-base font-arabicHead">آية اليوم</span>
          </div>
          <div className="flex gap-1">
            <button 
                onClick={() => handleShareImage('verse')}
                disabled={isSharing === 'verse'}
                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
            >
                {isSharing === 'verse' ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            </button>
            <button 
                onClick={() => handleShareText(content.verse.text, `سورة ${content.verse.surah} - آية ${content.verse.ayahNumber}`)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
                <Share2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-6 text-center relative">
          <Quote size={32} className="absolute top-4 right-4 text-emerald-100 dark:text-emerald-900/40 opacity-50" />
          
          <div className="mb-4 relative z-10">
            <p className="font-quran text-2xl md:text-3xl font-normal leading-[2.5] text-gray-800 dark:text-gray-100 mb-4">
              {content.verse.text}
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-caption font-bold font-arabic">
               سورة {content.verse.surah} • آية {content.verse.ayahNumber}
            </div>
          </div>

          {content.verse.tafsir && (
            <p className="text-gray-500 dark:text-gray-400 text-body-sm leading-relaxed border-t border-emerald-50 dark:border-emerald-900/20 pt-3 mt-3 font-arabic">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">التفسير:</span>
              {content.verse.tafsir}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-sm border border-amber-100 dark:border-amber-900/30 relative">
        <div className="bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 flex items-center justify-between border-b border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Scroll size={20} />
            <span className="font-bold text-sm md:text-base font-arabicHead">حديث اليوم</span>
          </div>
          <div className="flex gap-1">
            <button 
                onClick={() => handleShareImage('hadith')}
                disabled={isSharing === 'hadith'}
                className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
            >
                {isSharing === 'hadith' ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            </button>
            <button 
                onClick={() => handleShareText(content.hadith.text, `${content.hadith.source} (${content.hadith.grade})`)}
                className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
                <Share2 size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 text-center relative">
          <Quote size={32} className="absolute top-4 right-4 text-amber-100 dark:text-amber-900/40 opacity-50" />
          
          <div className="mb-4 relative z-10">
            <p className="font-arabic text-xl md:text-2xl font-normal leading-[2.2] text-gray-800 dark:text-gray-100 mb-4">
              "{content.hadith.text}"
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold font-arabic">
                    {content.hadith.source}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold border border-green-100 dark:border-green-900/30 font-arabic">
                    {content.hadith.grade}
                </span>
            </div>
          </div>

          {content.hadith.explanation && (
            <div className="mt-6 border-t border-amber-50 dark:border-amber-900/20 pt-4">
                <button
                    onClick={() => setExpandExplanation(!expandExplanation)}
                    className="flex items-center justify-center gap-2 w-full text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 py-2 rounded-lg transition-colors font-arabic"
                >
                    {expandExplanation ? 'إخفاء الشرح' : 'عرض شرح الحديث'}
                    {expandExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${expandExplanation ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                >
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl text-gray-600 dark:text-gray-300 text-sm leading-loose border border-amber-100 dark:border-amber-900/30 text-justify font-arabic">
                        {content.hadith.explanation}
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyWisdom;