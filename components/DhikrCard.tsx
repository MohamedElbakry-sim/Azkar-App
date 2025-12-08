
import React, { useState, useEffect, useRef } from 'react';
import { Dhikr } from '../types';
import { Heart, Repeat, Info, SkipForward, Settings, Copy, Share2, Check, Loader2 } from 'lucide-react';
import * as storage from '../services/storage';
import { getHighlightRegex } from '../utils';
import Logo from './Logo';

interface DhikrCardProps {
  item: Dhikr;
  isFavorite: boolean;
  initialCount: number;
  targetCount?: number;
  onToggleFavorite: (id: number) => void;
  onComplete?: (id: number) => void;
  onTargetChange?: (id: number, newTarget: number) => void;
  highlightQuery?: string;
  readonly?: boolean;
  fontSizeOverride?: storage.FontSize; // New prop for direct control
}

const DhikrCard: React.FC<DhikrCardProps> = ({ 
  item, 
  isFavorite, 
  initialCount, 
  targetCount: propTargetCount, 
  onToggleFavorite, 
  onComplete,
  onTargetChange,
  highlightQuery,
  readonly = false,
  fontSizeOverride
}) => {
  const [count, setCount] = useState(initialCount);
  const [showBenefit, setShowBenefit] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  
  // Settings state
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [targetInput, setTargetInput] = useState<string>("");

  // Copy/Share State
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  // Basmala Constant
  const BASMALA = "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم";
  const hasBasmala = item.text.startsWith(BASMALA);
  
  // Process text to remove Basmala if present for display
  const displayText = hasBasmala ? item.text.substring(BASMALA.length).trim() : item.text;

  // Use the prop target count or default to item.count
  const currentTarget = propTargetCount || item.count;

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // Update font size if override prop changes, otherwise read from storage
  useEffect(() => {
    if (fontSizeOverride) {
      setFontSize(fontSizeOverride);
    } else {
      setFontSize(storage.getFontSize());
    }
  }, [fontSizeOverride]);

  const handleTap = () => {
    if (readonly || isEditing || isExiting) return; 

    if (count < currentTarget) {
      const newCount = count + 1;
      setCount(newCount);
      storage.saveProgress(item.id, newCount);
      
      // Tap Animation
      setAnimate(true);
      setTimeout(() => setAnimate(false), 150);

      // Completion Logic
      if (newCount >= currentTarget) {
        // Trigger Exit Animation
        setTimeout(() => {
          setIsExiting(true);
          // Actual Callback after exit animation
          setTimeout(() => {
            if (onComplete) onComplete(item.id);
          }, 800); 
        }, 300); 
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readonly || isEditing) return;
    // Allow 'Enter' or 'Space' to trigger tap if focus is on the card
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTap();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resetConfirm) {
      setCount(0);
      storage.saveProgress(item.id, 0);
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    storage.markAsSkipped(item.id);
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete(item.id);
    }, 800);
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetInput(currentTarget.toString());
    setIsEditing(true);
  };

  const saveEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTarget = parseInt(targetInput, 10);
    if (!isNaN(newTarget) && newTarget > 0) {
      if (onTargetChange) {
        onTargetChange(item.id, newTarget);
        
        // If the new target is less than or equal to current count, trigger complete
        if (count >= newTarget) {
           setTimeout(() => {
            setIsExiting(true);
            if (onComplete) setTimeout(() => onComplete(item.id), 500);
           }, 300);
        }
      }
    }
    setIsEditing(false);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareRef.current || isSharing) return;
    
    setIsSharing(true);

    try {
        // Access html2canvas from window since it's loaded via CDN
        const html2canvas = (window as any).html2canvas;
        
        if (!html2canvas) {
            console.error('html2canvas not loaded');
            alert('خطأ في تحميل مكتبة المشاركة');
            setIsSharing(false);
            return;
        }

        const canvas = await html2canvas(shareRef.current, {
            scale: 1.5, // Optimized scale (was 2) to reduce file size while maintaining good quality
            backgroundColor: null, 
            useCORS: true,
            logging: false,
        });

        // Use JPEG with 0.85 quality for significant file size reduction compared to PNG
        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) return;
            
            const file = new File([blob], 'dhikr-nour.jpg', { type: 'image/jpeg' });
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'نور - ذكر',
                    });
                } catch (shareError) {
                    // User likely cancelled share, do nothing
                    console.log('Share cancelled');
                }
            } else {
                // Fallback: Download the image
                const link = document.createElement('a');
                link.download = 'dhikr-nour.jpg';
                link.href = canvas.toDataURL('image/jpeg', 0.85);
                link.click();
            }
            setIsSharing(false);
        }, 'image/jpeg', 0.85);

    } catch (err) {
        console.error('Share failed', err);
        setIsSharing(false);
    }
  };

  const renderHighlightedText = (text: string, query?: string) => {
    if (!query) return text;
    
    const regex = getHighlightRegex(query);
    if (!regex) return text;

    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-primary-100 dark:bg-primary-900/50 text-inherit rounded-sm px-0.5 mx-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xl md:text-2xl';
      case 'medium': return 'text-2xl md:text-3xl';
      case 'large': return 'text-3xl md:text-4xl';
      case 'xlarge': return 'text-4xl md:text-5xl';
      default: return 'text-2xl md:text-3xl';
    }
  };

  const progressPercent = Math.min((count / currentTarget) * 100, 100);

  return (
    <div 
      ref={cardRef}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      role={readonly ? "article" : "button"}
      tabIndex={readonly ? -1 : 0}
      aria-label={readonly ? item.text : `${item.text} - ${count} من ${currentTarget}`}
      className={`
        relative overflow-hidden bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border 
        transition-all duration-500 ease-in-out outline-none focus:ring-2 focus:ring-primary-500
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${isEditing ? 'ring-2 ring-primary-400' : ''}
        ${!readonly ? 'cursor-pointer active:scale-[0.99]' : ''}
      `}
    >
      {/* Hidden Aesthetic Template for Image Generation */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        <div 
            ref={shareRef}
            className="w-[1080px] h-[1080px] bg-gradient-to-br from-[#15803d] to-[#052e16] flex flex-col items-center justify-center p-20 relative text-center"
        >
            {/* Decorative Top */}
            <div className="text-white/20 mb-12">
                <svg width="120" height="40" viewBox="0 0 100 20" fill="currentColor">
                    <path d="M50 0 C30 0 20 10 0 10 V20 C20 20 30 10 50 10 C70 10 80 20 100 20 V10 C80 10 70 0 50 0 Z" />
                </svg>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center w-full">
                {/* Source Label */}
                {item.source && (
                    <span className="text-white/80 font-serif text-2xl mb-8 border-b border-white/20 pb-2 inline-block">
                        {item.source}
                    </span>
                )}
                
                {/* Main Text */}
                <div className="max-w-4xl">
                   {hasBasmala && (
                        <div className="text-primary-200 font-serif text-4xl mb-6 opacity-90 drop-shadow-sm">
                            {BASMALA}
                        </div>
                    )}
                    <p className="text-white font-serif text-5xl leading-[4] drop-shadow-md" dir="rtl">
                        {displayText}
                    </p>
                </div>

                {/* Benefit if short */}
                {item.benefit && item.benefit.length < 100 && (
                    <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                         <p className="text-white/90 text-2xl font-light">{item.benefit}</p>
                    </div>
                )}
            </div>

            {/* Footer Branding */}
            <div className="mt-12 flex items-center gap-4 text-white/80">
                <Logo size={64} className="text-white" />
                <div className="flex flex-col items-start gap-1">
                    <span className="text-3xl font-bold font-serif tracking-wide">نور</span>
                    <span className="text-xl opacity-80">أذكار المسلم</span>
                </div>
            </div>
        </div>
      </div>

      {/* Progress Bar Background (Hidden in Readonly) */}
      {!readonly && (
        <div 
            className="absolute bottom-0 right-0 h-1.5 bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            aria-hidden="true"
        />
      )}

      <div className="p-5 md:p-6 relative z-10">
        {/* Header: Icons */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
             <button 
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
              aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>

            {/* Copy Button */}
            <button 
                onClick={handleCopy}
                className="p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                title="نسخ النص"
                aria-label="نسخ النص"
            >
                {isCopied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>

            {/* Share Button */}
            <button 
                onClick={handleShare}
                disabled={isSharing}
                className="p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                title="مشاركة كصورة"
                aria-label="مشاركة كصورة"
            >
                {isSharing ? <Loader2 size={20} className="animate-spin text-primary-500" /> : <Share2 size={20} />}
            </button>

            {item.benefit && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowBenefit(!showBenefit); }}
                className="p-2 rounded-full text-blue-500 bg-blue-50 dark:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="عرض الفضل"
                aria-expanded={showBenefit}
              >
                <Info size={20} />
              </button>
            )}
            
            {!readonly && (
                <button 
                onClick={startEditing}
                className="p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                title="تعديل العدد"
                aria-label="تعديل عدد التكرار"
                >
                <Settings size={20} />
                </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
             <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-bg px-2 py-1 rounded-lg">
               {item.source || 'ذكر'}
             </span>
          </div>
        </div>

        {/* Edit Mode UI */}
        {isEditing ? (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-bg/50 rounded-xl flex flex-col items-center gap-3 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
            <label htmlFor={`target-input-${item.id}`} className="text-sm font-bold text-gray-600 dark:text-gray-300">عدد التكرار المطلوب:</label>
            <div className="flex items-center gap-2 w-full max-w-[200px]">
               <input 
                  id={`target-input-${item.id}`}
                  type="number" 
                  min="1"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border dark:bg-dark-bg text-center text-lg font-bold focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                  autoFocus
               />
            </div>
            <div className="flex gap-2 w-full max-w-[200px]">
               <button 
                 onClick={cancelEditing}
                 className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600"
               >
                 إلغاء
               </button>
               <button 
                 onClick={saveEditing}
                 className="flex-1 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600"
               >
                 حفظ
               </button>
            </div>
          </div>
        ) : (
          /* Text Content */
          <div className={`mb-6 text-center select-none transition-transform ${animate ? 'scale-[1.01]' : 'scale-100'}`}>
            {hasBasmala && (
                <div className={`font-serif text-center text-primary-600 dark:text-primary-400 mb-2 opacity-90 ${getFontSizeClass()}`}>
                    {BASMALA}
                </div>
            )}
            <p className={`font-serif leading-[2.3] md:leading-[2.5] text-gray-800 dark:text-gray-100 mb-4 transition-all duration-300 ${getFontSizeClass()}`}>
              {renderHighlightedText(displayText, highlightQuery)}
            </p>
          </div>
        )}

        {/* Benefit Toggle */}
        {showBenefit && item.benefit && (
           <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-200 animate-fadeIn">
             <strong>الفضل:</strong> {item.benefit}
           </div>
        )}

        {/* Footer: Counter (Hidden in Readonly) */}
        {!readonly && !isEditing && (
          <div className="flex justify-between items-center border-t border-gray-100 dark:border-dark-border pt-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
               <Repeat size={16} />
               <span>{count} / {currentTarget}</span>
            </div>
            
            <div className="flex gap-3">
               {count > 0 && (
                <button 
                  onClick={handleReset}
                  className={`text-xs px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ${
                    resetConfirm 
                    ? 'text-red-600 bg-red-100 font-bold' 
                    : 'text-red-400 hover:text-red-500'
                  }`}
                  aria-label={resetConfirm ? "تأكيد إعادة العد" : "إعادة العد"}
                >
                  {resetConfirm ? 'تأكيد؟' : 'إعادة'}
                </button>
              )}
              
              <button
                  onClick={handleSkip}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                  title="تخطي"
                  aria-label="تخطي هذا الذكر"
              >
                  <SkipForward size={14} />
                  تخطي
              </button>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-600 dark:bg-dark-bg dark:text-gray-300`}>
              {currentTarget - count > 0 ? `${currentTarget - count} متبقي` : 'اكتمل'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DhikrCard;
