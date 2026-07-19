/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  _Bike, _Briefcase, _Calendar, _DollarSign, _Heart, _Info, _Layout, 
  _MoreHorizontal, _Settings, _Share2, _Star, _Target, ArrowLeft, Award, Car, Clock, 
  Eye, Flame, Home, MapPin, MessageCircle, Shield, ShieldCheck, 
  Ship, Sparkles, TrendingUp, User, X, Zap
} from 'lucide-react';
import { appToast } from '@/utils/appNotification';
import { ProfileCardSkeleton } from '@/components/ui/ContentSkeleton';
import { ClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { useStartConversation } from '@/hooks/useConversations';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { guardNewConversation, handleStartConversationError } from '@/utils/messagingQuotaUX';
import { useMemo, useState } from 'react';
import useAppTheme from '@/hooks/useAppTheme';
// import { } from '@/utils/prodLogger';
import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useUserRatingAggregate } from '@/hooks/useRatingSystem';
import { CompactRatingDisplay } from '@/components/RatingDisplay';
import { ConnectingOverlay } from '@/components/ConnectingOverlay';
import { CLIENT_INTENTION_OPTIONS } from '@/constants/profileConstants';

export default function OwnerViewClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const startConversation = useStartConversation();
  const { canStartNewConversation } = useMessagingQuota();
  const { data: ratingAggregate, isLoading: isRatingLoading } = useUserRatingAggregate(clientId);
  const { isLight } = useAppTheme();

  const { data: client, isLoading, isError, refetch } = useQuery({
    queryKey: ['client-profile', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No client ID provided');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', clientId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');

      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('profile_images, name, age, bio, intentions')
        .eq('user_id', clientId)
        .maybeSingle();

      if (clientProfile?.profile_images && Array.isArray(clientProfile.profile_images) && clientProfile.profile_images.length > 0) {
        profileData.images = clientProfile.profile_images;
      }

      if (clientProfile?.name) profileData.full_name = clientProfile.name;
      if (clientProfile?.age) profileData.age = clientProfile.age;
      if (clientProfile?.bio) profileData.bio = clientProfile.bio;
      if (Array.isArray((clientProfile as any)?.intentions)) (profileData as any).intentions = (clientProfile as any).intentions;

      return profileData;
    },
    enabled: !!clientId,
  });

  const { data: preferences } = useQuery({
    queryKey: ['client-filter-preferences', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_filter_preferences')
        .select('*')
        .eq('user_id', clientId!)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ClientFilterPreferences | null;
    },
    enabled: !!clientId,
  });

  const insights = useMemo(() => {
    if (!client) return null;
    const imgs = (client as any).images;
    const imgCount = Array.isArray(imgs) ? imgs.length : 0;
    const completeness = imgCount * 20 + (client.bio ? 20 : 0);
    return {
      views: Math.floor(Math.random() * 50) + 120,
      weeklyGrowth: Math.floor(Math.random() * 15) + 5,
      responseRate: 98,
      avgResponseTime: 1.2,
      qualityScore: Math.min(10, Math.floor((completeness / 10) + 5)),
      demandLevel: completeness > 60 ? 'high' : 'medium'
    };
  }, [client]);

  const handleConnect = async () => {
    if (!clientId || isCreatingConversation) return;
    if (!guardNewConversation(canStartNewConversation)) return;
    triggerHaptic('medium');
    setIsCreatingConversation(true);
    
    try {
      appToast.info('Starting conversation...');
      const result = await startConversation.mutateAsync({
        otherUserId: clientId,
        initialMessage: "Hi! I saw your profile and would like to connect.",
        canStartNewConversation,
      });

      if (result?.conversationId) {
        setIsConnecting(true);
        
        // Premium cinematic delay
        
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      handleStartConversationError(error);
    } finally {
      setIsCreatingConversation(false);
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <ProfileCardSkeleton />
      </div>
    );
  }

  if (isError && !client) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4", isLight ? "bg-background" : "bg-black")}>
        <p className="text-sm font-semibold text-muted-foreground">Could not load client profile.</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-6 text-center", isLight ? "bg-background" : "bg-black")}>
        <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10")}>
           <User className={cn("w-10 h-10", isLight ? "text-black/20" : "text-white/20")} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-foreground">Client Not Found</h2>
        <p className={cn("text-sm mb-8 uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>The profile you are looking for is unavailable.</p>
        <Button onClick={() => navigate(-1)} className="rounded-2xl bg-foreground text-background font-black px-8 h-14 uppercase tracking-widest">
          Return to Deck
        </Button>
      </div>
    );
  }


  return (
    <AmbientPageBackground
      className={cn(
        "min-h-screen overflow-x-hidden relative selection:bg-primary/30",
        isLight ? "bg-background text-foreground" : "bg-[#020202] text-white",
      )}
    >
      <div className={cn(
        "sticky top-[var(--top-bar-height)] z-50 border-b transition-all duration-300",
        isLight ? "bg-white/70 backdrop-blur-xl border-black/5 shadow-sm" : "bg-black/40 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
      )}>
        <div className="container max-w-[440px] mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90", isLight ? "bg-slate-50 border border-slate-200 text-black/40 hover:bg-slate-100 hover:text-black" : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#EB4898]/5 border border-[#EB4898]/20 backdrop-blur-xl">
             <Zap className="w-4 h-4 text-[#EB4898] fill-current animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] italic">Swipes Insights</span>
          </div>

          <button 
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90", isLight ? "bg-slate-50 border border-slate-200 text-black/40 hover:bg-slate-100 hover:text-black" : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container max-w-[440px] mx-auto px-4 pt-6 pb-40 space-y-6 relative z-10">
        
        {/* ðŸ’Ž PROFILE HERO CARD */}
        <div className={cn(
          "p-6 rounded-[2.5rem] border relative overflow-hidden group transition-all duration-300",
          isLight ? "bg-white/70 backdrop-blur-xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)]" : "bg-black/40 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        )}>
          <div className="space-y-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-[0.9] break-words max-w-[240px] italic">
                  {client.full_name || 'Anonymous'}
                </h1>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <p className={cn("text-[11px] font-bold uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/40")}>
                    {client.age ? `${client.age} · ` : ''}{client.city || 'Swipes Sector'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className={cn("w-20 h-20 rounded-[28px] overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform cursor-pointer border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10")}>
                  {Array.isArray((client as any).images) && (client as any).images[0] ? (
                    <img src={(client as any).images[0]} alt={(client as any).full_name || 'Client profile photo'} className="w-full h-full object-cover" />
                  ) : (
                    <div className={cn("w-full h-full flex items-center justify-center", isLight ? "bg-slate-50" : "bg-white/[0.02]")}>
                      <User className={cn("w-8 h-8", isLight ? "text-black/20" : "text-white/10")} />
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-[#FF4D00]/20 border border-[#FF4D00]/30">
                   <span className="text-[10px] font-black uppercase tracking-tighter text-[#FF4D00] italic">Elite Rank</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <div className={cn("px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg", isLight ? "bg-slate-50 border border-slate-200" : "bg-black/60 border border-white/10 backdrop-blur-xl")}>
                  <CompactRatingDisplay aggregate={ratingAggregate || null} isLoading={isRatingLoading} showReviews={false} />
               </div>
                {(client as any).verified && (
                 <div className="px-4 py-2.5 rounded-2xl bg-[#EB4898]/10 border border-[#EB4898]/20 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#EB4898]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] italic">Verified</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* 📝 ABOUT + LOOKING FOR — what the client wrote and what they want */}
        {((client as any).bio || (Array.isArray((client as any).intentions) && (client as any).intentions.length > 0)) && (
          <div className={cn("p-6 rounded-[32px] shadow-xl space-y-4 transition-all duration-300", isLight ? "bg-white/70 backdrop-blur-xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)]" : "bg-black/40 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]")}>
            {(client as any).bio && (
              <div className="space-y-2">
                <span className={cn("text-[10px] font-black uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/30")}>About</span>
                <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", isLight ? "text-black/80" : "text-white/80")}>{(client as any).bio}</p>
              </div>
            )}
            {Array.isArray((client as any).intentions) && (client as any).intentions.length > 0 && (
              <div className="space-y-2">
                <span className={cn("text-[10px] font-black uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/30")}>Looking For</span>
                <div className="flex flex-wrap gap-2">
                  {((client as any).intentions as string[]).map((intentionId) => {
                    const option = CLIENT_INTENTION_OPTIONS.find(o => o.id === intentionId);
                    return (
                      <span key={intentionId} className="px-3 py-1.5 rounded-full bg-[#EB4898]/10 border border-[#EB4898]/25 text-[11px] font-bold text-[#EB4898] uppercase tracking-wide">
                        {option?.label ?? intentionId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ðŸ“Š HERO STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn("p-6 rounded-[32px] shadow-xl group transition-all cursor-default", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10 hover:bg-zinc-900/60")}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center border border-[#FF4D00]/20">
                <Eye className="w-4 h-4 text-[#FF4D00]" />
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/30")}>Engagement</span>
            </div>
            <div className={cn("text-3xl font-black tabular-nums tracking-tighter", isLight ? "text-black" : "text-white")}>{insights?.views}</div>
            <div className="flex items-center gap-1 mt-2 text-[#FF4D00]">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase italic">+{insights?.weeklyGrowth} Velocity</span>
            </div>
          </div>

          <div className={cn("p-6 rounded-[32px] shadow-xl group transition-all cursor-default", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10 hover:bg-zinc-900/60")}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20">
                <Zap className="w-4 h-4 text-[#EB4898] fill-current" />
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/30")}>Swipes Parity</span>
            </div>
            <div className={cn("text-3xl font-black tabular-nums tracking-tighter", isLight ? "text-black" : "text-white")}>{insights?.qualityScore}/10</div>
            <div className="flex items-center gap-1 mt-2 text-[#EB4898]">
              <Sparkles className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase italic">Platinum</span>
            </div>
          </div>
        </div>

        {/* ðŸŽ¯ ANALYTICS SECTION */}
        <div className="space-y-4">
          <h3 className={cn("text-[11px] font-black uppercase tracking-[0.2em] ml-2 italic", isLight ? "text-black/40" : "text-white/30")}>Reliability Profile</h3>
          
          <div className="space-y-3">
            <div className={cn("p-6 rounded-[32px] shadow-2xl relative overflow-hidden group", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10")}>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-black/60 border-white/10")}>
                     <ShieldCheck className="w-6 h-6 text-[#FF4D00]" />
                  </div>
                  <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic", isLight ? "text-black/40" : "text-white/40")}>Response Integrity</p>
                    <p className={cn("text-xl font-black uppercase tracking-tight italic", isLight ? "text-black" : "text-white")}>Active Communicator</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-[#FF4D00] tabular-nums italic">{insights?.responseRate}%</div>
              </div>
              <div className={cn("w-full h-2.5 rounded-full overflow-hidden shadow-inner border", isLight ? "bg-slate-200 border-slate-200" : "bg-black/40 border-white/5")}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${insights?.responseRate}%` }}
                  className="h-full bg-gradient-to-r from-[#FF4D00] to-[#EB4898] rounded-full"
                />
              </div>
            </div>

            <div className={cn("p-6 rounded-[32px] shadow-xl", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-black/60 border-white/10")}>
                     <Clock className="w-6 h-6 text-[#EB4898]" />
                  </div>
                  <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic", isLight ? "text-black/40" : "text-white/40")}>Average Response</p>
                    <p className={cn("text-xl font-black uppercase tracking-tight italic", isLight ? "text-black" : "text-white")}>Instant Sync</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/20">
                  <span className="text-sm font-black text-[#EB4898] uppercase tracking-widest italic tabular-nums">&lt; {insights?.avgResponseTime}H</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ðŸ“¦ PREFERENCES / INTENT */}
        {preferences && (
          <div className="space-y-4">
            <h3 className={cn("text-[11px] font-black uppercase tracking-[0.2em] ml-2 italic", isLight ? "text-black/40" : "text-white/30")}>Market Demand</h3>
            
            <div className="space-y-3">
              {/* Property Intent */}
              {preferences.interested_in_properties && (
                <div className={cn("p-6 rounded-[32px] shadow-2xl relative overflow-hidden group", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10")}>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-[22px] bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20 shadow-lg">
                      <Home className="w-7 h-7 text-[#EB4898]" />
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic", isLight ? "text-black/40" : "text-white/40")}>Sector Focus</p>
                      <p className={cn("text-2xl font-black uppercase tracking-tighter italic", isLight ? "text-black" : "text-white")}>Luxury Residential</p>
                    </div>
                  </div>
                  
                  <div className={cn("grid grid-cols-2 gap-6 pt-6 border-t", isLight ? "border-slate-200" : "border-white/5")}>
                    <div className="space-y-1">
                       <p className={cn("text-[9px] font-black uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/30")}>Target Budget</p>
                       <p className={cn("text-lg font-black tracking-tighter tabular-nums", isLight ? "text-black" : "text-white")}>
                         ${preferences.min_price?.toLocaleString() || '0'} - ${preferences.max_price?.toLocaleString() || 'âˆž'}
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className={cn("text-[9px] font-black uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/30")}>Specifications</p>
                       <p className={cn("text-lg font-black tracking-tighter uppercase italic", isLight ? "text-black" : "text-white")}>
                         {preferences.min_bedrooms || 0}+ BR · {preferences.min_bathrooms || 0}+ BA
                       </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Intent */}
              {preferences.interested_in_motorcycles && (
                <div className={cn("p-6 rounded-[32px] shadow-2xl relative overflow-hidden group", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10")}>
    
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-[22px] bg-[#FF4D00]/10 flex items-center justify-center border border-[#FF4D00]/20 shadow-lg">
                      <Car className="w-7 h-7 text-[#FF4D00]" />
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic", isLight ? "text-black/40" : "text-white/40")}>Asset Interest</p>
                      <p className={cn("text-2xl font-black uppercase tracking-tighter italic", isLight ? "text-black" : "text-white")}>Premium Automotive</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {preferences.moto_types?.map(type => (
                      <div key={type} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md italic border", isLight ? "bg-slate-50 border-slate-200 text-black/70" : "bg-black/60 border-white/10 text-white/70 backdrop-blur-md")}>
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yacht Intent */}
              {preferences.interested_in_yachts && (
                <div className={cn("p-6 rounded-[32px] shadow-2xl relative overflow-hidden group", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10")}>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-[22px] bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20 shadow-lg">
                      <Ship className="w-7 h-7 text-[#EB4898]" />
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic", isLight ? "text-black/40" : "text-white/40")}>Maritime Profile</p>
                      <p className={cn("text-2xl font-black uppercase tracking-tighter italic", isLight ? "text-black" : "text-white")}>Luxury Vessels</p>
                    </div>
                  </div>
                  
                  <div className={cn("p-4 rounded-2xl shadow-inner border", isLight ? "bg-slate-50 border-slate-200" : "bg-black/60 border-white/5 backdrop-blur-md")}>
                    <p className={cn("text-[11px] font-bold uppercase tracking-widest leading-relaxed italic", isLight ? "text-black/50" : "text-white/60")}>
                      Seeking vessels <span className={isLight ? "text-black" : "text-white"}>{preferences.yacht_length_min || 0}ft+</span> in <span className={isLight ? "text-black" : "text-white"}>{preferences.yacht_condition?.[0] || 'Premium'}</span> condition.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ðŸŽ¯ MARKET SENTIMENT */}
        <div className="space-y-4">
           <h3 className={cn("text-[11px] font-black uppercase tracking-[0.2em] ml-2 italic", isLight ? "text-black/40" : "text-white/30")}>Market Sentiment</h3>
           <div className={cn(
             "p-8 rounded-[40px] border shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all",
             insights?.demandLevel === 'high'
               ? "bg-[#FF4D00]/10 border-[#FF4D00]/20"
               : isLight ? "bg-white/80 border-slate-200" : "bg-zinc-950/40 border-white/10"
           )}>

              <div className="flex items-center gap-5 mb-5 relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-[24px] flex items-center justify-center shadow-2xl transform -rotate-3 transition-colors",
                  insights?.demandLevel === 'high' ? "bg-[#FF4D00] text-white" : "bg-white text-black"
                )}>
                  {insights?.demandLevel === 'high' ? <Flame className="w-7 h-7 fill-current" /> : <TrendingUp className="w-7 h-7" />}
                </div>
                <div>
                  <p className={cn("text-[12px] font-black uppercase tracking-widest leading-none mb-2 italic", isLight ? "text-black/50" : "text-white/50")}>Discovery Velocity</p>
                  <p className={cn("text-2xl font-black uppercase tracking-tighter leading-none italic", isLight ? "text-black" : "text-white")}>{insights?.demandLevel === 'high' ? 'High Traction' : 'Steady Growth'}</p>
                </div>
              </div>
              <p className={cn("text-[12px] font-bold leading-relaxed uppercase tracking-wide italic relative z-10", isLight ? "text-black/50" : "text-white/50")}>
                {insights?.demandLevel === 'high' 
                  ? 'This profile is currently receiving peak engagement from elite owners. Secure a connection before availability shifts.' 
                  : 'A reliable prospect with consistent platform presence. Ideal for owners seeking stable, high-value connections.'}
              </p>
           </div>
        </div>

        {/* ðŸ“¦ CONFIG DETAILS */}
        <div className="space-y-4 pb-8">
           <h3 className={cn("text-[11px] font-black uppercase tracking-[0.2em] ml-2 italic", isLight ? "text-black/40" : "text-white/30")}>Profile Analytics</h3>
           <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-5 rounded-[28px] flex items-center gap-4 shadow-xl", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md border", isLight ? "bg-slate-50 border-slate-200" : "bg-black/60 border-white/10")}>
                   <Award className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <div>
                   <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic", isLight ? "text-black/40" : "text-white/30")}>Tier</p>
                   <p className={cn("text-base font-black uppercase tracking-tight italic", isLight ? "text-black" : "text-white")}>Top 1%</p>
                </div>
              </div>
              <div className={cn("p-5 rounded-[28px] flex items-center gap-4 shadow-xl", isLight ? "surface-section" : "bg-zinc-950/40 backdrop-blur-xl border border-white/10")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md border", isLight ? "bg-slate-50 border-slate-200" : "bg-black/60 border-white/10")}>
                   <Shield className="w-5 h-5 text-[#EB4898]" />
                </div>
                <div>
                   <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic", isLight ? "text-black/40" : "text-white/30")}>Health</p>
                   <p className={cn("text-base font-black uppercase tracking-tight italic", isLight ? "text-black" : "text-white")}>Prime</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* ðŸ›¸ SINGLE MESSAGE FAB â€” Insights page only allows messaging */}
      <div className="fixed bottom-[calc(var(--bottom-nav-height,64px)+20px)] left-0 right-0 z-[100] flex justify-center pointer-events-none">
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleConnect}
          disabled={isCreatingConversation}
          className="pointer-events-auto h-14 px-7 rounded-full flex items-center gap-3 font-black uppercase italic tracking-[0.2em] text-[12px] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 18px 40px hsl(var(--primary) / 0.45), inset 0 1px 0 hsl(var(--primary-foreground) / 0.3)',
          }}
        >
          <MessageCircle className="w-5 h-5" strokeWidth={2.4} />
          <span>Message</span>
        </motion.button>
      </div>
      
      <ConnectingOverlay 
        isOpen={isConnecting}
        recipientName={client.full_name || 'Client'}
      />
    </AmbientPageBackground>
  );
}
