import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle, Search,
  MoreVertical, Archive, Trash, Check, Inbox, Sparkles, ChevronLeft
} from 'lucide-react';
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
import { MessageActivationPackages } from '@/components/MessageActivationPackages';
import { MessageActivationBanner } from '@/components/MessageActivationBanner';
import { useMessageActivations } from '@/hooks/useMessageActivations';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

export function MessagingDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [isStartingConversation, setIsStartingConversation] = useState(false);
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
  const { canSendMessage } = useMessageActivations();

  const { prefetchTopConversations, prefetchTopConversationMessages } = usePrefetchManager();

  useEffect(() => {
    if (!user?.id) return;
    prefetchTopConversations(user.id, 3);
  }, [user?.id, prefetchTopConversations]);

  useEffect(() => {
    if (conversations.length >= 2) {
      conversations.slice(0, 2).forEach(conv => prefetchTopConversationMessages(conv.id));
    }
  }, [conversations, prefetchTopConversationMessages]);

  useMarkMessagesAsRead(selectedConversationId || '', !!selectedConversationId);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = conv.other_user?.full_name?.toLowerCase()?.includes(searchQuery.toLowerCase());
      const matchesMode = activeMode === 'client' ? conv.client_id === user?.id : conv.owner_id === user?.id;
      const isUnread = conv.last_message?.sender_id !== user?.id && conv.last_message?.is_read === false;

      let matchesFilter = true;
      if (activeFilter === 'unread') matchesFilter = isUnread;
      else if (activeFilter === 'archived') matchesFilter = conv.status === 'archived';
      else matchesFilter = conv.status !== 'archived';

      return matchesSearch && matchesMode && matchesFilter;
    });
  }, [conversations, searchQuery, activeMode, activeFilter, user?.id]);

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
      const result = await startConversation.mutateAsync({
        otherUserId: userId,
        initialMessage: "Hi! I'm interested in connecting.",
        canStartNewConversation: canSendMessage,
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
  }, [conversations, canSendMessage, startConversation, refetch, setSearchParams]);

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
      <div className={cn("w-full flex flex-col transition-colors duration-500", isLight ? "bg-white" : "bg-black")} style={{ height: 'calc(100dvh - 52px - 68px - var(--safe-top, 0px) - var(--safe-bottom, 0px))' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key="interface" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }}
            className={cn(
              "w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0 relative shadow-2xl overflow-hidden border-x",
              isLight ? "bg-white border-black/5" : "bg-[#0d0d0f] border-white/5"
            )}
          >
            {otherUser ? (
              <MessagingInterface
                conversationId={selectedConversationId}
                otherUser={otherUser as any}
                listing={listing}
                currentUserRole={userRole}
                onBack={() => { triggerHaptic('medium'); setSelectedConversationId(null); setDirectlyFetchedConversation(null); }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-[#EB4898]/40 uppercase font-black italic">
                <div className="w-16 h-16 rounded-full border-4 border-[#EB4898]/10 border-t-[#EB4898] animate-spin" />
                <span className="animate-pulse tracking-[0.3em] text-[10px]">Syncing...</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen w-full transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      {/* 🛸 CINEMATIC BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-[10%] left-[-15%] w-[80%] h-[40%] bg-indigo-500/30 blur-[130px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[50%] bg-[#EB4898]/30 blur-[140px] rounded-full" />
      </div>

      <MessageActivationBanner isVisible={showActivationBanner} onClose={() => setShowActivationBanner(false)} userRole={userRole} variant="conversation-limit" />
      
      <div className="w-full max-w-4xl mx-auto px-6 pt-20 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 HEADER: MEGA NEXUS SYNC */}
        <div className="flex items-center gap-6">
           <div className="w-18 h-18 rounded-[1.8rem] bg-[#EB4898] flex items-center justify-center shadow-2xl shadow-[#EB4898]/20">
              <MessageCircle className="w-8 h-8 text-white" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">Messages</span>
              <h1 className={cn("text-4xl font-black uppercase italic tracking-tighter leading-none mt-1", isLight ? "text-black" : "text-white")}>Direct Transmissions</h1>
           </div>
        </div>

        {/* 🛸 SEARCH & MATRIX FILTERS */}
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EB4898] opacity-50 z-10" />
            <input 
              placeholder="SCAN IDENTITIES..." 
              className={cn(
                "w-full pl-14 pr-8 h-16 rounded-[2.2rem] text-[14px] outline-none transition-all font-black uppercase tracking-widest border",
                isLight ? "bg-black/5 border-black/5 text-black placeholder:text-black/20" : "bg-white/[0.04] border-white/5 text-white placeholder:text-white/20 focus:border-white/10"
              )}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1">
            {[
              { id: 'all', label: 'Inbox', icon: Inbox },
              { id: 'unread', label: 'Priority', icon: Sparkles },
              { id: 'archived', label: 'Vault', icon: Archive }
            ].map((filter) => (
              <button 
                key={filter.id} 
                onClick={() => { setActiveFilter(filter.id as any); triggerHaptic('light'); }}
                className={cn(
                  "flex items-center gap-3 px-8 h-12 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border",
                  activeFilter === filter.id
                    ? "bg-[#EB4898] text-white border-[#EB4898] shadow-2xl shadow-[#EB4898]/30"
                    : isLight ? "bg-black/5 border-black/5 text-black font-black hover:bg-black/10" : "bg-white/[0.04] border-white/5 text-white/30 hover:bg-white/10"
                )}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🛸 STREAM GRID */}
        <div className="space-y-4">
          {isLoading ? (
            <MessageSkeleton />
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation, index) => {
              const isUnread = conversation.last_message?.sender_id !== user?.id && conversation.last_message?.is_read === false;
              const lastAt = conversation.last_message_at ? new Date(conversation.last_message_at) : null;

              return (
                <motion.div 
                  key={conversation.id} 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button 
                    className={cn(
                      "w-full flex items-center gap-6 p-6 rounded-[2.8rem] text-left transition-all border group relative overflow-hidden",
                      isUnread 
                        ? (isLight ? "bg-black/[0.02] border-black/10 shadow-xl" : "bg-white/[0.05] border-white/10 shadow-2xl") 
                        : (isLight ? "bg-transparent border-black/[0.04] hover:bg-black/[0.01]" : "bg-transparent border-white/[0.04] hover:bg-white/[0.02]")
                    )} 
                    onClick={() => { triggerHaptic('medium'); setSelectedConversationId(conversation.id); }}
                  >
                    {isUnread && <div className="absolute inset-y-0 left-0 w-2 bg-[#EB4898] shadow-[0_0_20px_#EB4898]" />}

                    <div className="relative shrink-0">
                        <Avatar className="w-16 h-16 rounded-[1.6rem] border border-white/10 shadow-2xl overflow-hidden">
                           <AvatarImage src={conversation.other_user?.avatar_url} className="object-cover" />
                           <AvatarFallback className="bg-indigo-500 text-white font-black uppercase italic">{conversation.other_user?.full_name?.charAt(0)}</AvatarFallback>
                         </Avatar>
                         {isUnread && (
                           <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EB4898] border-4 border-black shadow-[0_0_15px_#EB4898]" />
                         )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn(
                          "text-[16px] truncate uppercase italic", 
                          isUnread ? "font-black text-white" : "font-bold opacity-60"
                        )}>
                          {conversation.other_user?.full_name}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-20 italic">
                          {lastAt ? formatDistanceToNow(lastAt) : ''}
                        </span>
                      </div>
                      
                      <p className={cn(
                        "text-[14px] truncate italic leading-none", 
                        isUnread ? "text-[#EB4898] font-black" : "opacity-30"
                      )}>
                         {conversation.last_message?.message_text || 'Secure Transmission Encrypted'}
                      </p>
                    </div>

                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full hover:bg-white/10 text-white/30" onClick={e => e.stopPropagation()}>
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-[2rem] bg-[#121214] border-white/10 p-2 shadow-2xl text-white backdrop-blur-3xl">
                            <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-[#EB4898]/20 focus:text-white cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); markChatAsRead.mutate(conversation.id); }} disabled={!isUnread}>
                              <Check className="w-4 h-4 mr-3" /> Mark Decrypted
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-white/10 cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); updateStatus.mutate({ conversationId: conversation.id, status: conversation.status === 'archived' ? 'active' : 'archived' }); }}>
                              <Archive className="w-4 h-4 mr-3" /> {conversation.status === 'archived' ? 'Unvault' : 'Vault'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 my-2" />
                            <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-red-500/20 text-red-500 cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); deleteConversation.mutate(conversation.id); }}>
                              <Trash className="w-4 h-4 mr-3" /> Purge Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </button>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className={cn(
                 "py-32 flex flex-col items-center justify-center rounded-[3.5rem] border",
                 isLight ? "bg-black/5 border-black/5" : "bg-white/[0.02] border-white/[0.05]"
               )}
            >
              <div className="w-20 h-20 rounded-[1.8rem] bg-indigo-500/10 flex items-center justify-center mb-10 border border-indigo-500/20">
                 <MessageCircle className="w-10 h-10 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">No Transmissions</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30 text-center max-w-xs leading-relaxed">No messages yet. Connect with someone on the radar to start chatting.</p>
            </motion.div>
          )}
        </div>

        <div className="h-24" />
      </div>
      
      <MessageActivationPackages isOpen={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} userRole={userRole} />
    </div>
  );
}
