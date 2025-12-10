
import React, { useState, useEffect, useRef } from 'react';
import { Dhikr } from '../types';
import { Heart, Repeat, Info, SkipForward, Copy, Share2, Check, Loader2, Edit3, Trash2 } from 'lucide-react';
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
  onEdit?: (item: Dhikr) => void;
  onDelete?: (id: number) => void;
  highlightQuery?: string;
  readonly?: boolean;
  fontSizeOverride?: storage.FontSize;
}

const DhikrCard: React.FC<DhikrCardProps> = ({ 
  item, 
  isFavorite, 
  initialCount, 
  targetCount: propTargetCount, 
  onToggleFavorite, 
  onComplete,
  onEdit,
  onDelete,
  highlightQuery,
  readonly = false,
  fontSizeOverride
}) => {
  const [count, setCount] = useState(initialCount);
  const [showBenefit, setShowBenefit] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Settings state
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');

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
    if (readonly || isExiting) return; 

    if (count < currentTarget) {
      const newCount = count + 1;
      setCount(newCount);
      // Save Session Progress (UI reset daily)
      storage.saveProgress(item.id, newCount);
      // Increment Historical Stats (Permanent)
      storage.incrementHistory(item.id, 1);
      
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
    if (readonly) return;
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
      storage.saveProgress(item.id, 0); // Only reset session, keep history
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
            scale: 3, // High quality scale
            backgroundColor: null, 
            useCORS: true,
            logging: false,
        });

        // Use JPEG with 0.95 quality for high quality result
        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) return;
            
            const file = new File([blob], 'dhikr-rayyan.jpg', { type: 'image/jpeg' });
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'ريان - ذكر',
                    });
                } catch (shareError) {
                    // User likely cancelled share, do nothing
                    console.log('Share cancelled');
                }
            } else {
                // Fallback: Download the image
                const link = document.createElement('a');
                link.download = 'dhikr-rayyan.jpg';
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
            }
            setIsSharing(false);
        }, 'image/jpeg', 0.95);

    } catch (err) {
        console.error('Share failed', err);
        setIsSharing(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(item);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;

    if (deleteConfirm) {
        // Trigger exit animation first for smooth deletion
        setIsExiting(true);
        // Wait for animation to finish then delete
        setTimeout(() => {
            onDelete(item.id);
            setDeleteConfirm(false); // Reset state
        }, 500);
    } else {
        setDeleteConfirm(true);
        // Auto-dismiss confirmation after 3 seconds
        setTimeout(() => setDeleteConfirm(false), 3000);
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
      case 'small': return 'text-h3 md:text-h2';
      case 'medium': return 'text-h2 md:text-h1';
      case 'large': return 'text-[30px] md:text-[36px]';
      case 'xlarge': return 'text-[34px] md:text-[42px]';
      default: return 'text-h2 md:text-h1';
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
        relative overflow-hidden bg-white dark:bg-dark-surface rounded-2xl shadow-sm dark:shadow-soft border border-gray-100 dark:border-dark-border 
        transition-all duration-500 ease-in-out outline-none focus:ring-2 focus:ring-primary-500
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${!readonly ? 'cursor-pointer active:scale-[0.99] hover:border-primary-500/30' : ''}
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
                    <span className="text-white/80 font-arabicHead text-h2 mb-8 border-b border-white/20 pb-2 inline-block">
                        {item.source}
                    </span>
                )}
                
                {/* Main Text */}
                <div className="max-w-4xl px-8">
                   {hasBasmala && (
                        <div className="text-primary-200 font-arabic text-4xl mb-6 opacity-90 drop-shadow-sm">
                            {BASMALA}
                        </div>
                    )}
                    <p className="text-white font-arabic text-[40px] leading-[2.2] drop-shadow-md" dir="rtl">
                        {displayText}
                    </p>
                </div>

                {/* Benefit if short */}
                {item.benefit && item.benefit.length < 100 && (
                    <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                         <p className="text-white/90 text-h3 font-light font-arabic">{item.benefit}</p>
                    </div>
                )}
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
      </div>

      {/* Progress Bar Background with Gradient */}
      {!readonly && (
        <div 
            className="absolute bottom-0 right-0 h-1.5 bg-gradient-to-r from-[#2ECC71] to-[#16A085] transition-all duration-300 ease-out"
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
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-elevated dark:text-dark-secondary'} `}
              aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>

            {/* Copy Button */}
            <button 
                onClick={handleCopy}
                className="p-2 rounded-full text-gray-400 dark:text-dark-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                title="نسخ النص"
                aria-label="نسخ النص"
            >
                {isCopied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>

            {/* Share Button */}
            <button 
                onClick={handleShare}
                disabled={isSharing}
                className="p-2 rounded-full text-gray-400 dark:text-dark-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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
            
            {/* Full Edit / Custom Edit */}
            {onEdit && (
                <button 
                onClick={handleEditClick}
                className="p-2 rounded-full text-gray-400 dark:text-dark-secondary hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                title="تعديل الذكر"
                >
                <Edit3 size={20} />
                </button>
            )}

            {/* Delete / Revert with Inline Confirmation */}
            {onDelete && (
                <button 
                onClick={handleDeleteClick}
                className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${deleteConfirm ? 'bg-red-50 text-red-600 px-3 w-auto' : 'text-gray-400 dark:text-dark-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                title="حذف/استعادة"
                >
                {deleteConfirm ? (
                    <span className="text-caption font-bold whitespace-nowrap">تأكيد الحذف؟</span>
                ) : (
                    <Trash2 size={20} />
                )}
                </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
             <span className="text-caption font-medium text-gray-500 dark:text-dark-secondary bg-gray-100 dark:bg-dark-elevated px-2 py-1 rounded-lg font-arabic">
               {item.source || 'ذكر'}
             </span>
          </div>
        </div>

        {/* Text Content */}
        <div className={`mb-6 text-center select-none transition-transform ${animate ? 'scale-[1.01]' : 'scale-100'}`}>
            {hasBasmala && (
                <div className={`font-arabic text-center text-primary-600 dark:text-primary-400 mb-2 opacity-90 ${getFontSizeClass()}`}>
                    {BASMALA}
                </div>
            )}
            <p className={`font-arabic leading-[2.5] text-gray-800 dark:text-dark-text mb-4 transition-all duration-300 ${getFontSizeClass()}`}>
                {renderHighlightedText(displayText, highlightQuery)}
            </p>
        </div>

        {/* Benefit Toggle */}
        {showBenefit && item.benefit && (
           <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800 text-body-sm text-blue-800 dark:text-blue-200 animate-fadeIn font-arabic">
             <strong>الفضل:</strong> {item.benefit}
           </div>
        )}

        {/* Footer: Counter (Hidden in Readonly) */}
        {!readonly && (
          <div className="flex justify-between items-center border-t border-gray-100 dark:border-dark-border pt-4 mt-2">
            <div className="flex items-center gap-2 text-body-sm text-gray-500 dark:text-dark-muted font-english" aria-live="polite">
               <Repeat size={16} />
               <span>{count} / {currentTarget}</span>
            </div>
            
            <div className="flex gap-3">
               {count > 0 && (
                <button 
                  onClick={handleReset}
                  className={`text-caption px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ${
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
                  className="flex items-center gap-1 text-caption text-gray-400 hover:text-gray-600 dark:text-dark-muted dark:hover:text-dark-text px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                  title="تخطي"
                  aria-label="تخطي هذا الذكر"
              >
                  <SkipForward size={14} />
                  تخطي
              </button>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-caption font-bold transition-colors bg-gray-100 text-gray-600 dark:bg-dark-elevated dark:text-dark-text font-arabic`}>
              {currentTarget - count > 0 ? `${currentTarget - count} متبقي` : 'اكتمل'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DhikrCard;