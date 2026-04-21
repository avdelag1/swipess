import { useNotificationStore } from '@/state/notificationStore';

export function useToast() {
  const { addNotification } = useNotificationStore();
  
  const baseToast = ({ title, description, variant }: { title?: string, description?: string, variant?: string }) => {
    addNotification({
      type: variant === 'destructive' ? 'error' : (variant === 'success' ? 'success' : 'info'),
      title: title || 'Notification',
      message: description || ''
    });
    return { id: Math.random().toString(), dismiss: () => {}, update: () => {} };
  };

  const toastObj = Object.assign(baseToast, {
    success: (title: string, description?: string) => baseToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => baseToast({ title, description, variant: 'destructive' }),
    info: (title: string, description?: string) => baseToast({ title, description, variant: 'info' }),
  });

  return { toast: toastObj };
}

// Export a functional version for non-React context if possible, 
// though Zustand state is best used via the hook or getState()
export const toast = ({ title, description, variant }: any) => {
  useNotificationStore.getState().addNotification({
    type: variant === 'destructive' ? 'error' : 'info',
    title: title || 'Notification',
    message: description || ''
  });
};


