import { useNotificationStore } from '@/state/notificationStore';

export function useToast() {
  const { addNotification } = useNotificationStore();
  
  const toastWrapper = ({ title, description, variant }: { title?: string, description?: string, variant?: string }) => {
    addNotification({
      type: variant === 'destructive' ? 'error' : 'info',
      title: title || 'Notification',
      message: description || ''
    });
    return { id: Math.random().toString(), dismiss: () => {}, update: () => {} };
  };

  return { toast: toastWrapper };
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
