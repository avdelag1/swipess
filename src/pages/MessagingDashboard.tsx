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
import { MessageActivationPackages } from '@/components/MessageActivationPackages';
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
        <div className="w-full flex flex-col pb-24">
          <div className="w-full max-w-4xl mx-auto p-2 sm:p-3 flex flex-col h-[calc(100vh-6rem)]">
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
      {/* Activation Banner - shown when trying to message without activations */}
      <MessageActivationBanner
        isVisible={showActivationBanner}
        onClose={() => setShowActivationBanner(false)}
        userRole={userRole}
        variant="conversation-limit"
      />

      <div className="w-full pb-24 bg-[#000000]">
        <div className="w-full max-w-4xl mx-auto p-3 sm:p-4">
          {/* Vibrant Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/10 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Messages</h1>
              </div>
              {stats && (
                <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#6366F1]/20 border border-[#8B5CF6]/30">
                  <p className="text-xs font-medium text-[#8B5CF6]">
                    {stats.conversationsUsed}/{stats.isPremium ? '∞' : 5} this week
                  </p>
                </div>
              )}
            </div>
            {stats && (
              <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF6B35]/20 to-[#F7931E]/20 border border-[#FF6B35]/30">
                <p className="text-[11px] font-medium text-[#FF6B35]">
                  {stats.conversationsUsed}/{stats.isPremium ? '∞' : 5}
                </p>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 h-10 bg-[#1C1C1E] border-[#38383A] text-white placeholder:text-[#8E8E93] rounded-xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

            {/* Conversations List */}
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {isLoading ? (
                <div className="p-12 text-center">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 text-[#007AFF] animate-pulse" />
                  <p className="text-sm text-[#8E8E93]">Loading...</p>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const isOwner = conversation.other_user?.role === 'owner';
                  const listing = conversation.listing;

                  const getCategoryIcon = (category?: string) => {
                    switch (category) {
                      case 'yacht': return <Ship className="w-3 h-3" />;
                      case 'motorcycle': return <Car className="w-3 h-3" />;
                      case 'bicycle': return <Bike className="w-3 h-3" />;
                      case 'vehicle': return <Car className="w-3 h-3" />;
                      default: return <Home className="w-3 h-3" />;
                    }
                  };

                  return (
                    <div
                      key={conversation.id}
                      className="p-3 border-b border-[#38383A] last:border-b-0 cursor-pointer hover:bg-[#2C2C2E]/50 transition-colors active:bg-[#2C2C2E]"
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Compact Avatar */}
                        <div className="relative shrink-0">
                          <Avatar className={`w-14 h-14 ring-2 ring-offset-2 ring-offset-[#1C1C1E] ${
                            isOwner ? 'ring-[#8B5CF6]' : 'ring-[#007AFF]'
                          }`}>
                            <AvatarImage src={conversation.other_user?.avatar_url} />
                            <AvatarFallback className={`text-base font-semibold text-white ${
                              isOwner
                                ? 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]'
                                : 'bg-gradient-to-br from-[#007AFF] to-[#5856D6]'
                            }`}>
                              {conversation.other_user?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#34C759] rounded-full border-2 border-[#1C1C1E]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1">
                            <h3 className="font-semibold text-white truncate text-sm">
                              {conversation.other_user?.full_name || 'Unknown User'}
                            </h3>
                            <span className="text-[11px] text-[#8E8E93] ml-2 shrink-0">
                              {conversation.last_message_at
                                ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })
                                : ''
                              }
                            </span>
                          </div>
                          <p className="text-xs text-[#8E8E93] truncate mb-1.5">
                            {conversation.last_message?.message_text || 'Start a conversation...'}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`text-[10px] px-1.5 py-0 h-5 border-0 ${
                                isOwner
                                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                                  : 'bg-[#007AFF]/20 text-[#007AFF]'
                              }`}
                            >
                              {isOwner ? 'Provider' : 'Explorer'}
                            </Badge>
                            {listing && userRole === 'client' && (
                              <>
                                {listing.price && (
                                  <span className="text-xs font-semibold text-[#34C759]">
                                    ${listing.price.toLocaleString()}
                                  </span>
                                )}
                                <Badge className="text-[10px] px-1.5 py-0 h-5 border-0 bg-[#34C759]/20 text-[#34C759] flex items-center gap-1">
                                  {getCategoryIcon(listing.category)}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/20 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-[#8B5CF6]" />
                  </div>
                  <p className="text-white font-medium mb-1">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-[#8E8E93]">
                    {searchQuery ? 'Try a different search' : 'Start matching to chat!'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

      {/* Upgrade Dialog */}
      <MessageActivationPackages
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        userRole={userRole}
      />
    </>
  );
}