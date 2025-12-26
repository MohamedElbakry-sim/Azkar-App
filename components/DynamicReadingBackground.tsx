
import React, { useMemo } from 'react';
import { getTimePeriod, TimePeriod } from '../utils';

interface DynamicReadingBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
}

const DynamicReadingBackground: React.FC<DynamicReadingBackgroundProps> = ({ intensity = 'medium' }) => {
  const period = useMemo(() => getTimePeriod(), []);
  
  const getColors = (p: TimePeriod) => {
    switch (p) {
      case 'dawn':
        return {
          primary: 'from-orange-200/40',
          secondary: 'via-rose-100/30',
          accent: 'to-amber-50/20',
          dots: 'text-orange-300/20'
        };
      case 'day':
        return {
          primary: 'from-sky-100/40',
          secondary: 'via-blue-50/30',
          accent: 'to-white/20',
          dots: 'text-blue-200/20'
        };
      case 'sunset':
        return {
          primary: 'from-indigo-500/20',
          secondary: 'via-purple-500/20',
          accent: 'to-orange-400/20',
          dots: 'text-purple-300/10'
        };
      case 'night':
      default:
        return {
          primary: 'from-[#0f172a]/40',
          secondary: 'via-[#1e1b4b]/30',
          accent: 'to-[#312e81]/20',
          dots: 'text-indigo-400/5'
        };
    }
  };

  const colors = getColors(period);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Primary Gradient Base */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.primary} ${colors.secondary} ${colors.accent} transition-colors duration-[3000ms]`} />

      {/* Shifting Aura Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-current opacity-20 blur-[120px] animate-pulse transition-colors duration-[5000ms]" 
           style={{ color: period === 'dawn' ? '#fed7aa' : period === 'day' ? '#bae6fd' : period === 'sunset' ? '#c084fc' : '#4338ca' }} />
      
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-current opacity-15 blur-[100px] animate-pulse transition-colors duration-[7000ms]"
           style={{ color: period === 'dawn' ? '#fde68a' : period === 'day' ? '#e0f2fe' : period === 'sunset' ? '#fb923c' : '#312e81', animationDelay: '2s' }} />

      {/* Subtle Pattern Overlay */}
      <div className={`absolute inset-0 opacity-30 mix-blend-overlay ${colors.dots}`}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="spiritual-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#spiritual-dots)" />
        </svg>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spiritual-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, 5%) scale(1.1); }
        }
        .animate-pulse {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default DynamicReadingBackground;
