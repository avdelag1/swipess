import React from 'react';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/utils/microPolish';

export function ActivityFeed() {
    const { notifications, handleNotificationClick } = useNotificationSystem();
    const navigate = useNavigate();

    // Only show top 5 relevant activity items
    const relevantNotifs = notifications
        .filter(n => ['match', 'message', 'like', 'super_like'].includes(n.type))
        .slice(0, 5);

    if (relevantNotifs.length === 0) {
        return (
            <Card className="border-dashed border-border bg-muted/30 rounded-[2rem] overflow-hidden">
                <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                        <Sparkles className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Silence is Golden</h4>
                    <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed font-medium">
                        Explore, like and connect. New activity will manifest here.
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                >
                    <Card
                        className={cn(
                            "group relative overflow-hidden border-border bg-card rounded-[1.5rem] transition-all hover:bg-muted/50 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md",
                            !notif.read && "border-l-4 border-l-brand-accent-2 ring-1 ring-brand-accent-2/10 shadow-brand-accent-2/5"
                        )}
                        onClick={() => {
                            haptics.tap();
                            handleNotificationClick(notif);
                        }}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            {/* Profile/Icon */}
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12 border border-border/40 shadow-sm transition-transform group-hover:scale-105">
                                    <AvatarImage src={notif.avatar} className="object-cover" />
                                    <AvatarFallback className="bg-gradient-to-br from-muted to-muted/30 text-muted-foreground font-black">
                                        {notif.type === 'match' ? '🔥' : notif.type === 'message' ? '💬' : '❤️'}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Type Badge Overlay */}
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 p-1 rounded-full shadow-lg border border-background scale-90",
                                    notif.type === 'match' ? "bg-brand-accent-2" : notif.type === 'message' ? "bg-brand-primary" : "bg-brand-accent-2"
                                )}>
                                    {notif.type === 'match' ? <Sparkles className="w-2.5 h-2.5 text-white" /> :
                                        notif.type === 'message' ? <MessageSquare className="w-2.5 h-2.5 text-white" /> :
                                            <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />}
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[13px] font-black text-foreground truncate group-hover:text-brand-accent-2 transition-colors tracking-tight">
                                        {notif.title}
                                    </span>
                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-muted-foreground/50 shrink-0 bg-muted/40 px-1.5 py-0.5 rounded-full">
                                        <Clock className="w-2 h-2" />
                                        {formatDistanceToNow(notif.timestamp, { addSuffix: true }).replace('about ', '')}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground/80 line-clamp-1 leading-snug font-medium">
                                    {notif.message}
                                </p>
                            </div>

                            {/* Chevron */}
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                        </CardContent>
                    </Card>
                </motion.div>
            ))}

            {/* View All Button */}
            <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition-all hover:text-foreground mt-4 shadow-sm"
                onClick={() => {
                    haptics.tap();
                    navigate('/notifications');
                }}
            >
                View Manifest Activity
            </Button>
        </div>
    );
}


