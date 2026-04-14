import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

type ToasterToast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
};

type ToastInput = Omit<ToasterToast, 'id'>;

const listeners: Array<(toasts: ToasterToast[]) => void> = [];
let toastStore: ToasterToast[] = [];

function dispatch(toasts: ToasterToast[]) {
  toastStore = toasts;
  listeners.forEach((l) => l(toasts));
}

let counter = 0;
function genId() {
  return `toast-${++counter}`;
}

export function toast(input: ToastInput) {
  const id = genId();
  const newToast: ToasterToast = { ...input, id };
  dispatch([...toastStore, newToast]);

  setTimeout(() => {
    dispatch(toastStore.filter((t) => t.id !== id));
  }, 3000);

  return id;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>(toastStore);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return { toasts, toast };
}
