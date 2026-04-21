import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type MemoryCategory = 'contact' | 'preference' | 'fact' | 'note';

export interface UserMemory {
  id: string;
  user_id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  tags: string[];
  source: 'manual' | 'ai';
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryInput {
  category: MemoryCategory;
  title: string;
  content: string;
  tags?: string[];
}

export const MEMORIES_QUERY_KEY = (userId: string) => ['user-memories', userId];

export function useUserMemories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: memories = [], isLoading } = useQuery<UserMemory[]>({
    queryKey: user?.id ? MEMORIES_QUERY_KEY(user.id) : ['user-memories-noop'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from('user_memories')
        .select('id, user_id, category, title, content, tags, source, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as UserMemory[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const addMemory = useMutation({
    mutationFn: async (input: CreateMemoryInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase as any)
        .from('user_memories')
        .insert({
          user_id: user.id,
          category: input.category,
          title: input.title,
          content: input.content,
          tags: input.tags || [],
          source: 'manual',
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserMemory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMORIES_QUERY_KEY(user!.id) });
    },
    onError: (err: Error) => {
      toast.error(`Failed to save memory: ${err.message}`);
    },
  });

  const deleteMemory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('user_memories')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMORIES_QUERY_KEY(user!.id) });
      toast.success('Memory deleted', { duration: 1500 });
    },
    onError: () => {
      toast.error('Failed to delete memory');
    },
  });

  return {
    memories,
    isLoading,
    addMemory,
    deleteMemory,
    count: memories.length,
  };
}

