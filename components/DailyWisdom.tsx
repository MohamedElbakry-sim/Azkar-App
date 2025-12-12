
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

  // Handle Text Share
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

  // Handle Image Share
  const handleShareImage = async (type: 'verse' | 'hadith') => {
    if (!content || isSharing) return;

    // 1. Set data for the hidden template
    if (type === 'verse') {
        setShareData({
            type: 'verse',
            text: content.verse.text,
            source: `سورة ${content.verse.surah}`,
            subSource: `آية ${content.verse.ayahNumber}`
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

    // 2. Wait for render, then capture
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
                scale: 3, // High quality scale
                backgroundColor: null,
                useCORS: true,
                logging: false,
            });

            // Use JPEG with 0.95 quality for better compression but high visual quality
            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) {
                     setIsSharing(null);
                     return;
                }
                
                const file = new File([blob], `rayyan-${type}-of-day.jpg`, { type: 'image/jpeg' });
                
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
                    link.download = `rayyan-${type}-of-day.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.95);
                    link.click();
                }
                setIsSharing(null);
                setShareData(null); // Reset
            }, 'image/jpeg', 0.95);

        } catch (error) {
            console.error('Image generation failed', error);
            setIsSharing(null);
            setShareData(null);
        }
    }, 100); // Small delay to ensure DOM is updated
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
      
      {/* --- Hidden Template for Image Generation --- */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        {shareData && (
            <div 
                ref={shareRef}
                className={`w-[1080px] h-[1080px] flex flex-col items-center justify-center p-20 relative text-center ${
                    shareData.type === 'verse' 
                    ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-black' 
                    : 'bg-gradient-to-br from-amber-900 via-amber-800 to-black'
                }`}
            >
                {/* Decorative Top */}
                <div className="text-white/20 mb-16">
                    <svg width="120" height="40" viewBox="0 0 100 20" fill="currentColor">
                        <path d="M50 0 C30 0 20 10 0 10 V20 C20 20 30 10 50 10 C70 10 80 20 100 20 V10 C80 10 70 0 50 0 Z" />
                    </svg>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center w-full">
                    {/* Header */}
                    <div className="mb-10 flex items-center gap-3 text-white/90 border-b border-white/20 pb-4 px-8">
                        {shareData.type === 'verse' ? <BookOpen size={40} /> : <Scroll size={40} />}
                        <span className="text-4xl font-bold font-arabicHead">
                            {shareData.type === 'verse' ? 'آية اليوم' : 'حديث اليوم'}
                        </span>
                    </div>

                    {/* Main Text */}
                    <div className="max-w-4xl relative">
                        <Quote size={80} className="absolute -top-12 -right-12 text-white/10" />
                        <p className="text-white font-arabic text-6xl leading-[2.5] drop-shadow-md" dir="rtl">
                            {shareData.text}
                        </p>
                    </div>

                    {/* Source */}
                    <div className="mt-16 flex flex-col items-center gap-2">
                        <div className="bg-white/10 backdrop-blur-md rounded-full px-10 py-4 border border-white/20 shadow-lg">
                            <span className="text-white text-3xl font-bold font-arabicHead">{shareData.source}</span>
                        </div>
                        {shareData.subSource && (
                             <span className="text-white/70 text-2xl mt-2 font-arabic">{shareData.subSource}</span>
                        )}
                    </div>
                </div>

                {/* Footer Branding - Bottom Right */}
                <div className="absolute bottom-12 right-12" dir="rtl">
                    <div className="flex items-center gap-5 bg-black/20 backdrop-blur-xl px-10 py-5 rounded-full border border-white/10 shadow-2xl">
                        <Logo size={100} className="text-white drop-shadow-md" />
                        <div className="flex flex-col gap-1 text-right">
                            <span className="text-white/90 text-xl font-medium leading-none drop-shadow-sm font-arabicHead">رفيقك اليومي في الذكر</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* --- Quran Card --- */}
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
                title="مشاركة صورة"
            >
                {isSharing === 'verse' ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            </button>
            <button 
                onClick={() => handleShareText(content.verse.text, `سورة ${content.verse.surah} - آية ${content.verse.ayahNumber}`)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="مشاركة نص"
            >
                <Share2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-6 text-center relative">
          <Quote size={32} className="absolute top-4 right-4 text-emerald-100 dark:text-emerald-900/40 opacity-50" />
          
          <div className="mb-4 relative z-10">
            {/* Modified: Use font-quran (Amiri), smaller text, normal weight */}
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

      {/* --- Hadith Card --- */}
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
                title="مشاركة صورة"
            >
                {isSharing === 'hadith' ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            </button>
            <button 
                onClick={() => handleShareText(content.hadith.text, `${content.hadith.source} (${content.hadith.grade})`)}
                className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                title="مشاركة نص"
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

          {/* Enhanced Collapsible Explanation Section */}
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
