
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
  showEnglish?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40, color = "currentColor", showEnglish = true }) => {
  return (
    <svg 
      width={size * (showEnglish ? 2.5 : 1.5)} 
      height={size} 
      viewBox={showEnglish ? "0 0 160 60" : "0 0 100 60"}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="شعار ريان"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2ECC71" />
          <stop offset="100%" stopColor="#16A085" />
        </linearGradient>
      </defs>
      
      {/* Arabic Text: Main Focus */}
      <text 
        x="50%" 
        y={showEnglish ? "45%" : "55%"} 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontFamily="IBM Plex Sans Arabic, sans-serif" 
        fontWeight="700" 
        fontSize="42" 
        fill={color === 'currentColor' ? color : "url(#logoGradient)"}
        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))' }}
      >
        رَيَّان
      </text>

      
    </svg>
  );
};

export default Logo;
