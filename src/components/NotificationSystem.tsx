import { NotificationBar } from './NotificationBar';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

/**
 * GLOBAL NOTIFICATION SYSTEM
 * Handles real-time notifications for likes, matches, and messages
 * Renders the premium NotificationBar at the top of the screen
 */
export function NotificationSystem() {
    const {
        notifications,
        dismissNotification,
        markAllAsRead,
        handleNotificationClick
    } = useNotificationSystem();

    return (
        <NotificationBar
            notifications={notifications}
            onDismiss={dismissNotification}
            onMarkAllRead={markAllAsRead}
            onNotificationClick={handleNotificationClick}
        />
    );
}


