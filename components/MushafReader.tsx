
import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';

/**
 * Utility to format page numbers (e.g., 1 -> "001", 45 -> "045")
 * and generate the full EveryAyah URL.
 */
const getPageImageUrl = (pageNumber: number) => {
  const formattedNum = pageNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/images_png/Page_${formattedNum}.png`;
};

/**
 * Total pages in standard Madani Mushaf
 */
const TOTAL_PAGES = 604;

interface PageProps {
  pageNumber: number;
  isMobile: boolean;
}

/**
 * Individual Page Component
 * Must be forwardRef to work with react-pageflip
 */
const Page = forwardRef<HTMLDivElement, PageProps>(({ pageNumber, isMobile }, ref) => {
  return (
    <div className="bg-[#fffbf2] h-full w-full flex items-center justify-center shadow-inner overflow-hidden border-l border-gray-100 dark:border-gray-800" ref={ref}>
      <div className="relative w-full h-full flex flex-col">
        {/* Page Content */}
        <div className="flex-1 relative">
          <img
            src={getPageImageUrl(pageNumber)}
            alt={`Quran Page ${pageNumber}`}
            loading="lazy" // Native lazy loading
            className="w-full h-full object-fill pointer-events-none select-none"
          />
        </div>
        
        {/* Page Footer Number */}
        <div className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 font-mono">
          {pageNumber}
        </div>
      </div>
    </div>
  );
});

interface MushafReaderProps {
  initialPage: number;
  onPageChange: (page: number) => void;
}

const MushafReader: React.FC<MushafReaderProps> = ({ initialPage, onPageChange }) => {
  const book = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // CRITICAL: Initialize startPage once to prevent re-initialization of FlipBook on prop change
  // We handle navigation updates via the useEffect below
  const [mountStartPage] = useState(initialPage > 0 ? initialPage - 1 : 0);

  // Generate array [1, 2, ..., 604]
  const pages = React.useMemo(() => Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1), []);

  /**
   * Smart Resize Logic
   */
  const handleResize = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    
    // Prevent invalid calculations if container is not yet visible/sized
    if (containerWidth <= 0 || containerHeight <= 0) return;

    // Quran page approximate aspect ratio (Height / Width) ~= 1.55
    const aspectRatio = 1.55; 
    
    // Determine mobile state based on container width
    const mobileThreshold = 768;
    const isNowMobile = containerWidth < mobileThreshold;
    setIsMobile(isNowMobile);

    let bookHeight = containerHeight - 40; // Padding
    
    // Safety minimums
    if (bookHeight < 300) bookHeight = 300;

    let bookWidth = bookHeight / aspectRatio;

    if (isNowMobile) {
      // Mobile: Single page view
      if (bookWidth > containerWidth - 20) {
        bookWidth = containerWidth - 20;
        bookHeight = bookWidth * aspectRatio;
      }
    } else {
      // Desktop: Double page view
      if ((bookWidth * 2) > (containerWidth - 40)) {
        bookWidth = (containerWidth - 40) / 2;
        bookHeight = bookWidth * aspectRatio;
      }
    }

    setDimensions({
      width: Math.floor(bookWidth),
      height: Math.floor(bookHeight)
    });
    
    // Only set ready if dimensions are valid
    if (bookWidth > 0 && bookHeight > 0) {
        setIsReady(true);
    }
  }, []);

  useEffect(() => {
    // Initial resize with a small delay to ensure DOM layout is stable
    const timer = setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Sync internal state if external initialPage changes (e.g. from search jump)
  useEffect(() => {
      // Small timeout to allow book to be ready
      const timer = setTimeout(() => {
          if (book.current && book.current.pageFlip()) {
              try {
                  const flipObj = book.current.pageFlip();
                  const currentIndex = flipObj.getCurrentPageIndex();
                  const targetIndex = initialPage - 1;
                  
                  // Only jump if significant difference to avoid loop with onFlip callback
                  if (Math.abs(currentIndex - targetIndex) > 0) {
                     flipObj.turnToPage(targetIndex);
                     setCurrentPage(initialPage);
                  }
              } catch (e) {
                  console.warn("Flipbook not ready yet", e);
              }
          }
      }, 100);
      return () => clearTimeout(timer);
  }, [initialPage]);

  /**
   * Navigation Handlers
   */
  const onFlip = useCallback((e: any) => {
    // e.data is the new page index (0-based)
    const newPageNum = e.data + 1;
    setCurrentPage(newPageNum);
    onPageChange(newPageNum);
  }, [onPageChange]);

  const goToPrev = () => {
    // RTL: Prev (visual right arrow) -> flips to previous index (physically right page comes in)
    if (book.current && book.current.pageFlip()) book.current.pageFlip().flipNext(); 
  };

  const goToNext = () => {
    // RTL: Next (visual left arrow) -> flips to next index
    if (book.current && book.current.pageFlip()) book.current.pageFlip().flipPrev();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageNum = parseInt(e.target.value);
    if (book.current && book.current.pageFlip()) {
        try {
            book.current.pageFlip().turnToPage(pageNum - 1);
            setCurrentPage(pageNum);
            onPageChange(pageNum);
        } catch (e) {
            console.error("Slider error", e);
        }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#333] relative overflow-hidden" ref={containerRef}>
      
      {/* 2. Main Reader Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative perspective-1000">
        {!isReady && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>}
        
        {isReady && dimensions.width > 0 && (
            <div className="book-shadow z-10 transition-opacity duration-500 animate-fadeIn">
            <HTMLFlipBook
                width={dimensions.width}
                height={dimensions.height}
                size="fixed"
                minWidth={200}
                maxWidth={1000}
                minHeight={300}
                maxHeight={1533}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className="bg-white"
                ref={book}
                onFlip={onFlip}
                usePortrait={true}
                startPage={mountStartPage} // Use static initial value
                drawShadow={true}
                flippingTime={800}
                useMouseEvents={true}
                swipeDistance={30}
                direction="rtl"
            >
                {pages.map((pNum) => (
                <Page key={pNum} pageNumber={pNum} isMobile={isMobile} />
                ))}
            </HTMLFlipBook>
            </div>
        )}
      </div>

      {/* 3. Sticky Bottom Control Bar */}
      <div className="bg-black/80 backdrop-blur-md border-t border-white/10 flex flex-col justify-center px-4 py-4 z-30">
        
        <div className="flex flex-col w-full max-w-3xl mx-auto gap-3">
          
          <div className="flex items-center justify-between text-xs font-medium text-gray-400">
            <span>صفحة {currentPage}</span>
            <span>{TOTAL_PAGES}</span>
          </div>

          <div className="flex items-center gap-4 text-white">
            {/* Previous Button (Visual Right in RTL, Logical Prev) */}
            <button 
              onClick={goToNext} 
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <ChevronRight size={24} />
            </button>

            {/* Scrubber */}
            <input
              type="range"
              min={1}
              max={TOTAL_PAGES}
              value={currentPage}
              onChange={handleSliderChange}
              className="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all dir-ltr"
              dir="ltr"
            />

            {/* Next Button (Visual Left in RTL, Logical Next) */}
            <button 
              onClick={goToPrev} 
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MushafReader;
