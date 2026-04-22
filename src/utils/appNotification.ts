/**
 * Unified App Notification System
 * 
 * Routes ALL app feedback through the premium NotificationBar (top banner, slide left→right).
 * Replaces sonner toasts entirely.
 */
import { useNotificationStore, NotificationType } from '@/state/notificationStore';

interface AppNotification {
  type?: NotificationType;
  title: string;
  message?: string;
}

/**
 * Show a premium top-banner notification.
 * Can be called from anywhere — React components or plain functions.
 */
export function showAppNotification({ type = 'info', title, message = '' }: AppNotification) {
  useNotificationStore.getState().addNotification({
    type,
    title,
    message,
  });
}

// Convenience shortcuts
export const appToast = {
  success: (title: string, message?: string) =>
    showAppNotification({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    showAppNotification({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    showAppNotification({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    showAppNotification({ type: 'info', title, message }),
  like: (title: string, message?: string) =>
    showAppNotification({ type: 'like', title, message }),
  match: (title: string, message?: string) =>
    showAppNotification({ type: 'match', title, message }),
  message: (title: string, message?: string) =>
    showAppNotification({ type: 'message', title, message }),
};


