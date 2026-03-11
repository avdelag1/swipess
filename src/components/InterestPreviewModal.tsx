import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Flame, Sparkles, Home, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientProfilePreview } from './ClientProfilePreview';
import { useStartConversation } from '@/hooks/useConversations';
import { toast } from 'sonner';

interface InterestPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    likerId: string;
    targetId?: string;
    targetType: 'profile' | 'listing';
    onMessageInitiated?: (conversationId: string) => void;
}

export const InterestPreviewModal = memo(({
    isOpen,
    onClose,
    likerId,
    targetId,
    targetType,
    onMessageInitiated
}: InterestPreviewModalProps) => {
    const startConversation = useStartConversation();
    const [isStarting, setIsStarting] = useState(false);

    // Fetch listing details if target is a listing
    const { data: listingData } = useQuery({
        queryKey: ['listing-details', targetId],
        queryFn: async () => {
            if (!targetId || targetType !== 'listing') return null;
            const { data, error } = await supabase
                .from('listings')
                .select('title')
                .eq('id', targetId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!targetId && targetType === 'listing' && isOpen,
    });

    const handleMessage = async () => {
        setIsStarting(true);
        try {
            const initialMessage = targetType === 'listing'
                ? `Hi! I saw you were interested in my listing "${listingData?.title}". Would you like to talk more about it?`
                : `Hi! I saw you liked my profile. I'd love to connect!`;

            const result = await startConversation.mutateAsync({
                otherUserId: likerId,
                initialMessage,
                canStartNewConversation: true,
            });

            if (result?.conversationId) {
                onMessageInitiated?.(result.conversationId);
                onClose();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start conversation");
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden bg-background border-border rounded-[2.5rem] flex flex-col">
                <DialogHeader className="p-6 pb-2 flex-shrink-0 flex flex-row items-center justify-between border-b border-white/5 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E4007C]/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[#E4007C]" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight text-foreground">Client Interest</DialogTitle>
                            {targetType === 'listing' && listingData && (
                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Home className="w-3 h-3" /> Interested in: {listingData.title}
                                </p>
                            )}
                            {targetType === 'profile' && (
                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <User className="w-3 h-3" /> Interested in connecting with you
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-white/5 text-muted-foreground"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="pb-10">
                        <ClientProfilePreview mode="owner-view" clientId={likerId} />
                    </div>
                </ScrollArea>

                <div className="p-6 border-t border-white/5 bg-zinc-900/30 flex gap-4 flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5 font-bold text-muted-foreground"
                    >
                        Dismiss
                    </Button>
                    <Button
                        onClick={handleMessage}
                        disabled={isStarting}
                        className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-[#E4007C] to-[#FFD700] hover:opacity-90 font-black text-white shadow-lg shadow-[#E4007C]/20"
                    >
                        {isStarting ? (
                            <span className="flex items-center gap-2">
                                <Flame className="w-5 h-5 animate-pulse" /> Connecting...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" /> Start Conversation
                            </span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
});

InterestPreviewModal.displayName = 'InterestPreviewModal';
