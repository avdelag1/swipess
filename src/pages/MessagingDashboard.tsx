// @ts-nocheck
/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { PageTransition } from '@/components/PageTransition';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Search, Plus, Home, Bike, Ship, Car } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useConversations, useConversationStats, useStartConversation } from '@/hooks/useConversations';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { MessagingInterface } from '@/components/MessagingInterface';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TokenPackages } from '@/components/TokenPackages';
import { MessageActivationBanner } from '@/components/MessageActivationBanner';
import { useMessageActivations } from '@/hooks/useMessageActivations';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
import { logger } from '@/utils/prodLogger';

// Helper to check free messaging eligibility - extracted to avoid TS deep instantiation
async function checkFreeMessagingCategory(userId: string): Promise<boolean> {
  try {
    // @ts-expect-error - Supabase types too deeply nested, using raw query
    const result = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or('category.eq.motorcycle,category.eq.bicycle');
    return (result?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

export function MessagingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [directConversationId, setDirectConversationId] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showActivationBanner, setShowActivationBanner] = useState(false);

  // Use React Query-based hook for role - prevents menu flickering
  const { data: fetchedRole, isLoading: roleLoading } = useUserRole(user?.id);
  const userRole = fetchedRole || 'client';

  // Get active mode to filter conversations
  const { activeMode } = useActiveMode();

  const { data: conversations = [], isLoading, refetch, ensureConversationInCache, fetchSingleConversation } = useConversations();
  // State to store a directly fetched conversation (when not in cache)
  const [directlyFetchedConversation, setDirectlyFetchedConversation] = useState<{
    id: string;
    other_user?: { id: string; full_name: string; avatar_url?: string; role: string };
    listing?: { id: string; title: string; price?: number; images?: string[]; category?: string; mode?: string; address?: string; city?: string };
  } | null>(null);
  const { data: stats } = useConversationStats();
  const startConversation = useStartConversation();
  const { totalActivations, canSendMessage } = useMessageActivations();

  // PERFORMANCE: Prefetch top conversations on mount
  // Pre-warms cache for likely-to-open threads
  const { prefetchTopConversations, prefetchTopConversationMessages } = usePrefetchManager();
  useEffect(() => {
    if (!user?.id) return;

    // Prefetch in idle time
    if ('requestIdleCallback' in window) {
      (window as Window).requestIdleCallback(() => {
        prefetchTopConversations(user.id, 3);
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        prefetchTopConversations(user.id, 3);
      }, 100);
    }
  }, [user?.id, prefetchTopConversations]);

  // PERFORMANCE: Prefetch messages for top 2 conversations when list loads
  useEffect(() => {
    if (conversations.length >= 2) {
      // Prefetch messages for top 2 conversations
      const topConversations = conversations.slice(0, 2);
      topConversations.forEach(conv => {
        if ('requestIdleCallback' in window) {
          (window as Window).requestIdleCallback(() => {
            prefetchTopConversationMessages(conv.id);
          }, { timeout: 3000 });
        } else {
          setTimeout(() => {
            prefetchTopConversationMessages(conv.id);
          }, 200);
        }
      });
    }
  }, [conversations, prefetchTopConversationMessages]);

  // Debounced refetch to prevent excessive queries on rapid real-time events
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      refetch();
    }, 500); // 500ms debounce for smoother real-time updates
  }, [refetch]);


  // Mark messages as read when viewing conversation
  useMarkMessagesAsRead(selectedConversationId || '', !!selectedConversationId);

  const filteredConversations = useMemo(() => {
    // Filter conversations based on active mode and search query
    return conversations.filter(conv => {
      // Search filter
      const matchesSearch = conv.other_user?.full_name?.toLowerCase()?.includes(searchQuery.toLowerCase());

      // Mode filter
      // Client mode: only show conversations where current user is the client (talking to owners)
      // Owner mode: only show conversations where current user is the owner (talking to clients)
      const matchesMode = activeMode === 'client'
        ? conv.client_id === user?.id
        : conv.owner_id === user?.id;

      return matchesSearch && matchesMode;
    });
  }, [conversations, searchQuery, activeMode, user?.id]);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  // Realtime subscription for new conversations
  useEffect(() => {
    if (!user?.id) return;

    const conversationsChannel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `or(client_id.eq.${user.id},owner_id.eq.${user.id})`
        },
        (payload) => {
          // Debounced refetch for smoother real-time updates
          debouncedRefetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `or(client_id.eq.${user.id},owner_id.eq.${user.id})`
        },
        (payload) => {
          // Debounced refetch for smoother real-time updates
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      // Properly unsubscribe before removing channel
      conversationsChannel.unsubscribe();
    };
  }, [user?.id, debouncedRefetch]);

  // Memoized handlers for conversation opening
  const handleDirectOpenConversation = useCallback(async (conversationId: string) => {
    setIsStartingConversation(true);
    setDirectlyFetchedConversation(null); // Reset any previously fetched conversation

    try {
      // Try to find conversation in current list
      let conversation = conversations.find(c => c.id === conversationId);

      // If not found, refetch immediately to get latest data
      if (!conversation) {
        const result = await refetch();
        // Use fresh data from refetch result instead of stale state
        const freshConversations = result.data || [];
        conversation = freshConversations.find((c: { id: string }) => c.id === conversationId);
      }

      if (conversation) {
        setSelectedConversationId(conversationId);
        setSearchParams({});
        toast({
          title: '✅ Conversation opened',
          description: 'You can now send messages!',
        });
      } else {
        // Conversation not in cache - fetch it directly from database
        const fetchedConversation = await fetchSingleConversation(conversationId);

        if (fetchedConversation && fetchedConversation.other_user) {
          setDirectlyFetchedConversation(fetchedConversation);
          setSelectedConversationId(conversationId);
          setSearchParams({});
          toast({
            title: '✅ Conversation opened',
            description: 'You can now send messages!',
          });
        } else {
          // Still couldn't find it - show error
          toast({
            title: '❌ Could not open conversation',
            description: 'The conversation may not exist. Try refreshing the page.',
            variant: 'destructive',
          });
          setSearchParams({});
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) logger.error('[MessagingDashboard] Error opening conversation:', error);
      toast({
        title: '❌ Could not open conversation',
        description: 'The conversation may not exist. Try refreshing the page.',
        variant: 'destructive',
      });
      setSearchParams({});
    } finally {
      setIsStartingConversation(false);
    }
  }, [conversations, refetch, fetchSingleConversation, setSearchParams]);

  const handleAutoStartConversation = useCallback(async (userId: string) => {
    setIsStartingConversation(true);

    try {
      // Check if conversation already exists
      const existingConv = conversations.find(c =>
        c.other_user?.id === userId
      );

      if (existingConv) {
        toast({
          title: 'Opening conversation',
          description: 'Loading your existing conversation...',
        });
        setSelectedConversationId(existingConv.id);
        setSearchParams({}); // Clear URL param
        setIsStartingConversation(false);
        return;
      }

      // Check if other user has moto/bicycle listings for free messaging
      const hasFreeMessagingCategory = await checkFreeMessagingCategory(userId);

      // Check if user has activations (skip check for moto/bicycle listings)
      if (!hasFreeMessagingCategory && (!canSendMessage || totalActivations === 0)) {
        setShowActivationBanner(true);
        setShowUpgradeDialog(true);
        setSearchParams({}); // Clear URL param
        setIsStartingConversation(false);
        return;
      }

      // Create new conversation
      toast({
        title: 'Starting conversation',
        description: hasFreeMessagingCategory ? 'Free messaging for motorcycles & bicycles!' : 'Creating a new conversation...',
      });

      const result = await startConversation.mutateAsync({
        otherUserId: userId,
        initialMessage: "Hi! I'm interested in connecting.",
        canStartNewConversation: hasFreeMessagingCategory || canSendMessage,
      });

      if (result.conversationId) {
        // Wait a moment for the conversation to be available
        await new Promise(resolve => setTimeout(resolve, 500));
        await refetch();
        setSelectedConversationId(result.conversationId);
        setSearchParams({});
        toast({
          title: 'Conversation started',
          description: 'You can now send messages!',
        });
        setIsStartingConversation(false);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) logger.error('Error auto-starting conversation:', error);

      if (error?.message === 'QUOTA_EXCEEDED') {
        setShowActivationBanner(true);
        setShowUpgradeDialog(true);
      } else {
        toast({
          title: 'Could not start conversation',
          description: error instanceof Error ? error.message : 'Please try again later.',
          variant: 'destructive',
        });
      }

      setSearchParams({});
      setIsStartingConversation(false);
    }
  }, [conversations, canSendMessage, totalActivations, startConversation, refetch, setSearchParams]);

  // Handle direct conversation opening or auto-start from URL parameters
  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    const startConversationUserId = searchParams.get('startConversation');

    // Store direct conversation ID for priority display
    if (conversationId) {
      setDirectConversationId(conversationId);
    }

    // Direct conversation ID - open immediately
    if (conversationId && !isStartingConversation) {
      handleDirectOpenConversation(conversationId);
    }
    // User ID - start new conversation
    else if (startConversationUserId && !isStartingConversation) {
      handleAutoStartConversation(startConversationUserId);
    }
  }, [searchParams, isStartingConversation, handleDirectOpenConversation, handleAutoStartConversation]);

  // Don't block on role loading - show content immediately
  // Role will update when fetched and is mainly used for UI styling
  // This prevents the app from getting stuck on loading screen

  if (selectedConversationId) {
    // If we have a selected conversation ID, show the messaging interface
    // Use either the cached conversation or the directly fetched one
    const conversation = conversations.find(c => c.id === selectedConversationId) || directlyFetchedConversation;

    // Get the other user from either source
    const otherUser = conversation?.other_user;
    const listing = conversation?.listing;

    return (
      <>
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
          <div className="w-full max-w-4xl mx-auto p-2 sm:p-3 flex flex-col flex-1 min-h-0">
            {otherUser ? (
              <MessagingInterface
                conversationId={selectedConversationId}
                otherUser={otherUser}
                listing={listing}
                currentUserRole={userRole}
                onBack={() => {
                  setSelectedConversationId(null);
                  setDirectConversationId(null);
                  setDirectlyFetchedConversation(null);
                }}
              />
            ) : (
              // Fallback: Show loading state while conversation details load
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <MessageCircle className="w-12 h-12 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading conversation...</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedConversationId(null);
                    setDirectConversationId(null);
                    setDirectlyFetchedConversation(null);
                  }}
                  className="mt-4"
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Activation Banner */}
      <MessageActivationBanner
        isVisible={showActivationBanner}
        onClose={() => setShowActivationBanner(false)}
        userRole={userRole}
        variant="conversation-limit"
      />

      <div className="w-full pb-24 min-h-screen bg-background">
        <div className="w-full max-w-4xl mx-auto px-4 pt-4 sm:px-6">
          {/* Clean Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-muted rounded-full shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Messages</h1>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 h-11 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground rounded-2xl focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Conversations */}
          <div className="space-y-1.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <MessageCircle className="w-10 h-10 text-primary animate-pulse mb-3" />
                <p className="text-sm text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => {
                const isOwner = conversation.other_user?.role === 'owner';
                const hasUnread = conversation.last_message?.sender_id !== user?.id && 
                  conversation.last_message_at && 
                  new Date(conversation.last_message_at).getTime() > Date.now() - 86400000;

                return (
                  <button
                    key={conversation.id}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-200 hover:bg-muted/60 active:scale-[0.98] text-left group"
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    {/* Avatar with gradient ring */}
                    <div className="relative shrink-0">
                      <div className={`p-[2px] rounded-full ${
                        isOwner 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        <Avatar className="w-13 h-13 border-2 border-background">
                          <AvatarImage src={conversation.other_user?.avatar_url} />
                          <AvatarFallback className={`text-sm font-semibold text-white ${
                            isOwner
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          }`}>
                            {conversation.other_user?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* Online dot */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-semibold text-[15px] truncate ${hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                            {conversation.other_user?.full_name || 'Unknown'}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            isOwner 
                              ? 'bg-purple-500/15 text-purple-400' 
                              : 'bg-blue-500/15 text-blue-400'
                          }`}>
                            {isOwner ? 'Provider' : 'Explorer'}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground ml-2 shrink-0">
                          {conversation.last_message_at
                            ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })
                            : ''
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] truncate flex-1 ${hasUnread ? 'text-foreground/70 font-medium' : 'text-muted-foreground'}`}>
                          {conversation.last_message?.message_text || 'Start a conversation...'}
                        </p>
                        {hasUnread && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <p className="text-foreground font-medium mb-1">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search' : 'Start matching to chat!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Dialog */}
      <TokenPackages
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        userRole={userRole}
      />
    </>
  );
}