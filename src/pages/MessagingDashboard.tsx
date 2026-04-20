import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle, Search,
  MoreVertical, Archive, Trash, Check, Inbox, CircleDot,
  Layers, Sparkles, Navigation, ChevronLeft, ArrowLeft
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived' | 'listing' | 'client' | 'potential'>('all');
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showActivationBanner, setShowActivationBanner] = useState(false);

  const { data: fetchedRole } = useUserRole(user?.id);
  const userRole = fetchedRole || 'client';
  const { activeMode } = useActiveMode();
  const { theme } = useTheme();

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
      <div className="w-full flex flex-col bg-[#0a0a0c]" style={{ height: 'calc(100dvh - 52px - 68px - var(--safe-top, 0px) - var(--safe-bottom, 0px))' }}>
        <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0 bg-[#0d0d0f] relative shadow-2xl overflow-hidden border-x border-white/5">
          {otherUser ? (
            <MessagingInterface
              conversationId={selectedConversationId}
              otherUser={otherUser as any}
              listing={listing}
              currentUserRole={userRole}
              onBack={() => { triggerHaptic('medium'); setSelectedConversationId(null); setDirectlyFetchedConversation(null); }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 uppercase font-black italic">
              <MessageCircle className="w-12 h-12 animate-pulse" />
              <span>Initializing Nexus Link...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white">
      {/* 🛸 ATMOSPHERIC AMBIENCE */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[-20%] w-[80%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[50%] bg-[#EB4898]/5 blur-[140px] rounded-full" />
      </div>

      <MessageActivationBanner isVisible={showActivationBanner} onClose={() => setShowActivationBanner(false)} userRole={userRole} variant="conversation-limit" />
      
      <div className="w-full max-w-4xl mx-auto px-6 pt-10 pb-40 relative z-10 space-y-8">
        
        {/* 🛸 HEADER: BOLD NEXUS STYLE */}
        <div className="flex flex-col gap-2">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">Communication Hub</span>
           <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Nexus Messages</h1>
        </div>

        {/* 🛸 SEARCH & FILTERS: GLASS STACK */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#EB4898] transition-colors" />
            <input 
              placeholder="Search by Identity..." 
              className="w-full pl-13 pr-6 h-15 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] text-[15px] outline-none focus:border-[#EB4898]/30 transition-all font-bold placeholder:text-white/10"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {[
              { id: 'all', label: 'Inbox', icon: Inbox },
              { id: 'unread', label: 'Priority', icon: Sparkles },
              { id: 'archived', label: 'Vault', icon: Archive }
            ].map((filter) => (
              <button 
                key={filter.id} 
                onClick={() => { setActiveFilter(filter.id as any); triggerHaptic('light'); }}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border",
                  activeFilter === filter.id
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                <filter.icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🛸 CONVERSATION STREAM */}
        <div className="space-y-3 stagger-enter">
          {isLoading ? (
            <MessageSkeleton />
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation, index) => {
              const isUnread = conversation.last_message?.sender_id !== user?.id && conversation.last_message?.is_read === false;
              const lastAt = conversation.last_message_at ? new Date(conversation.last_message_at) : null;

              return (
                <motion.div 
                  key={conversation.id} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                >
                  <button 
                    className={cn(
                      "w-full flex items-center gap-5 p-5 rounded-[2.2rem] text-left transition-all border group relative overflow-hidden",
                      isUnread 
                        ? "bg-white/[0.04] border-white/10 shadow-2xl" 
                        : "bg-transparent border-white/[0.03] hover:bg-white/[0.02] hover:border-white/5"
                    )} 
                    onClick={() => { triggerHaptic('medium'); setSelectedConversationId(conversation.id); }}
                  >
                    {/* Unread Indicator Glow */}
                    {isUnread && <div className="absolute inset-y-0 left-0 w-1 bg-[#EB4898] shadow-[0_0_15px_#EB4898]" />}

                    <div className="relative shrink-0">
                       <Avatar className="w-15 h-15 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                          <AvatarImage src={conversation.other_user?.avatar_url} className="object-cover" />
                          <AvatarFallback className="bg-white/5 text-white font-black uppercase italic">{conversation.other_user?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {isUnread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EB4898] border-2 border-[#0a0a0c] shadow-[0_0_10px_#EB4898] flex items-center justify-center">
                            <div className="w-1 h-1 bg-white rounded-full" />
                          </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-[15px] truncate uppercase italic", 
                          isUnread ? "font-black text-white" : "font-bold text-white/60"
                        )}>
                          {conversation.other_user?.full_name || 'Anonymous Entity'}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                          {lastAt ? formatDistanceToNow(lastAt) : ''}
                        </span>
                      </div>
                      
                      <p className={cn(
                        "text-[13px] truncate italic", 
                        isUnread ? "text-[#EB4898] font-bold" : "text-white/30"
                      )}>
                         {conversation.last_message?.message_text || conversation.last_message?.content || 'No transmission logs...'}
                      </p>
                    </div>

                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-white/10 text-white/30" onClick={e => e.stopPropagation()}>
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-[1.5rem] bg-[#121214] border-white/10 p-2 shadow-2xl text-white">
                            <DropdownMenuItem className="p-3 rounded-xl focus:bg-white/5 cursor-pointer" onClick={e => { e.stopPropagation(); markChatAsRead.mutate(conversation.id); }} disabled={!isUnread}>
                              <Check className="w-4 h-4 mr-3" /> Mark Read
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-3 rounded-xl focus:bg-white/5 cursor-pointer" onClick={e => { e.stopPropagation(); updateStatus.mutate({ conversationId: conversation.id, status: conversation.status === 'archived' ? 'active' : 'archived' }); }}>
                              <Archive className="w-4 h-4 mr-3" /> {conversation.status === 'archived' ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 my-2" />
                            <DropdownMenuItem className="p-3 rounded-xl focus:bg-red-500/10 text-red-500 cursor-pointer" onClick={e => { e.stopPropagation(); deleteConversation.mutate(conversation.id); }}>
                              <Trash className="w-4 h-4 mr-3" /> Delete Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center opacity-20 uppercase font-black italic tracking-widest text-[10px] gap-4">
              <Inbox className="w-12 h-12" />
              <span>Transmissions Offline</span>
            </div>
          )}
        </div>

        <div className="h-20" />
      </div>
      
      <MessageActivationPackages isOpen={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} userRole={userRole} />
    </div>
  );
}
