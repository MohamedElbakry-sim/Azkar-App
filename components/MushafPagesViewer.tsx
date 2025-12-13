
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';

const TOTAL_PAGES = 604;

// Static URL generation - Acts as the immutable data source
const getPageImageUrl = (pageNumber: number) => {
  const formattedNum = pageNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/images_png/Page_${formattedNum}.png`;
};

interface MushafPagesViewerProps {
  initialPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

const MushafPagesViewer: React.FC<MushafPagesViewerProps> = ({ initialPage, onPageChange, onClose }) => {
  const [page, setPage] = useState(initialPage);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  
  // Touch tracking refs
  const touchStartX = useRef<number | null>(null);
  
  // Debounce overlay hiding
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal state with props if needed (optional, usually page is driven internally)
  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  // --- Preloading Logic ---
  // Only loads Current, Prev (-1), and Next (+1)
  useEffect(() => {
    setImageLoaded(false);
    
    // Preload Next
    if (page < TOTAL_PAGES) {
      const imgNext = new Image();
      imgNext.src = getPageImageUrl(page + 1);
    }
    // Preload Prev
    if (page > 1) {
      const imgPrev = new Image();
      imgPrev.src = getPageImageUrl(page - 1);
    }
  }, [page]);

  // --- Navigation Logic ---
  const goToNext = useCallback(() => {
    if (page < TOTAL_PAGES) {
      const newPage = page + 1;
      setPage(newPage);
      onPageChange(newPage);
    }
  }, [page, onPageChange]);

  const goToPrev = useCallback(() => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      onPageChange(newPage);
    }
  }, [page, onPageChange]);

  // --- Touch Handlers (Swipe) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const swipeThreshold = 50; 

    // Reset start
    touchStartX.current = null;

    if (Math.abs(diff) < swipeThreshold) {
      // Tap detected (minimal movement) -> Toggle Overlay
      toggleOverlay();
      return;
    }

    // Swipe Left (diff > 0) -> Next Page (in LTR context, but logic depends on visual direction)
    // In RTL interfaces:
    // Swipe Right-to-Left (Finger moves Left) usually means "Next" physically in a book? 
    // Actually, in standard UI: Swipe Left (Drag content left) reveals Right content -> Next.
    if (diff > 0) {
      goToNext(); // Dragging left -> Next Page (Logic: 1 -> 2)
    } else {
      goToPrev(); // Dragging right -> Prev Page (Logic: 2 -> 1)
    }
  };

  const toggleOverlay = () => {
    setShowOverlay(prev => !prev);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    
    // Auto hide after 3 seconds if showing
    if (!showOverlay) {
        overlayTimeoutRef.current = setTimeout(() => setShowOverlay(false), 3000);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') goToNext();
        if (e.key === 'ArrowRight') goToPrev();
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#1a1a1a] flex flex-col h-[100vh] w-full overflow-hidden touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* --- Overlay Header --- */}
      <div 
        className={`
            absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-transparent z-20 
            flex items-center justify-between px-4 transition-transform duration-300
            ${showOverlay ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
         <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-white/20 transition-colors">
            <X size={20} />
         </button>
         
         <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full backdrop-blur-md border border-white/10">
            <BookOpen size={14} className="text-emerald-400" />
            <span className="text-white font-mono text-sm font-bold">
                صفحة {page}
            </span>
         </div>
      </div>

      {/* --- Main Image Viewport --- */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-[#1a1a1a]">
         {/* Loading Spinner */}
         {!imageLoaded && (
             <div className="absolute inset-0 flex items-center justify-center z-0">
                 <Loader2 size={40} className="animate-spin text-emerald-500" />
             </div>
         )}

         {/* The Page Image */}
         {/* Key ensures React remounts the img on page change for clean transition */}
         <img 
            key={page}
            src={getPageImageUrl(page)}
            alt={`Quran Page ${page}`}
            onLoad={() => setImageLoaded(true)}
            className={`
                relative z-10 max-h-full max-w-full object-contain 
                transition-opacity duration-300 pointer-events-none
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ 
                // Promote to own layer for GPU compositing
                willChange: 'transform, opacity', 
                backfaceVisibility: 'hidden' 
            }}
         />
      </div>

      {/* --- Navigation Click Zones (Desktop) --- */}
      <div 
        className="absolute inset-y-0 left-0 w-20 z-10 hidden md:flex items-center justify-center hover:bg-black/20 cursor-pointer group transition-colors"
        onClick={(e) => { e.stopPropagation(); goToNext(); }}
      >
          <ChevronLeft size={40} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>
      <div 
        className="absolute inset-y-0 right-0 w-20 z-10 hidden md:flex items-center justify-center hover:bg-black/20 cursor-pointer group transition-colors"
        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
      >
          <ChevronRight size={40} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>

      {/* --- Overlay Footer (Slider) --- */}
      <div 
        className={`
            absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/90 to-transparent z-20 
            flex flex-col items-center justify-end pb-8 px-6 transition-transform duration-300
            ${showOverlay ? 'translate-y-0' : 'translate-y-full'}
        `}
        // Prevent swipe on slider
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
          <input 
            type="range" 
            min="1" 
            max={TOTAL_PAGES} 
            value={page}
            onChange={(e) => {
                const val = parseInt(e.target.value);
                setPage(val);
                onPageChange(val); // Sync immediately for slider feedback
            }}
            className="w-full max-w-md h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 dir-ltr"
            dir="ltr"
          />
          <div className="flex justify-between w-full max-w-md mt-2 text-[10px] text-gray-400 font-mono">
              <span>1</span>
              <span>604</span>
          </div>
      </div>
    </div>
  );
};

export default MushafPagesViewer;
