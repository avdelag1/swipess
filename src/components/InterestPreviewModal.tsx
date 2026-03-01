import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MessageCircle, Home, Bike, Car, Ship, Briefcase,
    Settings, User, MapPin, DollarSign, Info, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

interface InterestPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    likerId: string; // The person who liked you
    targetId?: string; // Optional listing ID if they liked a specific listing
    targetType: 'listing' | 'profile';
    onMessageInitiated?: (conversationId: string) => void;
}

export const InterestPreviewModal: React.FC<InterestPreviewModalProps> = ({
    isOpen,
    onClose,
    likerId,
    targetId,
    targetType,
    onMessageInitiated
}) => {
    const { user } = useAuth();
    const [isInitializing, setIsInitializing] = React.useState(false);

    // Fetch Liker's Profile
    const { data: likerProfile, isLoading: profileLoading } = useQuery({
        queryKey: ['liker-profile', likerId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', likerId)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: isOpen && !!likerId,
    });

    // Fetch specialized profile data (Client vs Owner)
    const { data: specializedProfile } = useQuery({
        queryKey: ['specialized-profile', likerId],
        queryFn: async () => {
            // Try both, see what returns
            const [clientRes, ownerRes] = await Promise.all([
                supabase.from('client_profiles').select('*').eq('user_id', likerId).maybeSingle(),
                supabase.from('owner_profiles').select('*').eq('user_id', likerId).maybeSingle()
            ]);
            return { client: clientRes.data, owner: ownerRes.data };
        },
        enabled: isOpen && !!likerId,
    });

    // Fetch Liker's Active Offerings (if they are an Owner)
    const { data: offerings } = useQuery({
        queryKey: ['liker-offerings', likerId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('owner_id', likerId)
                .eq('is_active', true)
                .limit(6);
            if (error) throw error;
            return data;
        },
        enabled: isOpen && !!likerId,
    });

    // Fetch Liker's Preferences (if they are a Client)
    const { data: preferences } = useQuery({
        queryKey: ['liker-preferences', likerId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('client_filter_preferences')
                .select('*')
                .eq('user_id', likerId)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: isOpen && !!likerId,
    });

    const handleStartChat = async () => {
        if (!user || isInitializing) return;
        setIsInitializing(true);

        try {
            const { data, error } = await supabase.functions.invoke('initialize-conversation', {
                body: {
                    other_user_id: likerId,
                    listing_id: targetId,
                    initial_message: `Hi ${likerProfile?.full_name || ''}! I saw you were interested in my ${targetType === 'listing' ? 'listing' : 'profile'}. Let's chat!`
                }
            });

            if (error) {
                if (error.message?.includes('INSUFFICIENT_TOKENS')) {
                    toast.error("Insufficient Tokens", {
                        description: "You need 1 token to start this conversation."
                    });
                } else {
                    throw error;
                }
                return;
            }

            toast.success("Conversation started!");
            if (onMessageInitiated && data.conversation_id) {
                onMessageInitiated(data.conversation_id);
            }
            onClose();
        } catch (err) {
            logger.error('Error initializing conversation:', err);
            toast.error("Failed to start conversation");
        } finally {
            setIsInitializing(false);
        }
    };

    if (!isOpen) return null;

    const isOwner = !!specializedProfile?.owner;
    const isClient = !!specializedProfile?.client;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-card border rounded-3xl overflow-hidden shadow-2xl glassmorphism"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Image / Pattern */}
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full bg-black/20 hover:bg-black/40 text-white border-none"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>

                        <div className="absolute -bottom-10 left-6">
                            <div className="w-20 h-20 rounded-2xl border-4 border-card overflow-hidden bg-muted shadow-lg">
                                <img
                                    src={likerProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${likerId}`}
                                    alt={likerProfile?.full_name || 'Profile'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 pt-12">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    {likerProfile?.full_name || 'Anonymous User'}
                                    {specializedProfile?.owner?.verified_owner && (
                                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                                    )}
                                </h2>
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {likerProfile?.city || 'Worldwide'}
                                </p>
                            </div>
                            <Badge variant="secondary" className="px-3 py-1">
                                {isOwner ? 'Owner' : 'Client'}
                            </Badge>
                        </div>

                        <p className="text-sm leading-relaxed mb-6 line-clamp-3">
                            {likerProfile?.bio || specializedProfile?.client?.bio || specializedProfile?.owner?.business_description || "Interested in connecting with you!"}
                        </p>

                        {/* Dynamic Content Section */}
                        <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {/* If Liker is Owner: Show Offerings */}
                            {isOwner && offerings && offerings.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Active Offerings
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {offerings.map((listing) => (
                                            <div key={listing.id} className="group relative rounded-xl overflow-hidden bg-muted/50 aspect-video border border-transparent hover:border-primary/30 transition-all">
                                                <img
                                                    src={listing.images?.[0] || '/placeholder-listing.jpg'}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                                                    <span className="text-[10px] text-white font-medium truncate">{listing.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* If Liker is Client: Show Preferences */}
                            {isClient && preferences && (
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Looking For
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {preferences.interested_in_properties && <Badge variant="outline" className="flex gap-1 items-center"><Home className="w-3 h-3" /> Property</Badge>}
                                        {preferences.interested_in_motorcycles && <Badge variant="outline" className="flex gap-1 items-center"><Car className="w-3 h-3" /> Moto</Badge>}
                                        {preferences.interested_in_bicycles && <Badge variant="outline" className="flex gap-1 items-center"><Bike className="w-3 h-3" /> Bike</Badge>}
                                        {preferences.interested_in_yachts && <Badge variant="outline" className="flex gap-1 items-center"><Ship className="w-3 h-3" /> Yacht</Badge>}
                                    </div>

                                    {preferences.max_price && (
                                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> Budget: Up to ${preferences.max_price.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl h-12 border-muted-foreground/20"
                                onClick={onClose}
                            >
                                Maybe Later
                            </Button>
                            <Button
                                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all flex items-center gap-2"
                                onClick={handleStartChat}
                                disabled={isInitializing}
                            >
                                {isInitializing ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    >
                                        <Settings className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    <>
                                        <MessageCircle className="w-5 h-5" />
                                        Message
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                            <Info className="w-3 h-3" />
                            <span>Initiating a chat costs 1 token</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
