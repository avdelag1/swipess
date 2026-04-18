/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { motion } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle, Search,
  MoreVertical, Archive, Trash, Check, Inbox, CircleDot,
  Layers, Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useActiveMode } from '@/hooks/useActiveMode';
import {
  useConversations,
  useStartConversation,
  useDeleteConversation,
  useUpdateConversationStatus,
  useMarkConversationAsRead,
  type Conversation
} from '@/hooks/useConversations';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { MessagingInterface } from '@/components/MessagingInterface';
import { MessageSkeleton } from '@/components/ui/LayoutSkeletons';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { supabase } from '@/integrations/supabase/client';
import { MessageActivationPackages } from '@/components/MessageActivationPackages';
import { MessageActivationBanner } from '@/components/MessageActivationBanner';
import { useMessageActivations } from '@/hooks/useMessageActivations';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
import { logger } from '@/utils/prodLogger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { haptics } from '@/utils/microPolish';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

// Helper to check free messaging eligibility
async function checkFreeMessagingCategory(userId: string): Promise<boolean> {
  try {
    const result = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or('category.eq.motorcycle,category.eq.bicycle');
    return (result?.count ?? 0) > 0;
  } catch (error) {
    logger.error('Error checking free messaging category:', error);
    return false;
  }
}

export function MessagingDashboard() {
  const _navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived' | 'listing' | 'client' | 'potential'>('all');
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [_directConversationId, _setDirectConversationId] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showActivationBanner, setShowActivationBanner] = useState(false);

  const { data: fetchedRole } = useUserRole(user?.id);
  const userRole = fetchedRole || 'client';
  const { activeMode } = useActiveMode();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const { data: conversations = [], isLoading, refetch, fetchSingleConversation } = useConversations();
  const deleteConversation = useDeleteConversation();
  const updateStatus = useUpdateConversationStatus();
  const markChatAsRead = useMarkConversationAsRead();

  const [directlyFetchedConversation, setDirectlyFetchedConversation] = useState<Conversation | null>(null);
  const startConversation = useStartConversation();
  const { totalActivations, canSendMessage } = useMessageActivations();

  const { prefetchTopConversations, prefetchTopConversationMessages } = usePrefetchManager();

  useEffect(() => {
    if (!user?.id) return;
    setTimeout(() => prefetchTopConversations(user.id, 3), 100);
  }, [user?.id, prefetchTopConversations]);

  useEffect(() => {
    if (conversations.length >= 2) {
      conversations.slice(0, 2).forEach(conv => {
        setTimeout(() => prefetchTopConversationMessages(conv.id), 200);
      });
    }
  }, [conversations, prefetchTopConversationMessages]);

  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
    refetchTimeoutRef.current = setTimeout(() => refetch(), 500);
  }, [refetch]);

  useMarkMessagesAsRead(selectedConversationId || '', !!selectedConversationId);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = conv.other_user?.full_name?.toLowerCase()?.includes(searchQuery.toLowerCase());
      const matchesMode = activeMode === 'client' ? conv.client_id === user?.id : conv.owner_id === user?.id;
      const isUnread = conv.last_message?.sender_id !== user?.id && conv.last_message?.is_read === false;

      let matchesFilter = true;
      if (activeFilter === 'unread') {
        matchesFilter = isUnread;
      } else if (activeFilter === 'archived') {
        matchesFilter = conv.status === 'archived';
      } else if (activeFilter === 'listing') {
        matchesFilter = !!conv.listing_id && conv.status !== 'archived';
      } else if (activeFilter === 'client') {
        matchesFilter = !conv.listing_id && !!conv.id && conv.status !== 'archived';
      } else if (activeFilter === 'potential') {
        matchesFilter = !conv.listing_id && !conv.id && conv.status !== 'archived';
      } else {
        matchesFilter = conv.status !== 'archived';
      }

      return matchesSearch && matchesMode && matchesFilter;
    });
  }, [conversations, searchQuery, activeMode, activeFilter, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel(`conversations-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => debouncedRefetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, debouncedRefetch]);

  const handleDirectOpenConversation = useCallback(async (conversationId: string) => {
    setIsStartingConversation(true);
    try {
      let conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
          const result = await refetch();
          conversation = (result.data || []).find((c: any) => c.id === conversationId);
      }
      if (conversation) {
        setSelectedConversationId(conversationId);
        setSearchParams({});
      } else {
        const fetched = await fetchSingleConversation(conversationId);
        if (fetched) {
          setDirectlyFetchedConversation(fetched);
          setSelectedConversationId(conversationId);
          setSearchParams({});
        }
      }
    } catch (_e) {
      setSearchParams({});
    } finally {
      setIsStartingConversation(false);
    }
  }, [conversations, refetch, fetchSingleConversation, setSearchParams]);

  const handleAutoStartConversation = useCallback(async (userId: string) => {
    setIsStartingConversation(true);
    try {
      const existing = conversations.find(c => c.other_user?.id === userId);
      if (existing) {
        setSelectedConversationId(existing.id);
        setSearchParams({});
        setIsStartingConversation(false);
        return;
      }
      const hasFree = await checkFreeMessagingCategory(userId);
      if (!hasFree && (!canSendMessage || totalActivations === 0)) {
        setShowUpgradeDialog(true);
        setSearchParams({});
        setIsStartingConversation(false);
        return;
      }
      const result = await startConversation.mutateAsync({
        otherUserId: userId,
        initialMessage: "Hi! I'm interested in connecting.",
        canStartNewConversation: hasFree || canSendMessage,
      });
      if (result.conversationId) {
        await refetch();
        setSelectedConversationId(result.conversationId);
        setSearchParams({});
      }
    } catch (_e) {
      setSearchParams({});
    } finally {
      setIsStartingConversation(false);
    }
  }, [conversations, canSendMessage, totalActivations, startConversation, refetch, setSearchParams]);

  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    const startUserId = searchParams.get('startConversation');
    if (conversationId && !isStartingConversation) handleDirectOpenConversation(conversationId);
    else if (startUserId && !isStartingConversation) handleAutoStartConversation(startUserId);
  }, [searchParams, isStartingConversation, handleDirectOpenConversation, handleAutoStartConversation]);

  if (selectedConversationId) {
    const conversation = conversations.find(c => c.id === selectedConversationId) || directlyFetchedConversation;
    const otherUser = conversation?.other_user;
    const listing = conversation?.listing;

    return (
      <div className="w-full flex flex-col" style={{ height: 'calc(100dvh - 52px - 68px - var(--safe-top, 0px) - var(--safe-bottom, 0px))' }}>
        <div className="w-full max-w-4xl mx-auto p-2 sm:p-3 flex flex-col flex-1 min-h-0">
          {otherUser ? (
            <MessagingInterface
              conversationId={selectedConversationId}
              otherUser={otherUser as any}
              listing={listing}
              currentUserRole={userRole}
              onBack={() => { setSelectedConversationId(null); setDirectlyFetchedConversation(null); }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <MessageCircle className="w-12 h-12 text-muted-foreground animate-pulse" />
              <Button variant="outline" onClick={() => setSelectedConversationId(null)}>Back</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <MessageActivationBanner isVisible={showActivationBanner} onClose={() => setShowActivationBanner(false)} userRole={userRole} variant="conversation-limit" />
      <div className="w-full pb-4 bg-background">
        <div className="w-full max-w-4xl mx-auto px-4 pt-4 sm:px-6">
          <div className="mb-0" />

          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'all', label: 'Inbox', icon: Inbox },
              { id: 'unread', label: 'Unread', icon: CircleDot },
              { id: 'archived', label: 'Archived', icon: Archive }
            ].map((filter) => (
              <button key={filter.id} onClick={() => { setActiveFilter(filter.id as any); haptics.tap(); }}
                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shrink-0",
                  activeFilter === filter.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : isLight
                      ? "bg-secondary border border-border/40 text-muted-foreground hover:bg-secondary/80"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10")}>
                <filter.icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar px-1">
             {[
              { id: 'listing', label: 'Listings', icon: Layers, color: 'text-blue-400', glow: 'bg-blue-500/10' },
              { id: 'client', label: 'Clients', icon: MessageCircle, color: 'text-emerald-400', glow: 'bg-emerald-500/10' },
              { id: 'potential', label: 'Potential', icon: Sparkles, color: 'text-amber-400', glow: 'bg-amber-500/10' }
            ].map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button 
                  key={filter.id} 
                  onClick={() => { setActiveFilter(filter.id as any); haptics.select(); }}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-tighter transition-all shrink-0 relative overflow-hidden group",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 transition-all duration-500",
                    isActive 
                      ? isLight ? "bg-slate-900" : "bg-white/10 backdrop-blur-xl"
                      : "bg-transparent"
                  )} />
                  
                  {isActive && (
                    <motion.div 
                      layoutId="message-active-glow"
                      className={cn("absolute inset-0 opacity-40", filter.glow)}
                    />
                  )}

                  <filter.icon className={cn("w-4 h-4 relative z-10 transition-colors", isActive ? "text-primary" : filter.color)} />
                  <span className="relative z-10">{filter.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input placeholder="Search conversations..." className={cn("w-full pl-11 pr-4 h-12 rounded-2xl text-[15px] outline-none focus:ring-2 focus:ring-primary/30 transition-all", isLight ? "bg-secondary border border-border/40" : "bg-white/[0.04] border border-white/10")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="space-y-1.5 stagger-enter">
            {isLoading ? (
              <MessageSkeleton />
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation, index) => {
                const _isOwner = conversation.other_user?.role === 'owner';
                const isUnread = conversation.last_message?.sender_id !== user?.id && conversation.last_message?.is_read === false;
                const lastAt = conversation.last_message_at ? new Date(conversation.last_message_at) : null;

                return (
                  <motion.div 
                    key={conversation.id} 
                    className="zenith-content-node"
                    initial={{ opacity: 0, y: 16, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    transition={{ 
                      delay: index * 0.045,
                      type: 'spring',
                      stiffness: 400,
                      damping: 30
                    }}
                  >
                    <button className={cn("w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-colors", isLight ? "hover:bg-secondary" : "hover:bg-white/[0.04]")} onClick={() => setSelectedConversationId(conversation.id)}>
                      <div className="relative shrink-0">
                         <Avatar className="w-13 h-13 border-2 border-background shadow-xl">
                            <AvatarImage src={conversation.other_user?.avatar_url} />
                            <AvatarFallback className="bg-primary text-white font-black">{conversation.other_user?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background", isUnread ? "bg-orange-500 animate-pulse" : "bg-rose-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[15px] truncate", isUnread ? "font-black" : "font-bold text-foreground/70")}>{conversation.other_user?.full_name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] text-muted-foreground">{lastAt ? formatDistanceToNow(lastAt) : ''}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={e => e.stopPropagation()}><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className={cn("rounded-2xl shadow-2xl", isLight ? "bg-background border-border/50" : "bg-zinc-900 border-white/10")}>
                                <DropdownMenuItem className="p-3" onClick={e => { e.stopPropagation(); markChatAsRead.mutate(conversation.id); }} disabled={!isUnread}><Check className="w-4 h-4 mr-2" /> Mark as read</DropdownMenuItem>
                                <DropdownMenuItem className="p-3" onClick={e => { e.stopPropagation(); updateStatus.mutate({ conversationId: conversation.id, status: conversation.status === 'archived' ? 'active' : 'archived' }); }}>
                                  {conversation.status === 'archived' ? <Inbox className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />} {conversation.status === 'archived' ? 'Unarchive' : 'Archive'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className={isLight ? "bg-border" : "bg-white/5"} />
                                <DropdownMenuItem className="p-3 text-red-500" onClick={e => { e.stopPropagation(); deleteConversation.mutate(conversation.id); }}><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className={cn("text-[13px] truncate", isUnread ? "text-foreground font-bold" : "text-muted-foreground")}>
                           {conversation.last_message?.message_text || conversation.last_message?.content || 'Start a conversation...'}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="No Messages Yet"
                description="Start a conversation by liking a listing or connecting with someone."
              />
            )}
          </div>
        </div>
      </div>
      <MessageActivationPackages isOpen={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} userRole={userRole} />
    </>
  );
}
