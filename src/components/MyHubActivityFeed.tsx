import React from 'react';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Heart, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/utils/microPolish';

export function MyHubActivityFeed() {
    const { notifications, handleNotificationClick } = useNotificationSystem();
    const navigate = useNavigate();

    // Filter for most relevant 'Marketplace' notifications
    const relevantNotifs = notifications
        .filter(n => ['match', 'message', 'like'].includes(n.type))
        .slice(0, 5);

    if (relevantNotifs.length === 0) {
        return (
            <Card className="border-dashed border-white/5 bg-white/[0.02] rounded-[2rem]">
                <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <Sparkles className="w-8 h-8 text-white/20" />
                    </div>
                    <h4 className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">No Activity Yet</h4>
                    <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">
                        Swipe to find matches and start seeing updates here.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {relevantNotifs.map((notif, i) => (
                <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <Card
                        className={cn(
                            "group relative overflow-hidden border-white/5 bg-black/40 backdrop-blur-3xl rounded-[1.5rem] transition-all hover:bg-white/[0.03] active:scale-[0.98] cursor-pointer",
                            !notif.read && "border-l-4 border-l-brand-accent-2"
                        )}
                        onClick={() => {
                            haptics.tap();
                            handleNotificationClick(notif);
                        }}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            {/* Profile/Icon */}
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12 border border-white/10 ring-2 ring-black/20">
                                    <AvatarImage src={notif.avatar} className="object-cover" />
                                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-black">
                                        {notif.type === 'match' ? '🔥' : notif.type === 'message' ? '💬' : '❤️'}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Type Badge Overlay */}
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 p-1 rounded-full shadow-lg border border-black/50",
                                    notif.type === 'match' ? "bg-brand-accent-2" : notif.type === 'message' ? "bg-brand-primary" : "bg-brand-accent-2"
                                )}>
                                    {notif.type === 'match' ? <Sparkles className="w-2.5 h-2.5 text-white" /> :
                                        notif.type === 'message' ? <MessageSquare className="w-2.5 h-2.5 text-white" /> :
                                            <Heart className="w-2.5 h-2.5 text-white fill-white" />}
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-black text-white truncate group-hover:text-brand-accent-2 transition-colors">
                                        {notif.title}
                                    </span>
                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-muted-foreground/40 shrink-0">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatDistanceToNow(notif.timestamp, { addSuffix: true }).replace('about ', '')}
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                                    {notif.message}
                                </p>
                            </div>

                            {/* Chevron */}
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                        </CardContent>
                    </Card>
                </motion.div>
            ))}

            {/* View All Button */}
            <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition-all hover:text-white mt-4"
                onClick={() => {
                    haptics.tap();
                    navigate('/notifications');
                }}
            >
                View All Activity
            </Button>
        </div>
    );
}
