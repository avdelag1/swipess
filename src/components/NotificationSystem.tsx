import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationBar } from './NotificationBar';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { AppNotification } from '@/state/notificationStore';
import { useNotificationStore } from '@/state/notificationStore';
import { showOsNotification } from '@/utils/osNotifications';
import { useAppNavigate } from '@/hooks/useAppNavigate';

/**
 * GLOBAL NOTIFICATION SYSTEM
 * Renders the top NotificationBar. Only NEW notifications (arrived after mount,
 * or within the last 15s before mount) appear as banners — historical ones
 * stay quietly in the Notifications page.
 *
 * Also bridges Service Worker push → in-app banner + tap navigation so
 * installed PWA / iOS Home Screen apps actually pop alerts.
 */
export function NotificationSystem() {
    const {
        notifications,
        markAllAsRead,
        handleNotificationClick
    } = useNotificationSystem();

    const { navigate } = useAppNavigate();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const [bannerSeen, setBannerSeen] = useState<Set<string>>(new Set());
    const mountTimeRef = useRef<number>(Date.now());
    const osNotifiedRef = useRef<Set<string>>(new Set());

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

    // When app/tab is in background, also fire OS phone notifications
    useEffect(() => {
        const fresh = notifications.filter(n => {
            if (n.read || bannerSeen.has(n.id) || osNotifiedRef.current.has(n.id)) return false;
            const ts = n.timestamp instanceof Date ? n.timestamp.getTime() : new Date(n.timestamp as any).getTime();
            return ts >= mountTimeRef.current - 15_000;
        });
        fresh.forEach((n) => {
            osNotifiedRef.current.add(n.id);
            void showOsNotification({
                title: n.title || 'Swipess',
                body: n.message || '',
                url: n.actionUrl || '/notifications',
                tag: `inapp-${n.id}`,
            });
        });
    }, [notifications, bannerSeen]);

    // Service worker → in-app popup + tap-to-open (critical for iOS PWA)
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

        const onMessage = (event: MessageEvent) => {
            const msg = event.data;
            if (!msg || typeof msg !== 'object') return;

            if (msg.type === 'PUSH_RECEIVED') {
                const id = `push-${msg.data?.notification_id || msg.tag || Date.now()}`;
                if (osNotifiedRef.current.has(id)) return;
                osNotifiedRef.current.add(id);

                addNotification({
                    id,
                    type: (msg.data?.type as AppNotification['type']) || 'info',
                    title: msg.title || 'Swipess',
                    message: msg.body || '',
                    timestamp: new Date(),
                    read: false,
                    actionUrl: msg.url || msg.data?.url || '/notifications',
                    metadata: msg.data || {},
                });
            }

            if (msg.type === 'NOTIFICATION_CLICK') {
                const target = typeof msg.url === 'string' && msg.url.startsWith('/')
                    ? msg.url
                    : '/notifications';
                try {
                    localStorage.setItem('swipess_pending_notif_url', target);
                } catch { /* ignore */ }
                navigate(target);
            }
        };

        navigator.serviceWorker.addEventListener('message', onMessage);
        return () => navigator.serviceWorker.removeEventListener('message', onMessage);
    }, [addNotification, navigate]);

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
