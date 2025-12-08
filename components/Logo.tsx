
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32, color = "currentColor" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="شعار تطبيق نور"
    >
      {/* Outer Glow/Sun Shape (Optional based on variant, kept subtle here) */}
      <circle cx="50" cy="50" r="48" stroke={color} strokeWidth="4" strokeOpacity="0.1" />
      
      {/* The Bowl of the 'Noon' (Crescent-like) */}
      <path 
        d="M75 45C75 64.33 59.33 80 40 80C26.1929 80 15 68.8071 15 55C15 45 22 35 28 30" 
        stroke={color} 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* The Dot (Nuqta) - Stylized as a star/diamond */}
      <path 
        d="M50 35L54 42L62 42L56 48L58 56L50 51L42 56L44 48L38 42L46 42L50 35Z" 
        fill={color} 
      />
    </svg>
  );
};

export default Logo;
