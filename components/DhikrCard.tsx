
import React, { useState, useEffect, useRef } from 'react';
import { Dhikr } from '../types';
import { Heart, Repeat, Info, Share2, SkipForward, Settings, Check, X, Download, Globe } from 'lucide-react';
import * as storage from '../services/storage';
import { getHighlightRegex } from '../utils';

interface DhikrCardProps {
  item: Dhikr;
  isFavorite: boolean;
  initialCount: number;
  targetCount?: number;
  onToggleFavorite: (id: number) => void;
  onComplete?: (id: number) => void;
  onTargetChange?: (id: number, newTarget: number) => void;
  highlightQuery?: string; // New prop for search highlighting
}

const DhikrCard: React.FC<DhikrCardProps> = ({ 
  item, 
  isFavorite, 
  initialCount, 
  targetCount: propTargetCount, 
  onToggleFavorite, 
  onComplete,
  onTargetChange,
  highlightQuery
}) => {
  const [count, setCount] = useState(initialCount);
  const [showBenefit, setShowBenefit] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  
  // Settings state
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [targetInput, setTargetInput] = useState<string>("");

  const cardRef = useRef<HTMLDivElement>(null);

  // Use the prop target count or default to item.count
  const currentTarget = propTargetCount || item.count;

  useEffect(() => {
    setCount(initialCount);
    setShowTranslation(storage.getShowTranslation());
    setShowTransliteration(storage.getShowTransliteration());
  }, [initialCount]);

  const handleTap = () => {
    if (isEditing) return; // Disable tap to count while editing

    if (count < currentTarget) {
      const newCount = count + 1;
      setCount(newCount);
      storage.saveProgress(item.id, newCount);
      
      // Vibration feedback (if enabled)
      if (storage.getHapticEnabled() && navigator.vibrate) {
         navigator.vibrate(10);
      }
      
      // Tap Animation
      setAnimate(true);
      setTimeout(() => setAnimate(false), 150);

      // Completion Logic
      if (newCount >= currentTarget) {
        if (storage.getHapticEnabled() && navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
        
        // Trigger Exit Animation
        setTimeout(() => {
          setIsExiting(true);
        }, 300); // Short delay to see the full bar

        // Remove from view after animation
        setTimeout(() => {
          if (onComplete) onComplete(item.id);
        }, 800); // 300ms delay + 500ms animation
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;
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
      // Haptic
      if (storage.getHapticEnabled() && navigator.vibrate) navigator.vibrate(20);
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!cardRef.current) return;
    
    // Check if html2canvas is available (loaded via CDN in index.html)
    if ((window as any).html2canvas) {
      try {
        // Detect current theme for background color
        const isDark = document.documentElement.classList.contains('dark');
        const bgColor = isDark ? '#1f2937' : '#ffffff'; // gray-800 or white

        const canvas = await (window as any).html2canvas(cardRef.current, {
          backgroundColor: bgColor, 
          scale: 2, // Retina resolution
          useCORS: true,
          logging: false,
        });
        
        canvas.toBlob((blob: Blob | null) => {
          if (blob && navigator.share) {
             const file = new File([blob], 'dhikr-share.png', { type: 'image/png' });
             navigator.share({
               title: 'مشاركة ذكر - تطبيق نور',
               text: `${item.text}\n\nتمت المشاركة عبر تطبيق نور`,
               files: [file]
             }).catch(err => {
               // Fallback to text sharing if file sharing fails (some browsers restrict files)
               console.warn('File share failed, falling back to text', err);
               shareText();
             });
          } else {
             // Fallback: download the image
             const link = document.createElement('a');
             link.download = `dhikr-${item.id}.png`;
             link.href = canvas.toDataURL();
             link.click();
          }
        });
      } catch (err) {
        console.error("Image generation failed", err);
        shareText();
      }
    } else {
      shareText();
    }
  };
  
  const shareText = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ذكر',
        text: `${item.text}\n\n(تطبيق نور)`,
      }).catch(console.error);
    } else {
        navigator.clipboard.writeText(item.text);
        alert('تم نسخ النص');
    }
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

  const renderHighlightedText = (text: string, query?: string) => {
    if (!query) return text;
    
    const regex = getHighlightRegex(query);
    if (!regex) return text;

    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded-sm px-0.5 mx-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const progressPercent = Math.min((count / currentTarget) * 100, 100);

  return (
    <div 
      ref={cardRef}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${item.text} - ${count} من ${currentTarget}`}
      className={`
        relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 
        transition-all duration-500 ease-in-out cursor-pointer active:scale-[0.99] outline-none focus:ring-2 focus:ring-primary-500
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${isEditing ? 'ring-2 ring-primary-400' : ''}
      `}
    >
      {/* Progress Bar Background */}
      <div 
        className="absolute bottom-0 right-0 h-1.5 bg-primary-500 transition-all duration-300 ease-out"
        style={{ width: `${progressPercent}%` }}
        aria-hidden="true"
      />

      <div className="p-5 md:p-6 relative z-10">
        {/* Header: Icons */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
             <button 
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
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
             <button 
              onClick={handleShare}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              title="مشاركة كصورة"
              aria-label="مشاركة الذكر كصورة"
            >
              <Share2 size={20} />
            </button>
            
            <button 
              onClick={startEditing}
              className="p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              title="تعديل العدد"
              aria-label="تعديل عدد التكرار"
            >
              <Settings size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
               {item.source || 'ذكر'}
             </span>
          </div>
        </div>

        {/* Edit Mode UI */}
        {isEditing ? (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex flex-col items-center gap-3 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
            <label htmlFor={`target-input-${item.id}`} className="text-sm font-bold text-gray-600 dark:text-gray-300">عدد التكرار المطلوب:</label>
            <div className="flex items-center gap-2 w-full max-w-[200px]">
               <input 
                  id={`target-input-${item.id}`}
                  type="number" 
                  min="1"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-center text-lg font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                  autoFocus
               />
            </div>
            <div className="flex gap-2 w-full max-w-[200px]">
               <button 
                 onClick={cancelEditing}
                 className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-500"
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
            <p className="font-serif text-2xl md:text-3xl leading-loose text-gray-800 dark:text-gray-100 mb-4">
              {renderHighlightedText(item.text, highlightQuery)}
            </p>
            
            {showTransliteration && item.transliteration && (
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 italic mb-2 dir-ltr" lang="en">
                {item.transliteration}
              </p>
            )}
            
            {showTranslation && item.translation && (
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 dir-ltr" lang="en">
                {item.translation}
              </p>
            )}
          </div>
        )}

        {/* Benefit Toggle */}
        {showBenefit && item.benefit && (
           <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-200 animate-fadeIn">
             <strong>الفضل:</strong> {item.benefit}
           </div>
        )}

        {/* Footer: Counter */}
        {!isEditing && (
          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
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

            <div className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`}>
              {currentTarget - count > 0 ? `${currentTarget - count} متبقي` : 'اكتمل'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DhikrCard;
