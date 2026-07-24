import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Gift, Sparkles, Target, Zap } from 'lucide-react';
import { useDailyQuests, DailyQuest } from '@/hooks/useDailyQuests';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const DailyQuestBoard = () => {
  const { quests, questPoints, isLoading, claimReward, isClaiming } = useDailyQuests();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Sort quests: uncompleted first, then completed but unclaimed, then claimed
  const sortedQuests = useMemo(() => {
    return [...quests].sort((a, b) => {
      if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
      const aCompleted = a.progress >= a.goal;
      const bCompleted = b.progress >= b.goal;
      if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;
      return 0;
    });
  }, [quests]);

  if (isLoading) return null; // Or a skeleton

  const pointsNeeded = 10;
  const currentPoints = questPoints || 0;
  const progressPercent = Math.min((currentPoints / pointsNeeded) * 100, 100);

  return (
    <div className="w-full relative isolate p-4 rounded-3xl overflow-hidden glass-nano-texture mb-6">
      {/* Dynamic ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 z-[-1]" />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl z-[-1]" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[64px] z-[-1]" />

      <div className="flex flex-col gap-4 relative z-10">
        
        {/* Header & Master Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Daily Quests
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {currentPoints} / {pointsNeeded}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full pointer-events-none">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 pt-2">
                  <Progress value={progressPercent} className="h-2.5 w-full bg-black/10 dark:bg-white/10" />
                  <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                    <span>Earn {pointsNeeded} points to unlock a free token!</span>
                    {currentPoints >= pointsNeeded && <span className="text-primary animate-pulse">Token ready!</span>}
                  </p>
                </div>

                {/* Quest List */}
                <div className="flex flex-col gap-2 mt-4">
                  <AnimatePresence mode="popLayout">
                    {sortedQuests.map((quest) => (
                      <QuestItem 
                        key={quest.id} 
                        quest={quest} 
                        onClaim={() => claimReward(quest.id)}
                        isClaiming={isClaiming}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

const QuestItem = ({ quest, onClaim, isClaiming }: { quest: DailyQuest, onClaim: () => void, isClaiming: boolean }) => {
  const isCompleted = quest.progress >= quest.goal;
  const isClaimed = quest.claimed;
  
  const getIcon = () => {
    if (isClaimed) return <Check className="w-4 h-4 text-white" />;
    if (quest.id === 'login') return <Zap className="w-4 h-4 text-yellow-500" />;
    if (quest.id === 'swipe') return <Target className="w-4 h-4 text-blue-500" />;
    return <Sparkles className="w-4 h-4 text-pink-500" />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-2xl border transition-all duration-300",
        isClaimed 
          ? "bg-muted/30 border-transparent opacity-60" 
          : "bg-background/80 border-border/50 shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          isClaimed ? "bg-green-500" : "bg-muted"
        )}>
          {getIcon()}
        </div>
        
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-semibold",
            isClaimed && "line-through text-muted-foreground"
          )}>
            {quest.title}
          </span>
          {!isClaimed && (
            <span className="text-xs text-muted-foreground font-medium">
              {quest.progress} / {quest.goal}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {!isClaimed ? (
          <span className="text-xs font-bold text-primary mr-1">
            +{quest.points} pts
          </span>
        ) : null}

        {isCompleted && !isClaimed ? (
          <Button 
            size="sm" 
            onClick={onClaim}
            disabled={isClaiming}
            className="rounded-full h-8 px-4 font-bold shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-transform"
          >
            Claim
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
};
