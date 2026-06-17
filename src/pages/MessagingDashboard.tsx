import { AnimatePresence, motion } from 'framer-motion';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  _ChevronLeft, _CircleDot,
  _Layers, _Navigation, Archive, Ban, Check,
  FolderLock, Inbox, MessageCircle, MoreVertical, Search, ShieldAlert, Sparkles, Trash
} from 'lucide-react';
import { MessagesDocumentsLibrary } from '@/components/messaging/MessagesDocumentsLibrary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
// import { } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

import {
  type Conversation,
  useConversations,
  useDeleteConversation,
  useMarkConversationAsRead,
  useStartConversation,
  useUpdateConversationStatus
} from '@/hooks/useConversations';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { MessagingInterface } from '@/components/MessagingInterface';
import { MessageSkeleton } from '@/components/ui/LayoutSkeletons';
import { formatDistanceToNow } from '@/utils/timeFormatter';
// import { } from '@/integrations/supabase/client';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { useMessageActivations } from '@/hooks/useMessageActivations';
import { guardNewConversation, handleStartConversationError } from '@/utils/messagingQuotaUX';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
import { useBlockUser } from '@/hooks/useBlocking';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { appToast } from '@/utils/appNotification';
import { useSiteContent } from '@/hooks/useSiteContent';

const MessageActivationPackages = lazyWithRetry(() =>
  import('@/components/MessageActivationPackages').then(m => ({ default: m.MessageActivationPackages }))
);

export function MessagingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived' | 'listing' | 'client' | 'potential'>('all');
  const [inboxSection, setInboxSection] = useState<'chats' | 'documents'>('chats');
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [_showActivationBanner, _setShowActivationBanner] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{ userId: string; name: string } | null>(null);
  const { getText } = useSiteContent('messages');

  const { data: fetchedRole } = useUserRole(user?.id);
  const userRole = fetchedRole || 'client';
  const { _theme, isLight } = useAppTheme();
  const { t } = useTranslation();

  const { data: conversations = [], isLoading, isError, refetch, fetchSingleConversation } = useConversations();
  const deleteConversation = useDeleteConversation();
  const updateStatus = useUpdateConversationStatus();
  const markChatAsRead = useMarkConversationAsRead();
  const blockUser = useBlockUser();

  const [directlyFetchedConversation, setDirectlyFetchedConversation] = useState<Conversation | null>(null);
  const startConversation = useStartConversation();
  const { _totalActivations, canSendMessage } = useMessageActivations();

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

      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, activeFilter, user?.id]);

  const handleDirectOpenConversation = useCallback(async (conversationId: string) => {
    setIsStartingConversation(true);
    const timeout = setTimeout(() => setIsStartingConversation(false), 6000);
    try {
      let conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
        const result = await refetch();
        conversation = (result.data || []).find((c: any) => c.id === conversationId);
      }
      if (conversation) {
        setSelectedConversationId(conversationId);
        setSearchParams({}, { replace: true });
      } else {
        const fetched = await fetchSingleConversation(conversationId);
        if (fetched) {
          setDirectlyFetchedConversation(fetched);
          setSelectedConversationId(conversationId);
          setSearchParams({}, { replace: true });
        } else {
          appToast.error('Conversation not found', 'This chat may have been deleted or is no longer available.');
        }
      }
    } catch (_e) {
      appToast.error('Failed to open conversation', _e instanceof Error ? _e.message : 'Please try again.');
      setSearchParams({}, { replace: true });
    } finally {
      clearTimeout(timeout);
      setIsStartingConversation(false);
    }
  }, [conversations, refetch, fetchSingleConversation, setSearchParams]);

  const handleAutoStartConversation = useCallback(async (userId: string) => {
    setIsStartingConversation(true);
    try {
      const existing = conversations.find(c => c.other_user?.id === userId);
      if (existing) {
        setSelectedConversationId(existing.id);
        setSearchParams({}, { replace: true });
        setIsStartingConversation(false);
        return;
      }
      if (!guardNewConversation(canSendMessage)) {
        setSearchParams({}, { replace: true });
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
        setSearchParams({}, { replace: true });
      }
    } catch (e) {
      handleStartConversationError(e);
      setSearchParams({}, { replace: true });
    } finally {
      setIsStartingConversation(false);
    }
  }, [conversations, canSendMessage, startConversation, refetch, setSearchParams]);

  useEffect(() => {
    if (isLoading) return;
    const conversationId = searchParams.get('conversationId');
    const startUserId = searchParams.get('startConversation');
    if (conversationId && !isStartingConversation) handleDirectOpenConversation(conversationId);
    else if (startUserId && !isStartingConversation) handleAutoStartConversation(startUserId);
  }, [searchParams, isStartingConversation, isLoading, handleDirectOpenConversation, handleAutoStartConversation]);

  if (selectedConversationId) {
    const conversation = conversations.find(c => c.id === selectedConversationId) || directlyFetchedConversation;
    const otherUser = conversation?.other_user;
    const listing = conversation?.listing;

    return createPortal(
      <div className={cn("fixed inset-0 z-[9999] w-full h-[100dvh] flex flex-col transition-colors duration-200 overflow-hidden page-canvas", isLight ? "bg-background" : "bg-black")}>
        <AnimatePresence mode="sync">
          <motion.div
            key="interface"
            initial={{ opacity: 0, y: '10%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '10%' }}
            transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "w-full max-w-full mx-auto flex flex-col flex-1 min-h-0 relative shadow-2xl overflow-hidden",
              isLight ? "bg-background" : "bg-[#0A0A0C]"
            )}
          >
            <MessagingInterface
              conversationId={selectedConversationId}
              otherUser={(otherUser || { id: 'loading', full_name: 'Connecting...', role: 'client' }) as any}
              listing={listing}
              currentUserRole={userRole}
              onBack={() => {
                triggerHaptic('medium');
                setSelectedConversationId(null);
                setDirectlyFetchedConversation(null);
                navigate('/messages', { replace: true });
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>,
      document.body
    );
  }

  return (
    <AmbientPageBackground className="w-full min-h-[100dvh] bg-background transition-colors duration-200">
      <div 
        className="w-full max-w-7xl mx-auto px-6 pb-24 relative z-10 space-y-6"
        style={{
          paddingTop: 'calc(var(--top-bar-height, 72px) + var(--safe-top, 0px) + 12px)',
          paddingBottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 24px)'
        }}
      >
        
         <div className="flex items-center gap-4 sm:gap-6">
           <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-[1.8rem] bg-[#EB4898] text-white shadow-[#EB4898]/20 flex items-center justify-center shadow-2xl shrink-0">
              <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-[#EB4898]">{t('messages.title')}</span>
              <h1 className={cn("text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none mt-1", isLight ? "text-black" : "text-white")}>{t('messages.title')}</h1>
           </div>
         </div>

        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 z-10 text-[#EB4898]" />
            <input 
              placeholder={getText('search_placeholder', 'SEARCH NAMES...')} 
              className={cn(
                "w-full pl-14 pr-14 h-16 rounded-[2.2rem] text-[14px] outline-none transition-all font-black uppercase tracking-widest border surface-inset",
                isLight ? "text-black placeholder:text-black/50 focus:ring-2 focus:ring-[#EB4898]/30 focus:border-[#EB4898]/40" : "text-white placeholder:text-white/20 focus:border-white/10"
              )}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-[#EB4898] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {[
              { id: 'chats' as const, label: 'Chats', icon: Inbox },
              { id: 'documents' as const, label: 'Documents', icon: FolderLock },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => { setInboxSection(section.id); triggerHaptic('light'); }}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border shadow-sm",
                  inboxSection === section.id ? "border-0" : "surface-2 text-foreground/50 hover:shadow-[var(--elev-3)]",
                )}
                style={inboxSection === section.id ? { background: 'linear-gradient(135deg, #FF4D00, #EB4898)', boxShadow: '0 8px 24px rgba(255, 77, 0, 0.35)', color: 'white' } : {}}
              >
                <section.icon className={cn("w-3.5 h-3.5", inboxSection === section.id ? "text-white" : "text-[#EB4898]")} />
                {section.label}
              </button>
            ))}
          </div>

          {inboxSection === 'chats' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
              {[
                { id: 'all', label: getText('page_title', 'Inbox'), icon: Inbox },
                { id: 'unread', label: getText('free_messages_remaining', 'Priority'), icon: Sparkles },
                { id: 'archived', label: getText('empty_state_text', 'Archive'), icon: Archive },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => { setActiveFilter(filter.id as any); triggerHaptic('light'); }}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border",
                    activeFilter === filter.id
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                      : "surface-2 text-foreground/40",
                  )}
                >
                  <filter.icon className="w-3 h-3" />
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {inboxSection === 'documents' ? (
          <MessagesDocumentsLibrary />
        ) : (
        <div className="space-y-4">
          {isError && conversations.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <p className="text-sm font-semibold text-muted-foreground text-center">Could not load messages.</p>
              <Button onClick={() => refetch()}>Try again</Button>
            </div>
          ) : isLoading ? (
            <MessageSkeleton />
          ) : filteredConversations.length > 0 ? (
            <AnimatePresence initial={false}>
            {filteredConversations.map((conversation) => {
              const isUnread = conversation.last_message?.sender_id !== user?.id && conversation.last_message?.is_read === false;
              const lastAt = conversation.last_message_at ? new Date(conversation.last_message_at) : null;

              return (
                <motion.div
                  key={conversation.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <button 
                    className={cn(
                      "w-full flex items-center gap-5 p-6 rounded-[2.2rem] text-left transition-all border group relative overflow-hidden",
                      isUnread
                        ? "surface-row surface-row--active"
                        : "surface-row hover:shadow-[var(--elev-3)]"
                    )} 
                    onClick={() => { triggerHaptic('medium'); setSelectedConversationId(conversation.id); }}
                  >
                    {/* Unread Indicator Glow */}
                    {isUnread && <div className="absolute inset-y-0 left-0 w-1 bg-[#EB4898]" />}

                    <div className="relative shrink-0">
                       <Avatar className={cn("w-15 h-15 rounded-2xl border shadow-xl overflow-hidden", isLight ? "border-slate-200" : "border-white/10")}>
                          <AvatarImage src={conversation.other_user?.avatar_url} className="object-cover" />
                          <AvatarFallback className={cn("font-black uppercase italic", isLight ? "bg-foreground/5 text-foreground" : "bg-white/5 text-white")}>{conversation.other_user?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {isUnread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EB4898] border-2 border-background flex items-center justify-center">
                            <div className="w-1 h-1 bg-white rounded-full" />
                          </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-[16px] truncate uppercase italic", 
                          isUnread ? "font-black" : "font-bold opacity-60",
                          isLight ? "text-black" : "text-white"
                        )}>
                          {conversation.other_user?.full_name || 'Anonymous Entity'}
                        </span>
                        <span className={cn("text-[9px] font-black uppercase tracking-widest italic", isLight ? "text-black/20" : "text-white/20")}>
                          {lastAt ? formatDistanceToNow(lastAt) : ''}
                        </span>
                      </div>
                      
                      <p className={cn(
                        "text-[13px] truncate italic", 
                        isUnread ? "text-[#EB4898] font-bold" : (isLight ? "text-black/30" : "text-white/30")
                      )}>
                         {conversation.last_message?.message_text || conversation.last_message?.content || 'New Message'}
                      </p>
                    </div>

                      <div className="shrink-0 opacity-60 hover:opacity-100 transition-opacity pr-2" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className={cn("w-10 h-10 rounded-full hover:bg-white/10 pointer-events-auto", isLight ? "text-black/30" : "text-white/30")}>
                               <MoreVertical className="w-5 h-5" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="force-white rounded-[2rem] bg-[#121214] p-2 shadow-2xl text-white backdrop-blur-xl z-[100003]">
                            <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-[#EB4898]/20 focus:text-white cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); markChatAsRead.mutate(conversation.id); }} disabled={!isUnread}>
                              <Check className="w-4 h-4 mr-3" /> Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-white/10 cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); updateStatus.mutate({ conversationId: conversation.id, status: conversation.status === 'archived' ? 'active' : 'archived' }); }}>
                              <Archive className="w-4 h-4 mr-3" /> {conversation.status === 'archived' ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 my-2" />
                            <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-amber-500/20 text-amber-500 cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); (window as any).dispatchEvent(new CustomEvent('open-report', { detail: { reportedUserId: conversation.other_user?.id, reportedUserAge: conversation.other_user?.age, category: 'user_profile' } })); }}>
                              <ShieldAlert className="w-4 h-4 mr-3" /> Report Entity
                            </DropdownMenuItem>
                             <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-red-500/20 text-red-500 cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); if (conversation.other_user) setBlockTarget({ userId: conversation.other_user.id, name: conversation.other_user.full_name || 'this user' }); }}>
                              <Ban className="w-4 h-4 mr-3" /> Block Entity
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-4 rounded-[1.2rem] focus:bg-red-500/20 text-red-500 cursor-pointer font-black uppercase tracking-widest text-[9px]" onClick={e => { e.stopPropagation(); deleteConversation.mutate(conversation.id); }}>
                              <Trash className="w-4 h-4 mr-3" /> Delete Chat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </button>
                </motion.div>
              );
            })}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "py-24 flex flex-col items-center justify-center rounded-[3.5rem] border shadow-sm",
                isLight ? "surface-section" : "bg-white/[0.02] border-white/[0.05]"
              )}
            >
              {searchQuery ? (
                <>
                  <div className="w-20 h-20 rounded-[1.8rem] bg-slate-500/10 flex items-center justify-center mb-8 border border-slate-500/20">
                    <Search className="w-9 h-9 text-slate-400" />
                  </div>
                  <h3 className={cn("text-xl font-black uppercase italic tracking-tighter mb-2", isLight ? "text-black" : "text-white")}>No results</h3>
                  <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] opacity-40 text-center max-w-xs leading-relaxed mb-8", isLight ? "text-black" : "text-white")}>
                    No chats matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-white active:scale-95 transition-transform"
                  >
                    Clear search
                  </button>
                </>
              ) : activeFilter !== 'all' ? (
                <>
                  <div className="w-20 h-20 rounded-[1.8rem] bg-amber-500/10 flex items-center justify-center mb-8 border border-amber-500/20">
                    <MessageCircle className="w-9 h-9 text-amber-400" />
                  </div>
                  <h3 className={cn("text-xl font-black uppercase italic tracking-tighter mb-2", isLight ? "text-black" : "text-white")}>Nothing here</h3>
                  <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] opacity-40 text-center max-w-xs leading-relaxed mb-8", isLight ? "text-black" : "text-white")}>
                    No {activeFilter} chats yet
                  </p>
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-white active:scale-95 transition-transform"
                  >
                    Show all chats
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-[1.8rem] bg-indigo-500/10 flex items-center justify-center mb-10 border border-indigo-500/20">
                    <MessageCircle className="w-10 h-10 text-indigo-500 animate-pulse" />
                  </div>
                  <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter mb-4", isLight ? "text-black" : "text-white")}>{t('messages.noMessages')}</h3>
                  <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] opacity-30 text-center max-w-lg leading-relaxed", isLight ? "text-black/30" : "text-white/30")}>{t('messages.startConversation')}</p>
                </>
              )}
            </motion.div>
          )}
        </div>
        )}

        <div className="h-20" />
      </div>
      
      <Suspense fallback={null}>
        <MessageActivationPackages isOpen={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} userRole={userRole} />
      </Suspense>

      <AlertDialog open={!!blockTarget} onOpenChange={(open) => { if (!open) setBlockTarget(null); }}>
        <AlertDialogContent className={cn("rounded-[28px]", isLight ? "surface-5 text-slate-900" : "bg-card text-white border-white/10")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("text-lg font-bold", isLight ? "text-slate-900" : "text-white")}>Block this user?</AlertDialogTitle>
            <AlertDialogDescription className={cn(isLight ? "text-slate-500" : "text-white/50")}>
              This will permanently block {blockTarget?.name} from contacting you. You won't see their messages or listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className={cn("rounded-2xl", isLight ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-white/10 border-white/20 text-white hover:bg-white/15")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-red-600 hover:bg-red-500 text-white border-0"
              onClick={() => { if (blockTarget) blockUser.mutate(blockTarget.userId); }}
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AmbientPageBackground>
  );
}
