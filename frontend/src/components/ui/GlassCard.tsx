import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'cyan' | 'purple' | 'rose' | 'none';
  hover?: boolean;
}

export function GlassCard({ children, className, glow = 'none', hover = true }: GlassCardProps) {
  const glowClasses = {
    cyan: 'shadow-glow-cyan',
    purple: 'shadow-glow-purple',
    rose: 'shadow-glow-rose',
    none: '',
  };

  return (
    <div
      className={cn(
        'glass-card',
        hover && 'hover:-translate-y-1 hover:shadow-2xl transition-all duration-300',
        glow !== 'none' && glowClasses[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
