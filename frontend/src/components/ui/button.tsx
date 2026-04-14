import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'amber';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

    const variants: Record<string, string> = {
      default: 'bg-terminal-elevated border border-terminal-border text-text-primary hover:border-amber/50',
      destructive: 'bg-transparent border border-status-rejected/40 text-status-rejected hover:bg-status-rejected/10',
      outline: 'border border-terminal-border text-text-secondary hover:text-text-primary hover:border-terminal-border',
      ghost: 'text-text-secondary hover:text-text-primary hover:bg-terminal-elevated',
      amber: 'bg-amber text-terminal-base font-mono font-semibold tracking-widest uppercase hover:bg-amber/90',
    };

    const sizes: Record<string, string> = {
      default: 'h-9 px-4 py-2 text-sm rounded',
      sm: 'h-7 px-3 text-xs rounded-sm',
      lg: 'h-11 px-6 text-sm rounded',
      icon: 'h-9 w-9 rounded',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
