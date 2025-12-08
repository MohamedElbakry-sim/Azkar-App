
import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation after 2 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 2000);

    // Unmount component after animation finishes (2s + 600ms transition)
    const unmountTimer = setTimeout(() => {
      onFinish();
    }, 2600);

    return () => {
      clearTimeout(timer);
      clearTimeout(unmountTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className={`
        fixed inset-0 z-[100] flex flex-col items-center justify-center
        bg-gradient-to-br from-[#2ECC71] via-[#1ABC9C] to-[#16A085]
        transition-all duration-700 ease-in-out
        ${isExiting ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      {/* Decorative Background Pattern (Subtle) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="currentColor" className="text-white" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with Glow */}
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 animate-pulse"></div>
            <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-emerald-900/20 relative animate-popIn">
                <Logo size={100} className="text-primary-600" />
            </div>
        </div>

        {/* Tagline */}
        <p className="text-emerald-50 text-lg font-medium opacity-90 animate-slideUp" style={{ animationDelay: '400ms' }}>
          رفيقك اليومي في الذكر
        </p>

        {/* Loading Indicator */}
        <div className="mt-12 flex gap-2 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-8 text-emerald-100/60 text-xs font-sans">
        v1.4.0
      </div>
    </div>
  );
};

export default SplashScreen;