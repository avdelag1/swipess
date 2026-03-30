import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

export interface AIMemory {
  id: string;
  user_id: string;
  memory_type: 'person' | 'preference' | 'fact' | 'contact' | 'location' | 'service' | 'custom';
  category: string | null;
  content: string;
  metadata: Record<string, any>;
  importance: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
}

export interface AIMemoryInput {
  memory_type: AIMemory['memory_type'];
  category?: string;
  content: string;
  metadata?: Record<string, any>;
  importance?: number;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string | null;
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function useAIMemory() {
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save a new memory
  const saveMemory = useCallback(async (memory: AIMemoryInput): Promise<AIMemory | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('ai_memories')
        .insert({
          user_id: user.id,
          memory_type: memory.memory_type,
          category: memory.category || null,
          content: memory.content,
          metadata: memory.metadata || {},
          importance: memory.importance || 5,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newMemory = data as AIMemory;
      setMemories(prev => [newMemory, ...prev]);
      
      logger.info('[useAIMemory] Memory saved:', newMemory.id);
      return newMemory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save memory';
      setError(errorMessage);
      logger.error('[useAIMemory] Error saving memory:', err);
      toast.error('Failed to save memory');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search memories by query
  const searchMemories = useCallback(async (
    query: string,
    memoryType?: AIMemory['memory_type'],
    limit: number = 20
  ): Promise<AIMemory[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: searchError } = await supabase
        .rpc('search_user_memories', {
          p_user_id: user.id,
          p_search_query: query,
          p_memory_type: memoryType || null,
          p_limit: limit,
        });

      if (searchError) throw searchError;

      return (data || []) as AIMemory[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search memories';
      setError(errorMessage);
      logger.error('[useAIMemory] Error searching memories:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get recent memories
  const getRecentMemories = useCallback(async (
    memoryType?: AIMemory['memory_type'],
    limit: number = 10
  ): Promise<AIMemory[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .rpc('get_recent_memories', {
          p_user_id: user.id,
          p_memory_type: memoryType || null,
          p_limit: limit,
        });

      if (fetchError) throw fetchError;

      const recentMemories = (data || []) as AIMemory[];
      setMemories(recentMemories);
      return recentMemories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch memories';
      setError(errorMessage);
      logger.error('[useAIMemory] Error fetching memories:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all memories
  const getAllMemories = useCallback(async (): Promise<AIMemory[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('ai_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const allMemories = (data || []) as AIMemory[];
      setMemories(allMemories);
      return allMemories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch memories';
      setError(errorMessage);
      logger.error('[useAIMemory] Error fetching all memories:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a memory
  const updateMemory = useCallback(async (
    memoryId: string,
    updates: Partial<AIMemoryInput>
  ): Promise<AIMemory | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('ai_memories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memoryId)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedMemory = data as AIMemory;
      setMemories(prev => prev.map(m => m.id === memoryId ? updatedMemory : m));
      
      logger.info('[useAIMemory] Memory updated:', memoryId);
      return updatedMemory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update memory';
      setError(errorMessage);
      logger.error('[useAIMemory] Error updating memory:', err);
      toast.error('Failed to update memory');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a memory
  const deleteMemory = useCallback(async (memoryId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('ai_memories')
        .delete()
        .eq('id', memoryId);

      if (deleteError) throw deleteError;

      setMemories(prev => prev.filter(m => m.id !== memoryId));
      
      logger.info('[useAIMemory] Memory deleted:', memoryId);
      toast.success('Memory deleted');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete memory';
      setError(errorMessage);
      logger.error('[useAIMemory] Error deleting memory:', err);
      toast.error('Failed to delete memory');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update memory access time
  const updateMemoryAccess = useCallback(async (memoryId: string): Promise<void> => {
    try {
      await supabase.rpc('update_memory_access', { p_memory_id: memoryId });
    } catch (err) {
      logger.error('[useAIMemory] Error updating memory access:', err);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (
    title?: string,
    context?: Record<string, any>
  ): Promise<AIConversation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: title || null,
          context: context || {},
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newConversation = data as AIConversation;
      setConversations(prev => [newConversation, ...prev]);
      
      logger.info('[useAIMemory] Conversation created:', newConversation.id);
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      logger.error('[useAIMemory] Error creating conversation:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all conversations
  const getConversations = useCallback(async (): Promise<AIConversation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const allConversations = (data || []) as AIConversation[];
      setConversations(allConversations);
      return allConversations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      logger.error('[useAIMemory] Error fetching conversations:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a message to a conversation
  const saveMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<AIConversationMessage | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('ai_conversation_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update conversation's updated_at
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data as AIConversationMessage;
    } catch (err) {
      logger.error('[useAIMemory] Error saving message:', err);
      return null;
    }
  }, []);

  // Get messages for a conversation
  const getConversationMessages = useCallback(async (
    conversationId: string
  ): Promise<AIConversationMessage[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return (data || []) as AIConversationMessage[];
    } catch (err) {
      logger.error('[useAIMemory] Error fetching messages:', err);
      return [];
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (deleteError) throw deleteError;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      logger.info('[useAIMemory] Conversation deleted:', conversationId);
      toast.success('Conversation deleted');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      logger.error('[useAIMemory] Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format memories for AI context
  const formatMemoriesForAI = useCallback((memoriesToFormat: AIMemory[]): string => {
    if (memoriesToFormat.length === 0) return '';

    const groupedByType: Record<string, AIMemory[]> = {};
    memoriesToFormat.forEach(memory => {
      if (!groupedByType[memory.memory_type]) {
        groupedByType[memory.memory_type] = [];
      }
      groupedByType[memory.memory_type].push(memory);
    });

    let formatted = '## User\'s Personal Knowledge Base\n\n';
    
    Object.entries(groupedByType).forEach(([type, typeMemories]) => {
      formatted += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n`;
      typeMemories.forEach(memory => {
        const category = memory.category ? ` (${memory.category})` : '';
        formatted += `- ${memory.content}${category}\n`;
      });
      formatted += '\n';
    });

    return formatted;
  }, []);

  return {
    memories,
    conversations,
    isLoading,
    error,
    saveMemory,
    searchMemories,
    getRecentMemories,
    getAllMemories,
    updateMemory,
    deleteMemory,
    updateMemoryAccess,
    createConversation,
    getConversations,
    saveMessage,
    getConversationMessages,
    deleteConversation,
    formatMemoriesForAI,
  };
}
