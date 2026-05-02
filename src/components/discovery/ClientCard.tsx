import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User } from 'lucide-react';
import { SaveButton } from '@/components/SaveButton';
import { triggerHaptic } from '@/utils/haptics';
import { MatchedClientProfile } from '@/hooks/useSmartMatching';
import { SwipessLogo } from '@/components/SwipessLogo';
import { cn } from '@/lib/utils';
import { getCardImageUrl } from '@/utils/imageOptimization';

interface ClientCardProps {
  client: MatchedClientProfile;
  onConnect: (clientId: string) => void;
  onViewProfile: (clientId: string) => void;
}

export const ClientCard = memo(({ client, onConnect, onViewProfile }: ClientCardProps) => {
  const imageUrl = client.avatar_url || (client as any).profile_images?.[0];
  const optimizedImage = imageUrl ? getCardImageUrl(imageUrl, 600) : null;

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] rounded-[32px] overflow-hidden group shadow-2xl bg-black">
      {/* Background Layer */}
      {optimizedImage ? (
        <img 
          src={optimizedImage} 
          alt={client.name || 'Client'} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="scale-75 opacity-40 mb-6">
             <SwipessLogo isIcon={false} size="md" variant="white" />
          </div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">
            Waiting for users to upload their photos
          </p>
        </div>
      )}

      {/* Dark Vignette Overlay for Text Legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute top-5 left-5 flex gap-2 z-10">
        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
           <span className="text-[9px] font-black text-[#EB4898] tracking-widest uppercase">{client.matchPercentage}% Match</span>
        </div>
      </div>

      {/* Content Layer (Bottom Left Aligned) */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end z-10 pointer-events-none">
        {/* Name and Age */}
        <div className="flex items-end gap-2.5 mb-1.5">
          <h3 className="text-3xl font-black text-white leading-none tracking-tighter">
            {client.name || 'Unknown'}
          </h3>
          {client.age && (
            <span className="text-2xl font-medium text-white/90 leading-none">
              {client.age}
            </span>
          )}
          {client.verified && (
            <div className="mb-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
               <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>

        {/* Location & Tags */}
        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-3">
          {client.city || 'Location not set'}
        </p>

        {/* Insight Pills */}
        {client.matchReasons && client.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {client.matchReasons.slice(0, 3).map((reason, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] font-bold py-1 px-3 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full whitespace-nowrap">
                {reason}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2 pointer-events-auto">
          <button 
            onClick={() => {
              triggerHaptic('light');
              onViewProfile(client.user_id);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95 shrink-0"
            title="Profile details"
          >
            <User className="w-5 h-5" />
          </button>

          <button 
            onClick={() => {
              triggerHaptic('light');
              onConnect(client.user_id);
            }}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-full text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-700 shadow-lg shadow-indigo-500/25"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Connect</span>
          </button>

          <SaveButton 
            targetId={client.user_id}
            targetType="profile"
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shrink-0 text-white"
            variant="circular"
          />
        </div>
      </div>
    </div>
  );
});


