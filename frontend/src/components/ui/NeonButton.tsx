import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'blue' | 'pink' | 'green' | 'red';
  isLoading?: boolean;
}

export function NeonButton({ 
  children, 
  variant = 'blue', 
  isLoading, 
  className,
  ...props 
}: NeonButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const colors = {
    blue: {
      bg: 'linear-gradient(135deg, #00f0ff 0%, #0099cc 100%)',
      bgHover: 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%)',
      shadow: '0 0 20px rgba(0, 240, 255, 0.5)',
      shadowHover: '0 0 30px rgba(255, 0, 255, 0.6), 0 0 60px rgba(0, 240, 255, 0.4)',
    },
    pink: {
      bg: 'linear-gradient(135deg, #ff00ff 0%, #cc0099 100%)',
      bgHover: 'linear-gradient(135deg, #ff00ff 0%, #00f0ff 100%)',
      shadow: '0 0 20px rgba(255, 0, 255, 0.5)',
      shadowHover: '0 0 30px rgba(0, 240, 255, 0.6), 0 0 60px rgba(255, 0, 255, 0.4)',
    },
    green: {
      bg: 'linear-gradient(135deg, #00ff00 0%, #009900 100%)',
      bgHover: 'linear-gradient(135deg, #00ff00 0%, #00f0ff 100%)',
      shadow: '0 0 20px rgba(0, 255, 0, 0.5)',
      shadowHover: '0 0 30px rgba(0, 240, 255, 0.6), 0 0 60px rgba(0, 255, 0, 0.4)',
    },
    red: {
      bg: 'linear-gradient(135deg, #ff0040 0%, #cc0033 100%)',
      bgHover: 'linear-gradient(135deg, #ff0040 0%, #ff00ff 100%)',
      shadow: '0 0 20px rgba(255, 0, 64, 0.5)',
      shadowHover: '0 0 30px rgba(255, 0, 255, 0.6), 0 0 60px rgba(255, 0, 64, 0.4)',
    },
  };

  const color = colors[variant];

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      className={cn(
        "group relative px-8 py-4 font-bold rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{
        background: isHovered ? color.bgHover : color.bg,
        boxShadow: isHovered ? color.shadowHover : color.shadow,
      }}
      {...props}
    >
      <span className="relative z-10 text-black flex items-center justify-center gap-2">
        {isLoading && (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </span>
      
      {/* Shine effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
          transform: 'translateX(-100%)',
          animation: 'shine 3s infinite',
        }}
      />
    </button>
  );
}
