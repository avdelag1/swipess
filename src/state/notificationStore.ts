import { create } from 'zustand';

export type NotificationType = 'like' | 'message' | 'super_like' | 'match' | 'new_user' | 'premium_purchase' | 'activation_purchase' | 'info' | 'success' | 'error' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  relatedUserId?: string;
  conversationId?: string;
  metadata?: {
    role?: 'client' | 'owner';
    targetType?: 'listing' | 'profile';
    [key: string]: any;
  };
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Partial<Notification>) => void;
  dismissNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  
  addNotification: (notification) => set((state) => {
    const id = notification.id || Math.random().toString(36).substring(2, 9);
    
    // 🛡️ DEDUPLICATION: Don't add if already exists
    if (state.notifications.some(n => n.id === id)) return state;

    const newNotif: Notification = {
      id,
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      message: notification.message || '',
      timestamp: notification.timestamp || new Date(),
      read: false,
      ...notification
    } as Notification;
    
    return {
      notifications: [newNotif, ...state.notifications].slice(0, 50)
    };
  }),
  
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true }))
  })),
  
  clearAll: () => set({ notifications: [] })
}));

