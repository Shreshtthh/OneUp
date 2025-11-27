import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  glow?: boolean;
}

export function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  glow = true,
  className,
  disabled,
  ...props
}: NeonButtonProps) {
  const variants = {
    primary: 'from-ethereal-cyan to-ethereal-purple shadow-glow-cyan hover:shadow-glow-purple',
    secondary: 'from-ethereal-purple to-ethereal-rose shadow-glow-purple hover:shadow-glow-rose',
    danger: 'from-red-500 to-pink-500',
    success: 'from-green-400 to-emerald-500',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-10 py-4 text-lg',
  };

  return (
    <button
      className={cn(
        'button-ethereal relative overflow-hidden',
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        !disabled && !isLoading && 'hover:scale-105 active:scale-95',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
      
      {glow && !disabled && (
        <div className="absolute inset-0 shimmer opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </button>
  );
}
