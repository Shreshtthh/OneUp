import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, glowColor, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "backdrop-blur-md rounded-xl border transition-all duration-300 hover:scale-[1.02]",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        background: 'rgba(13, 13, 13, 0.7)',
        borderColor: glowColor || 'rgba(255, 255, 255, 0.1)',
        boxShadow: glowColor ? `0 0 20px ${glowColor}40` : 'none',
      }}
    >
      {children}
    </div>
  );
}
