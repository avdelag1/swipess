import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User } from 'lucide-react';
import { SaveButton } from '@/components/SaveButton';
import { triggerHaptic } from '@/utils/haptics';
import { MatchedClientProfile } from '@/hooks/useSmartMatching';

interface ClientCardProps {
  client: MatchedClientProfile;
  onConnect: (clientId: string) => void;
  onViewProfile: (clientId: string) => void;
}

export const ClientCard = memo(({ client, onConnect, onViewProfile }: ClientCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/40 bg-card/60 backdrop-blur-sm group rounded-3xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-14 w-14 ring-2 ring-border/20 group-hover:ring-primary/20 transition-all">
            <AvatarImage src={client.avatar_url || (client as any).profile_images?.[0]} />
            <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xl">
              {client.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg truncate tracking-tight">{client.name}</h3>
              {client.verified && (
                <Badge variant="default" className="text-[9px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {client.age} yrs • {client.city || 'Location not set'}
            </p>
          </div>
        </div>

        {/* Match Score Visualizer */}
        <div className="mb-4 bg-muted/20 p-3 rounded-2xl border border-border/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Compatibility</span>
            <span className="text-[10px] font-black text-primary uppercase">
              {client.matchPercentage}%
            </span>
          </div>
          <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${client.matchPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full"
            />
          </div>
        </div>

        {/* Match Reasons (Micro-tags) */}
        {client.matchReasons && client.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {client.matchReasons.slice(0, 3).map((reason, idx) => (
              <Badge key={idx} variant="outline" className="text-[8px] font-black uppercase tracking-tight py-0.5 px-2 bg-muted/20 border-border/10 text-muted-foreground">
                {reason}
              </Badge>
            ))}
          </div>
        )}

        {/* Action System */}
        <div className="flex items-center gap-2.5 pt-4 border-t border-border/40">
          <SaveButton 
            targetId={client.user_id}
            targetType="profile"
            className="w-12 h-12 rounded-2xl bg-muted/30 border border-border/10 backdrop-blur-md hover:bg-muted/50 transition-all"
            variant="circular"
          />
          
          <button 
            onClick={() => {
              triggerHaptic('light');
              onConnect(client.user_id);
            }}
            className="group relative flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 shadow-xl shadow-indigo-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-sweep" />
            <MessageCircle className="h-4 w-4" />
            <span>Connect</span>
          </button>

          <button 
            onClick={() => {
              triggerHaptic('light');
              onViewProfile(client.user_id);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/30 border border-border/10 text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-sm"
            title="Profile details"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
});


