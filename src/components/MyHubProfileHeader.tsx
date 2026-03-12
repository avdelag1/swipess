import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    User,
    MapPin,
    Star,
    Camera,
    ChevronRight,
    Sparkles,
    Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/utils/microPolish';

export function MyHubProfileHeader() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: clientProfile } = useClientProfile();
    const { data: ownerProfile } = useOwnerProfile();

    // Combine data for a unified "Presentable" Profile
    const profile = {
        name: clientProfile?.name || ownerProfile?.business_name || user?.email?.split('@')[0] || 'Explorer',
        avatar: clientProfile?.profile_images?.[0] || ownerProfile?.profile_images?.[0],
        bio: clientProfile?.bio || ownerProfile?.business_description || 'No bio set',
        location: clientProfile?.city || clientProfile?.country || ownerProfile?.business_location || 'Everywhere',
        completion: calculateCompletion(clientProfile, ownerProfile),
    };

    function calculateCompletion(c: any, o: any) {
        let score = 0;
        if (c?.name || o?.full_name) score += 20;
        if (c?.bio || o?.bio) score += 20;
        if (c?.profile_images?.length || o?.profile_images?.length) score += 40;
        if (c?.interests?.length || o?.contact_info) score += 20;
        return score;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-6 group"
        >
            {/* Dynamic Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent-2/20 to-brand-primary/20 rounded-[2rem] blur-2xl group-hover:opacity-100 transition-opacity opacity-50" />

            <Card className="relative overflow-hidden border-white/5 bg-black/40 backdrop-blur-3xl rounded-[1.8rem]">
                <CardContent className="p-6">
                    <div className="flex items-center gap-5">
                        {/* Avatar with Status Ring */}
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent-2 to-brand-primary rounded-full animate-spin-slow opacity-20" />
                            <Avatar className="h-20 w-20 border-2 border-white/10 ring-4 ring-black/20">
                                <AvatarImage src={profile.avatar} className="object-cover" />
                                <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-black text-xl">
                                    {profile.name[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="absolute -bottom-1 -right-1 bg-brand-accent-2 text-white p-1.5 rounded-full shadow-lg">
                                <Camera className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-black text-white truncate">
                                    {profile.name}
                                </h2>
                                <Badge className="bg-brand-accent-2/20 text-brand-accent-2 border-none hover:bg-brand-accent-2/30 px-2 py-0 h-5 text-[10px] font-black uppercase">
                                    Verified
                                </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-brand-accent-2" />
                                    {profile.location}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    4.9
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] uppercase font-black tracking-wider">
                                    <span className="text-muted-foreground/80">Listing Completion</span>
                                    <span className="text-brand-accent-2">{profile.completion}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${profile.completion}%` }}
                                        className="h-full bg-gradient-to-r from-brand-accent-2 to-brand-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Edit Button */}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-90 transition-all"
                            onClick={() => {
                                haptics.tap();
                                navigate('/client/profile'); // Or unified profile
                            }}
                        >
                            <ChevronRight className="w-5 h-5 text-white/50" />
                        </Button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                            { label: 'Connections', value: '24', icon: User, color: 'text-blue-400' },
                            { label: 'Activity', value: 'High', icon: Zap, color: 'text-amber-400' },
                            { label: 'Matches', value: '12', icon: Sparkles, color: 'text-brand-accent-2' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                                <stat.icon className={cn("w-4 h-4 mx-auto mb-1.5", stat.color)} />
                                <div className="text-sm font-black text-white leading-none mb-1">{stat.value}</div>
                                <div className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-none">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
