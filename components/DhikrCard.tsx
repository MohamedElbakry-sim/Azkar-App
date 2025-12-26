import React, { useState, useEffect, useRef } from 'react';
import { Dhikr } from '../types';
import { Heart, Repeat, Info, Share2, Copy, Check, Edit3, Trash2, SkipForward, MoveUp, MoveDown } from 'lucide-react';
import * as storage from '../services/storage';
import { getHighlightRegex } from '../utils';

interface DhikrCardProps {
  item: Dhikr;
  isFavorite: boolean;
  initialCount: number;
  targetCount?: number;
  onToggleFavorite: (id: number) => void;
  onComplete?: (id: number) => void;
  onEdit?: (item: Dhikr) => void;
  onDelete?: (id: number) => void;
  onSkip?: (id: number) => void; // New prop
  highlightQuery?: string;
  readonly?: boolean;
  fontSizeOverride?: storage.FontSize;
  // Reordering props
  reorderMode?: boolean;
  onMoveUp?: (id: number) => void;
  onMoveDown?: (id: number) => void;
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
  onSkip,
  highlightQuery,
  readonly = false,
  fontSizeOverride,
  reorderMode = false,
  onMoveUp,
  onMoveDown
}) => {
  const [count, setCount] = useState(initialCount);
  const [showBenefit, setShowBenefit] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Font Size Calculation
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');

  const BASMALA = "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم";
  const hasBasmala = item.text.startsWith(BASMALA);
  const displayText = hasBasmala ? item.text.substring(BASMALA.length).trim() : item.text;
  const currentTarget = propTargetCount || item.count;
  const progressPercent = Math.min((count / currentTarget) * 100, 100);
  const isCompleted = count >= currentTarget;

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setFontSize(fontSizeOverride || storage.getFontSize());
  }, [fontSizeOverride]);

  const handleTap = () => {
    if (readonly || isCompleted || reorderMode) return;

    // Trigger visual press state
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 100);

    const newCount = count + 1;
    setCount(newCount);
    storage.saveProgress(item.id, newCount);
    storage.incrementHistory(item.id, 1);

    if (newCount >= currentTarget) {
      if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
      setTimeout(() => {
        if (onComplete) onComplete(item.id);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!readonly && !isCompleted && !reorderMode && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleTap();
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xl leading-loose';
      case 'medium': return 'text-2xl leading-loose';
      case 'large': return 'text-3xl leading-loose';
      case 'xlarge': return 'text-4xl leading-[2.2]';
      default: return 'text-2xl leading-loose';
    }
  };

  const renderHighlightedText = (text: string) => {
    if (!highlightQuery) return text;
    const regex = getHighlightRegex(highlightQuery);
    if (!regex) return text;
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-gray-900 dark:text-white rounded px-1">{part}</span> : part
    );
  };

  return (
    <div className={`relative mb-6 group ${isCompleted ? 'opacity-60 grayscale transition-all duration-700' : ''}`}>
      
      {/* Main Interaction Card */}
      <div 
        role="button"
        tabIndex={readonly || isCompleted || reorderMode ? -1 : 0}
        onClick={handleTap}
        onKeyDown={handleKeyDown}
        className={`
            w-full text-right relative overflow-hidden bg-white dark:bg-dark-surface rounded-[2rem] shadow-card border border-gray-100 dark:border-dark-border
            transition-transform duration-100 outline-none select-none isolate
            ${isPressed ? 'scale-[0.98]' : 'scale-100'}
            ${!readonly && !isCompleted && !reorderMode ? 'active:ring-2 active:ring-primary-500 cursor-pointer' : 'cursor-default'}
            ${reorderMode ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg' : ''}
        `}
      >
        {/* Progress Background Fill */}
        {!readonly && !reorderMode && (
            <div 
                className="absolute bottom-0 right-0 top-0 bg-primary-500/10 dark:bg-emerald-500/10 transition-all duration-500 ease-out z-0 pointer-events-none"
                style={{ width: `${progressPercent}%` }}
            />
        )}

        <div className="relative z-10 p-5 md:p-8">
            {/* Header: Meta & Actions */}
            <div className="flex justify-between items-center mb-4">
                {/* Source Badge */}
                <span className="bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-dark-muted px-3 py-1 rounded-lg text-caption font-bold truncate max-w-[150px]">
                    {item.source || 'ذكر'}
                </span>

                {/* Actions */}
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {/* Reorder Controls */}
                    {reorderMode && onMoveUp && onMoveDown ? (
                        <>
                            <button onClick={() => onMoveUp(item.id)} className="p-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full hover:text-primary-600 text-gray-500">
                                <MoveUp size={18} />
                            </button>
                            <button onClick={() => onMoveDown(item.id)} className="p-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full hover:text-primary-600 text-gray-500">
                                <MoveDown size={18} />
                            </button>
                        </>
                    ) : (
                        // Standard Actions
                        <>
                            {onSkip && !readonly && !isCompleted && (
                                <button
                                    onClick={() => onSkip(item.id)}
                                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                                    title="تخطي (لا يحتسب)"
                                >
                                    <SkipForward size={18} />
                                </button>
                            )}
                            <button 
                                onClick={() => onToggleFavorite(item.id)}
                                className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                                title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                            >
                                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                            {item.benefit && (
                                <button 
                                    onClick={() => setShowBenefit(!showBenefit)}
                                    className={`p-2 rounded-full transition-colors ${showBenefit ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                                    title="فضل الذكر"
                                >
                                    <Info size={18} />
                                </button>
                            )}
                            {onEdit && (
                                <button onClick={() => onEdit(item)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-full" title="تعديل">
                                    <Edit3 size={18} />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={() => onDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full" title="حذف">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mb-2 px-1">
                {hasBasmala && (
                    <div className="text-center text-primary-600 dark:text-primary-400 mb-4 opacity-80 font-arabic text-xl">
                        {BASMALA}
                    </div>
                )}
                <p className={`font-arabic font-medium text-gray-800 dark:text-dark-text text-center ${getFontSizeClass()}`}>
                    {renderHighlightedText(displayText)}
                </p>
            </div>

            {/* Counter Badge */}
            {currentTarget > 1 && !reorderMode && (
                <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-dark-elevated/40 px-4 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-dark-border">
                        <Repeat size={14} className="opacity-70" />
                        <span className="text-sm font-bold font-english">{count} / {currentTarget}</span>
                    </div>
                </div>
            )}

            {/* Benefit Drawer */}
            {showBenefit && item.benefit && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border animate-slideUp" onClick={e => e.stopPropagation()}>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl">
                        <p className="text-body text-blue-800 dark:text-blue-200 font-arabic leading-relaxed">
                            {item.benefit}
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Completion Indicator */}
      {isCompleted && !readonly && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-emerald-500 text-white rounded-full p-4 shadow-xl animate-scaleIn">
                  <Check size={32} strokeWidth={3} />
              </div>
          </div>
      )}
    </div>
  );
};

export default DhikrCard;