
import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, className = '', position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`
            absolute left-1/2 transform -translate-x-1/2 px-3 py-1.5 
            bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 
            text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-[60] animate-fadeIn 
            border border-white/10 dark:border-gray-900/10 pointer-events-none
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
          role="tooltip"
        >
          {text}
          <div 
            className={`
              absolute left-1/2 transform -translate-x-1/2 -mt-px border-4 border-transparent
              ${position === 'top' 
                ? 'top-full border-t-gray-900/95 dark:border-t-white/95' 
                : 'bottom-full border-b-gray-900/95 dark:border-b-white/95'}
            `}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
