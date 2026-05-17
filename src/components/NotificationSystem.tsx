import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { NotificationBar } from './NotificationBar';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { AppNotification } from '@/state/notificationStore';

/**
 * GLOBAL NOTIFICATION SYSTEM
 * Renders the top NotificationBar. Only NEW notifications (arrived after mount,
 * or within the last 15s before mount) appear as banners — historical ones
 * stay quietly in the Notifications page.
 */
export function NotificationSystem() {
    const {
        notifications,
        markAllAsRead,
        handleNotificationClick
    } = useNotificationSystem();

    const [bannerSeen, setBannerSeen] = useState<Set<string>>(new Set());
    const mountTimeRef = useRef<number>(Date.now());

    // Auto-suppress historical notifications so the banner doesn't get stuck
    useEffect(() => {
        const cutoff = mountTimeRef.current - 15_000;
        const stale = notifications.filter(n => {
            const ts = n.timestamp instanceof Date ? n.timestamp.getTime() : new Date(n.timestamp as any).getTime();
            return ts < cutoff && !bannerSeen.has(n.id);
        });
        if (stale.length > 0) {
            setBannerSeen(prev => {
                const next = new Set(prev);
                stale.forEach(n => next.add(n.id));
                return next;
            });
        }
    }, [notifications, bannerSeen]);

    const visibleForBanner = useMemo(
        () => notifications.filter(n => !bannerSeen.has(n.id) && !n.read),
        [notifications, bannerSeen]
    );

    const handleBannerDismiss = useCallback((_id: string) => {
        // Consolidate: mark every currently unread as banner-seen so we don't
        // cycle through dozens one-by-one.
        setBannerSeen(prev => {
            const next = new Set(prev);
            notifications.forEach(n => { if (!n.read) next.add(n.id); });
            return next;
        });
    }, [notifications]);

    const handleClick = useCallback((notif: AppNotification) => {
        handleNotificationClick(notif);
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
