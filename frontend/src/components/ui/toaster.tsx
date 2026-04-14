import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast';
import { useToast } from '@/hooks/useToast';

export function Toaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          <div className="flex-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
