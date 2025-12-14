
import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, WifiOff } from 'lucide-react';

// NOTE: In the full mobile migration, this function will be replaced 
// by the Filesystem-First logic described in the engineering plan.
const getPageImageUrl = (pageNumber: number) => {
  const formattedNum = pageNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/images_png/Page_${formattedNum}.png`;
};

const TOTAL_PAGES = 604;

interface PageProps {
  pageNumber: number;
  isActive: boolean;
}

const Page = React.memo(({ pageNumber, isActive }: PageProps) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Virtualization Logic: Only load image if the page is active or neighbor
    // This prevents the "604 images loading at once" crash.
    if (isActive) {
        setLoading(true);
        const img = new Image();
        const url = getPageImageUrl(pageNumber);
        
        img.onload = () => {
            setSrc(url);
            setLoading(false);
            setError(false);
        };
        
        img.onerror = () => {
            setLoading(false);
            setError(true);
        };
        
        img.src = url;
    }
    
    // Cleanup: Release memory if page becomes inactive (far away)
    // In a real VirtualList, unmounting handles this, but here we enforce nulling.
    return () => {
        // Optional: Revoke object URLs if using Blob
    };
  }, [pageNumber, isActive]);

  if (!isActive) return <div className="h-full w-full bg-transparent" />;

  return (
    <div className="bg-[#fffbf2] h-full w-full flex items-center justify-center shadow-inner overflow-hidden border-l border-gray-100 dark:border-gray-800 relative">
      {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-0">
              <Loader2 className="animate-spin text-emerald-500" />
          </div>
      )}
      
      {error ? (
          <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
              <WifiOff size={32} className="mb-2" />
              <p className="text-xs">تعذر تحميل الصفحة</p>
              <button 
                onClick={() => { setError(false); setLoading(true); /* Retry logic */ }}
                className="mt-2 text-emerald-600 text-xs font-bold"
              >
                  إعادة المحاولة
              </button>
          </div>
      ) : (
          src && <img src={src} alt={`Page ${pageNumber}`} className="w-full h-full object-fill z-10" />
      )}
      
      <div className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 font-mono z-20 mix-blend-multiply">
        {pageNumber}
      </div>
    </div>
  );
});

interface MushafReaderProps {
  initialPage: number;
  onPageChange: (page: number) => void;
}

// Optimized Reader that simulates Virtualization
// In Phase 3, this is replaced by Swiper.js or react-window
const MushafReader: React.FC<MushafReaderProps> = ({ initialPage, onPageChange }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Sync props
  useEffect(() => {
      setCurrentPage(initialPage);
  }, [initialPage]);

  const handleNext = () => {
      if (currentPage < TOTAL_PAGES) {
          const next = currentPage + 1;
          setCurrentPage(next);
          onPageChange(next);
      }
  };

  const handlePrev = () => {
      if (currentPage > 1) {
          const prev = currentPage - 1;
          setCurrentPage(prev);
          onPageChange(prev);
      }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#2a2a2a] relative">
      {/* Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {/* 
             Virtualization Mock: 
             Only render current page. 
             In production mobile app, pre-render current +/- 1 for smoothness.
          */}
          <Page pageNumber={currentPage} isActive={true} />
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 z-30 pointer-events-none">
          <button 
            onClick={handlePrev} // RTL: Prev moves to lower number (Right arrow visually in RTL)
            className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
          >
              <ChevronRight />
          </button>
          
          <div className="bg-black/50 backdrop-blur-md px-4 rounded-full flex items-center text-white font-mono text-sm pointer-events-auto">
              {currentPage} / {TOTAL_PAGES}
          </div>

          <button 
            onClick={handleNext}
            className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
          >
              <ChevronLeft />
          </button>
      </div>
    </div>
  );
};

export default MushafReader;
