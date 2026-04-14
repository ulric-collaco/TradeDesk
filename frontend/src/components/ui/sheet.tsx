import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/70 backdrop-blur-sm', className)}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const sideClasses: Record<NonNullable<SheetContentProps['side']>, string> = {
  top: 'inset-x-0 top-0 border-b border-terminal-border',
  bottom: 'inset-x-0 bottom-0 border-t border-terminal-border rounded-t-lg',
  left: 'inset-y-0 left-0 w-72 border-r border-terminal-border',
  right: 'inset-y-0 right-0 w-[420px] border-l border-terminal-border',
};

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 bg-terminal-panel p-6 overflow-y-auto',
        sideClasses[side],
        className
      )}
      {...props}
    >
      <SheetClose className="absolute right-4 top-4 text-text-muted hover:text-text-primary transition-colors">
        <X className="h-4 w-4" />
      </SheetClose>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 mb-6', className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('font-mono text-sm font-semibold text-text-primary tracking-widest uppercase', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle };
