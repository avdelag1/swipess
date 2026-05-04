/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, TrendingUp, Zap, Sparkles, ShieldCheck, Clock, Flame, 
  MapPin, ArrowLeft, X, Award, Info, Home, Car, Ship, Bike, 
  Target, Briefcase, User, Calendar, DollarSign, Heart, Share2, 
  MoreHorizontal, MessageCircle, Star, Shield, Layout, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { useStartConversation } from '@/hooks/useConversations';
import { useState, useMemo } from 'react';
import useAppTheme from '@/hooks/useAppTheme';
import { logger } from '@/utils/prodLogger';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useUserRatingAggregate } from '@/hooks/useRatingSystem';
import { CompactRatingDisplay } from '@/components/RatingDisplay';

export default function OwnerViewClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const startConversation = useStartConversation();
  const { data: ratingAggregate, isLoading: isRatingLoading } = useUserRatingAggregate(clientId);
  const { isLight } = useAppTheme();

  const { data: client, isLoading, error: _error } = useQuery({
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
        .select('profile_images, name, age, bio')
        .eq('user_id', clientId)
        .maybeSingle();

      if (clientProfile?.profile_images && Array.isArray(clientProfile.profile_images) && clientProfile.profile_images.length > 0) {
        profileData.images = clientProfile.profile_images;
      }

      if (clientProfile?.name) profileData.full_name = clientProfile.name;
      if (clientProfile?.age) profileData.age = clientProfile.age;
      if (clientProfile?.bio) profileData.bio = clientProfile.bio;

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
    triggerHaptic('medium');
    setIsCreatingConversation(true);
    
    try {
      toast.loading('Starting conversation...', { id: 'start-conv' });
      const result = await startConversation.mutateAsync({
        otherUserId: clientId,
        initialMessage: "Hi! I saw your profile and would like to connect.",
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        toast.success('Opening chat...', { id: 'start-conv' });
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      toast.error('Could not start conversation', { id: 'start-conv' });
    } finally {
      setIsCreatingConversation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
           <User className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Client Not Found</h2>
        <p className="text-white/40 text-sm mb-8 uppercase tracking-widest">The profile you are looking for is unavailable.</p>
        <Button onClick={() => navigate(-1)} className="rounded-2xl bg-white text-black font-black px-8 h-14 uppercase tracking-widest">
          Return to Deck
        </Button>
      </div>
    );
  }


  return (
    <div
      className={cn(
        "min-h-screen overflow-x-hidden relative selection:bg-primary/30",
        isLight ? "bg-background text-foreground" : "bg-[#020202] text-white",
      )}
    >
      {!isLight && <AtmosphericLayer variant="nexus" opacity={0.15} />}
      
      {/* 🛸 NEXUS HEADER */}
      <div className={cn(
        "sticky top-0 z-50 backdrop-blur-3xl border-b",
        isLight ? "bg-background/70 border-border/60" : "bg-black/40 border-white/5",
      )}>
        <div className="container max-w-[440px] mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#EB4898]/5 border border-[#EB4898]/20 backdrop-blur-xl">
             <Zap className="w-4 h-4 text-[#EB4898] fill-current animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] italic">Nexus Insights</span>
          </div>

          <button 
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container max-w-[440px] mx-auto px-4 pt-6 pb-40 space-y-6 relative z-10">
        
        {/* 💎 PROFILE HERO CARD */}
        <div className="p-6 rounded-[2.5rem] bg-zinc-950/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4D00]/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-[0.9] break-words max-w-[240px] italic">
                  {client.full_name || 'Anonymous'}
                </h1>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest italic">
                    {client.age ? `${client.age} • ` : ''}{client.city || 'Nexus Sector'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                  {Array.isArray((client as any).images) && (client as any).images[0] ? (
                    <img src={(client as any).images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                      <User className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-[#FF4D00]/20 border border-[#FF4D00]/30 shadow-[0_0_15px_rgba(255,77,0,0.2)]">
                   <span className="text-[10px] font-black uppercase tracking-tighter text-[#FF4D00] italic">Elite Rank</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-2 shadow-lg backdrop-blur-xl">
                  <CompactRatingDisplay aggregate={ratingAggregate || null} isLoading={isRatingLoading} showReviews={false} />
               </div>
                {(client as any).verified && (
                 <div className="px-4 py-2.5 rounded-2xl bg-[#EB4898]/10 border border-[#EB4898]/20 flex items-center gap-2 shadow-[0_0_20px_rgba(235,72,152,0.1)]">
                    <ShieldCheck className="w-4 h-4 text-[#EB4898]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] italic">Verified</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* 📊 HERO STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-6 rounded-[32px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-xl group hover:bg-zinc-900/60 transition-all cursor-default">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center border border-[#FF4D00]/20">
                <Eye className="w-4 h-4 text-[#FF4D00]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Engagement</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{insights?.views}</div>
            <div className="flex items-center gap-1 mt-2 text-[#FF4D00]">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase italic">+{insights?.weeklyGrowth} Velocity</span>
            </div>
          </div>

          <div className="p-6 rounded-[32px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-xl group hover:bg-zinc-900/60 transition-all cursor-default">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20">
                <Zap className="w-4 h-4 text-[#EB4898] fill-current" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Nexus Parity</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{insights?.qualityScore}/10</div>
            <div className="flex items-center gap-1 mt-2 text-[#EB4898]">
              <Sparkles className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase italic">Platinum</span>
            </div>
          </div>
        </div>

        {/* 🎯 ANALYTICS SECTION */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-2 italic">Reliability Profile</h3>
          
          <div className="space-y-3">
            <div className="p-6 rounded-[32px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D00]/5 rounded-full blur-3xl -translate-y-8 translate-x-8" />
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shadow-lg">
                     <ShieldCheck className="w-6 h-6 text-[#FF4D00]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5 italic">Response Integrity</p>
                    <p className="text-xl font-black text-white uppercase tracking-tight italic">Active Communicator</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-[#FF4D00] tabular-nums italic">{insights?.responseRate}%</div>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${insights?.responseRate}%` }}
                  className="h-full bg-gradient-to-r from-[#FF4D00] to-[#EB4898] rounded-full shadow-[0_0_10px_rgba(255,77,0,0.3)]"
                />
              </div>
            </div>

            <div className="p-6 rounded-[32px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shadow-lg">
                     <Clock className="w-6 h-6 text-[#EB4898]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5 italic">Average Response</p>
                    <p className="text-xl font-black text-white uppercase tracking-tight italic">Instant Sync</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/20 shadow-[0_0_15px_rgba(235,72,152,0.1)]">
                  <span className="text-sm font-black text-[#EB4898] uppercase tracking-widest italic tabular-nums">&lt; {insights?.avgResponseTime}H</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📦 PREFERENCES / INTENT */}
        {preferences && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-2 italic">Market Demand</h3>
            
            <div className="space-y-3">
              {/* Property Intent */}
              {preferences.interested_in_properties && (
                <div className="p-6 rounded-[32px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#EB4898]/5 rounded-full blur-3xl -translate-y-8 translate-x-8" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-[22px] bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20 shadow-lg">
                      <Home className="w-7 h-7 text-[#EB4898]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5 italic">Sector Focus</p>
                      <p className="text-2xl font-black text-white uppercase tracking-tighter italic">Luxury Residential</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Target Budget</p>
                       <p className="text-lg font-black text-white tracking-tighter tabular-nums">
                         ${preferences.min_price?.toLocaleString() || '0'} - ${preferences.max_price?.toLocaleString() || '∞'}
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Specifications</p>
                       <p className="text-lg font-black text-white tracking-tighter uppercase italic">
                         {preferences.min_bedrooms || 0}+ BR • {preferences.min_bathrooms || 0}+ BA
                       </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Intent */}
              {preferences.interested_in_motorcycles && (
                <div className="p-6 rounded-[32px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D00]/5 rounded-full blur-3xl -translate-y-8 translate-x-8" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-[22px] bg-[#FF4D00]/10 flex items-center justify-center border border-[#FF4D00]/20 shadow-lg">
                      <Car className="w-7 h-7 text-[#FF4D00]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5 italic">Asset Interest</p>
                      <p className="text-2xl font-black text-white uppercase tracking-tighter italic">Premium Automotive</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {preferences.moto_types?.map(type => (
                      <div key={type} className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 shadow-md backdrop-blur-md italic">
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yacht Intent */}
              {preferences.interested_in_yachts && (
                <div className="p-6 rounded-[32px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#EB4898]/5 rounded-full blur-3xl -translate-y-8 translate-x-8" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-[22px] bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20 shadow-lg">
                      <Ship className="w-7 h-7 text-[#EB4898]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5 italic">Maritime Profile</p>
                      <p className="text-2xl font-black text-white uppercase tracking-tighter italic">Luxury Vessels</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/5 shadow-inner backdrop-blur-md">
                    <p className="text-[11px] text-white/60 font-bold uppercase tracking-widest leading-relaxed italic">
                      Seeking vessels <span className="text-white">{preferences.yacht_length_min || 0}ft+</span> in <span className="text-white">{preferences.yacht_condition?.[0] || 'Premium'}</span> condition.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎯 MARKET SENTIMENT */}
        <div className="space-y-4">
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-2 italic">Market Sentiment</h3>
           <div className={cn(
             "p-8 rounded-[40px] border shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all",
             insights?.demandLevel === 'high' 
               ? "bg-[#FF4D00]/10 border-[#FF4D00]/20 shadow-[0_0_40px_rgba(255,77,0,0.1)]" 
               : "bg-zinc-950/40 border-white/10"
           )}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[80px] -translate-y-24 translate-x-12" />
              <div className="flex items-center gap-5 mb-5 relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-[24px] flex items-center justify-center shadow-2xl transform -rotate-3 transition-colors",
                  insights?.demandLevel === 'high' ? "bg-[#FF4D00] text-white" : "bg-white text-black"
                )}>
                  {insights?.demandLevel === 'high' ? <Flame className="w-7 h-7 fill-current" /> : <TrendingUp className="w-7 h-7" />}
                </div>
                <div>
                  <p className="text-[12px] font-black text-white/50 uppercase tracking-widest leading-none mb-2 italic">Discovery Velocity</p>
                  <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">{insights?.demandLevel === 'high' ? 'High Traction' : 'Steady Growth'}</p>
                </div>
              </div>
              <p className="text-[12px] text-white/50 font-bold leading-relaxed uppercase tracking-wide italic relative z-10">
                {insights?.demandLevel === 'high' 
                  ? 'This profile is currently receiving peak engagement from elite owners. Secure a connection before availability shifts.' 
                  : 'A reliable prospect with consistent platform presence. Ideal for owners seeking stable, high-value connections.'}
              </p>
           </div>
        </div>

        {/* 📦 CONFIG DETAILS */}
        <div className="space-y-4 pb-8">
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-2 italic">Profile Analytics</h3>
           <div className="grid grid-cols-2 gap-3">
              <div className="p-5 rounded-[28px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 flex items-center gap-4 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shadow-md">
                   <Award className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1.5 italic">Tier</p>
                   <p className="text-base font-black text-white uppercase tracking-tight italic">Top 1%</p>
                </div>
              </div>
              <div className="p-5 rounded-[28px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 flex items-center gap-4 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shadow-md">
                   <Shield className="w-5 h-5 text-[#EB4898]" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1.5 italic">Health</p>
                   <p className="text-base font-black text-white uppercase tracking-tight italic">Prime</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 🛸 SINGLE MESSAGE FAB — Insights page only allows messaging */}
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
    </div>
  );
}
