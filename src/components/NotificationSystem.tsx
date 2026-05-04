import { useState, useMemo, useCallback } from 'react';
import { NotificationBar } from './NotificationBar';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Notification } from '@/state/notificationStore';

/**
 * GLOBAL NOTIFICATION SYSTEM
 * Handles real-time notifications for likes, matches, and messages
 * Renders the premium NotificationBar at the top of the screen
 */
export function NotificationSystem() {
    const {
        notifications,
        markAllAsRead,
        handleNotificationClick
    } = useNotificationSystem();

    // Local "banner seen" set — dismissing the top banner does NOT delete
    // the notification from the store/DB; it just hides it from the popup.
    // The notifications still appear in the Notifications page.
    const [bannerSeen, setBannerSeen] = useState<Set<string>>(new Set());

    const visibleForBanner = useMemo(
        () => notifications.filter(n => !bannerSeen.has(n.id)),
        [notifications, bannerSeen]
    );

    // Dismissing the banner consolidates: mark ALL currently-unread as seen
    // so we don't cycle through them one-by-one.
    const handleBannerDismiss = useCallback((_id: string) => {
        setBannerSeen(prev => {
            const next = new Set(prev);
            notifications.forEach(n => { if (!n.read) next.add(n.id); });
            return next;
        });
    }, [notifications]);

    const handleClick = useCallback((notif: Notification) => {
        handleNotificationClick(notif);
        // Also mark all as seen locally so the banner closes
        handleBannerDismiss(notif.id);
    }, [handleNotificationClick, handleBannerDismiss]);

    return (
        <NotificationBar
            notifications={visibleForBanner}
            onDismiss={handleBannerDismiss}
            onMarkAllRead={markAllAsRead}
            onNotificationClick={handleClick}
        />
    );
}


