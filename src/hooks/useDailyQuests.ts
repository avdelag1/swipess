import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { triggerHaptic } from '@/utils/haptics';

export interface DailyQuest {
  id: string;
  title: string;
  goal: number;
  progress: number;
  points: number;
  claimed: boolean;
}

export function useDailyQuests() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ['daily-quests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('rpc_get_or_create_daily_quests', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error fetching daily quests:', error);
        return [];
      }
      return (data as unknown as DailyQuest[]) || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: questPoints = 0 } = useQuery({
    queryKey: ['quest-points', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from('profiles')
        .select('quest_points')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching quest points:', error);
        return 0;
      }
      // @ts-ignore
      return data?.quest_points || 0;
    },
    enabled: !!userId,
  });

  const incrementQuest = useMutation({
    mutationFn: async ({ questId, amount = 1 }: { questId: string; amount?: number }) => {
      if (!userId) return;
      
      const { data, error } = await supabase.rpc('rpc_increment_quest_progress', {
        p_user_id: userId,
        p_quest_id: questId,
        p_amount: amount,
      });

      if (error) throw error;
      return { newQuests: data as unknown as DailyQuest[], questId, amount };
    },
    onSuccess: ({ newQuests, questId, amount }) => {
      if (newQuests) {
        // Find the quest to show progress in a toast
        const updatedQuest = newQuests.find(q => q.id === questId);
        
        if (updatedQuest && !updatedQuest.claimed) {
          const isCompleted = updatedQuest.progress >= updatedQuest.goal;
          
          if (isCompleted) {
            triggerHaptic('success');
            toast({
              title: "Quest Completed! 🌟",
              description: `You finished "${updatedQuest.title}"! Go to your dashboard to claim your points.`,
              duration: 5000,
            });
          } else {
            // Only show progress toast sometimes so it's not annoying (e.g. every 5 swipes, or every message)
            if (questId !== 'swipe' || updatedQuest.progress % 5 === 0) {
              triggerHaptic('selection');
              toast({
                title: "Quest Progress 📈",
                description: `${updatedQuest.title}: ${updatedQuest.progress}/${updatedQuest.goal}`,
                duration: 3000,
              });
            }
          }
        }
        
        queryClient.setQueryData(['daily-quests', userId], newQuests);
      }
    },
  });

  const claimReward = useMutation({
    mutationFn: async (questId: string) => {
      if (!userId) throw new Error('Not logged in');
      
      const { data, error } = await supabase.rpc('rpc_claim_quest_reward', {
        p_user_id: userId,
        p_quest_id: questId,
      });

      if (error) throw error;
      return { newQuests: data as unknown as DailyQuest[], questId };
    },
    onSuccess: ({ newQuests, questId }) => {
      if (newQuests) {
        // Read current points from cache before we invalidate it
        const currentPoints: number = queryClient.getQueryData(['quest-points', userId]) || 0;
        
        // Find how many points this quest gave
        const claimedQuest = newQuests.find(q => q.id === questId);
        const pointsAdded = claimedQuest ? claimedQuest.points : 0;
        
        const willUnlockToken = (currentPoints + pointsAdded) >= 10;

        queryClient.setQueryData(['daily-quests', userId], newQuests);
        queryClient.invalidateQueries({ queryKey: ['quest-points', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-tokens', userId] });
        
        triggerHaptic('success');
        
        if (willUnlockToken) {
          toast({
            title: "Token Unlocked! 🎉",
            description: "Congratulations! You collected 10 points and earned a FREE Token!",
            duration: 6000,
          });
        } else {
          toast({
            title: "Reward Claimed! 🎁",
            description: `You earned +${pointsAdded} points towards your next free token!`,
            duration: 4000,
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error claiming reward",
        description: error.message,
        variant: "destructive",
      });
      triggerHaptic('error');
    }
  });

  return {
    quests,
    questPoints,
    isLoading,
    incrementQuest: (questId: string, amount = 1) => incrementQuest.mutate({ questId, amount }),
    claimReward: (questId: string) => claimReward.mutate(questId),
    isClaiming: claimReward.isPending,
  };
}
