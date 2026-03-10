import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Heart, Home, Bike, Car, Ship, Sparkles, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPreferences {
    client_interested?: boolean;
    listing_interested?: boolean;
    moto_interested?: boolean;
    bike_interested?: boolean;
    yacht_interested?: boolean;
}

export const NotificationPreferencesSettings = ({ role }: { role: 'client' | 'owner' }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile-preferences', user?.id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('notification_preferences')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const updatePreferencesMutation = useMutation({
        mutationFn: async (newPrefs: NotificationPreferences) => {
            const { error } = await (supabase as any)
                .from('profiles')
                .update({ notification_preferences: newPrefs })
                .eq('id', user!.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile-preferences', user?.id] });
            toast.success("Notification preferences updated");
        },
        onError: () => {
            toast.error("Failed to update preferences");
        }
    });

    if (isLoading) return <div className="h-20 animate-pulse bg-muted rounded-xl" />;

    const prefs: NotificationPreferences = (profile?.notification_preferences as any) || {
        client_interested: true,
        listing_interested: true,
        moto_interested: true,
        bike_interested: true,
        yacht_interested: true
    };

    const togglePreference = (key: keyof NotificationPreferences) => {
        updatePreferencesMutation.mutate({
            ...prefs,
            [key]: !prefs[key]
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Smart Notifications</h3>
            </div>

            <div className="space-y-4">
                {role === 'client' && (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                        <div className="space-y-1">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <Heart className="w-4 h-4 text-pink-500" />
                                Someone liked your profile
                            </Label>
                            <p className="text-xs text-muted-foreground italic">Get notified when an owner wants to connect</p>
                        </div>
                        <Switch
                            checked={prefs.client_interested !== false}
                            onCheckedChange={() => togglePreference('client_interested')}
                        />
                    </div>
                )}

                {role === 'owner' && (
                    <>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Home className="w-4 h-4 text-orange-500" />
                                    Listing Interest
                                </Label>
                                <p className="text-xs text-muted-foreground italic">Notifications for property likes</p>
                            </div>
                            <Switch
                                checked={prefs.listing_interested !== false}
                                onCheckedChange={() => togglePreference('listing_interested')}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border opacity-80">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Car className="w-4 h-4 text-blue-500" />
                                    Moto Interest
                                </Label>
                                <p className="text-xs text-muted-foreground italic">Notifications for motorcycle likes</p>
                            </div>
                            <Switch
                                checked={prefs.moto_interested !== false}
                                onCheckedChange={() => togglePreference('moto_interested')}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border opacity-80">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Bike className="w-4 h-4 text-green-500" />
                                    Bike Interest
                                </Label>
                                <p className="text-xs text-muted-foreground italic">Notifications for bicycle likes</p>
                            </div>
                            <Switch
                                checked={prefs.bike_interested !== false}
                                onCheckedChange={() => togglePreference('bike_interested')}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border opacity-80">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Ship className="w-4 h-4 text-cyan-500" />
                                    Yacht Interest
                                </Label>
                                <p className="text-xs text-muted-foreground italic">Notifications for yacht likes</p>
                            </div>
                            <Switch
                                checked={prefs.yacht_interested !== false}
                                onCheckedChange={() => togglePreference('yacht_interested')}
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">Device Notifications</h3>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="space-y-1">
                        <Label className="text-sm font-bold flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" />
                            Real-time Push
                        </Label>
                        <p className="text-xs text-muted-foreground italic">Receive alerts on this device even when the app is closed</p>
                    </div>
                    {isSupported ? (
                        <Switch
                            checked={isSubscribed}
                            disabled={updatePreferencesMutation.isPending}
                            onCheckedChange={async (checked) => {
                                if (checked) {
                                    const success = await subscribe();
                                    if (success) toast.success("Push notifications enabled!");
                                } else {
                                    const success = await unsubscribe();
                                    if (success) toast.info("Push notifications disabled");
                                }
                            }}
                        />
                    ) : (
                        <div className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-border">
                            Not supported
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex gap-3 items-start">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                    <strong>Pro Tip:</strong> We intelligently filter notifications to ensure you only get notified about high-quality interests that match your profile visibility.
                </p>
            </div>
        </div>
    );
};
