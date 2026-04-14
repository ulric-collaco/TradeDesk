import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED' | 'admin' | 'user';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border border-terminal-border text-text-secondary',
  PENDING:   'border border-status-pending/40  text-status-pending  bg-status-pending/10',
  EXECUTED:  'border border-status-executed/40 text-status-executed bg-status-executed/10',
  CANCELLED: 'border border-status-cancelled/40 text-status-cancelled bg-status-cancelled/10',
  REJECTED:  'border border-status-rejected/40 text-status-rejected bg-status-rejected/10',
  admin: 'border border-amber/40 text-amber bg-amber/10',
  user:  'border border-terminal-border text-text-secondary',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeVariant };
