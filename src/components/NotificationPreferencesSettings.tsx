import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, Zap, Shield, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationPreferencesSettingsProps {
    role: 'client' | 'owner';
}

export function NotificationPreferencesSettings({ role }: NotificationPreferencesSettingsProps) {
    // Normally this would be integrated with a database/context
    const [prefs, setPrefs] = useState({
        push: true,
        email: true,
        messages: true,
        likes: true,
        marketing: false,
        sound: true,
    });

    const toggle = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const sections = [
        {
            title: 'Global Delivery',
            items: [
                { id: 'push', label: 'Push Notifications', icon: Smartphone, desc: 'Real-time alerts on your device' },
                { id: 'email', label: 'Email Digest', icon: Mail, desc: 'Daily summary of missed activity' },
            ]
        },
        {
            title: 'Platform Activity',
            items: [
                { id: 'messages', label: 'Direct Messages', icon: Zap, desc: 'When you receive a new chat' },
                { id: 'likes', label: role === 'owner' ? 'New Interests' : 'New Connections', icon: Bell, desc: 'Updates on who likes you' },
            ]
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {sections.map((section) => (
                <div key={section.title} className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                        {section.title}
                    </h3>
                    <div className="grid gap-3">
                        {section.items.map((item) => (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <Card className="bg-black/20 border-white/5 hover:bg-black/30 transition-all overflow-hidden group">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#E4007C]/10 transition-colors">
                                                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-[#E4007C] transition-colors" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <Label htmlFor={item.id} className="text-base font-bold cursor-pointer">{item.label}</Label>
                                                <p className="text-xs text-muted-foreground/70 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id={item.id}
                                            checked={prefs[item.id as keyof typeof prefs]}
                                            onCheckedChange={() => toggle(item.id as keyof typeof prefs)}
                                            className="data-[state=checked]:bg-[#E4007C]"
                                        />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="pt-4 p-6 rounded-[2rem] bg-[#E4007C]/5 border border-[#E4007C]/10 space-y-3">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#E4007C]" />
                    <h4 className="text-xs font-black uppercase tracking-tight text-[#E4007C]">Intelligent Delivery</h4>
                </div>
                <p className="text-xs leading-relaxed text-[#E4007C]/80 font-bold">
                    Swipess uses adaptive scheduling to bundle notifications during your peak activity hours, minimizing digital noise while maximizing connection speed.
                </p>
            </div>
        </div>
    );
}
