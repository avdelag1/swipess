import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Sparkles, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from '@/components/SimpleOwnerSwipeCard';
import { SwipeActionButtonBar } from '@/components/SwipeActionButtonBar';
import { RoommateFiltersSheet, RoommateFilterState } from '@/components/filters/RoommateFiltersSheet';

interface RoommateCandidate {
  user_id: string;
  name: string | null;
  age: number | null;
  bio: string | null;
  gender: string | null;
  nationality: string | null;
  city: string | null;
  country: string | null;
  neighborhood: string | null;
  work_schedule: string | null;
  cleanliness_level: string | null;
  noise_tolerance: string | null;
  smoking_habit: string | null;
  drinking_habit: string | null;
  interests: string[];
  languages: string[];
  profile_images: string[];
  personality_traits: string[];
  preferred_activities: string[];
  compatibility: number;
}

function calculateCompatibility(me: any, other: any, prefs: RoommateFilterState | null): number {
  let score = 50;

  // Base matching
  if (me.work_schedule && other.work_schedule && me.work_schedule === other.work_schedule) score += 10;
  if (me.cleanliness_level && other.cleanliness_level && me.cleanliness_level === other.cleanliness_level) score += 10;
  if (me.noise_tolerance && other.noise_tolerance && me.noise_tolerance === other.noise_tolerance) score += 8;
  if (me.smoking_habit === other.smoking_habit) score += 8;

  const myInterests = Array.isArray(me.interests) ? me.interests : [];
  const theirInterests = Array.isArray(other.interests) ? other.interests : [];
  const shared = myInterests.filter((i: string) => theirInterests.includes(i)).length;
  score += Math.min(shared * 5, 15);

  if (me.neighborhood && other.neighborhood && me.neighborhood === other.neighborhood) score += 8;

  // Preference-weighted boosts
  if (prefs) {
    if (prefs.preferred_cleanliness && other.cleanliness_level === prefs.preferred_cleanliness) score += 10;
    if (prefs.preferred_noise_tolerance && other.noise_tolerance === prefs.preferred_noise_tolerance) score += 8;
    if (prefs.preferred_smoking && other.smoking_habit === prefs.preferred_smoking) score += 8;
    if (prefs.preferred_drinking && other.drinking_habit === prefs.preferred_drinking) score += 6;
    if (prefs.preferred_work_schedule && other.work_schedule === prefs.preferred_work_schedule) score += 8;
  }

  return Math.min(score, 99);
}

function applyPreferenceFilters(candidates: any[], prefs: RoommateFilterState | null): any[] {
  if (!prefs) return candidates;
  return candidates.filter(c => {
    // Gender filter
    if (prefs.preferred_gender.length > 0 && !prefs.preferred_gender.includes('Any Gender')) {
      if (c.gender && !prefs.preferred_gender.includes(c.gender)) return false;
    }
    // Age filter
    if (prefs.preferred_age_min && c.age && c.age < prefs.preferred_age_min) return false;
    if (prefs.preferred_age_max && c.age && c.age > prefs.preferred_age_max) return false;
    // Deal breakers
    if (prefs.deal_breakers.includes('Smoking indoors') && c.smoking_habit === 'regularly') return false;
    if (prefs.deal_breakers.includes('Pets') && c.has_children) return false; // rough proxy
    if (prefs.deal_breakers.includes('Loud music at night') && c.noise_tolerance === 'high') return false;
    return true;
  });
}

export default function RoommateMatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<RoommateCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [roommateAvailable, setRoommateAvailable] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [roommatePrefs, setRoommatePrefs] = useState<RoommateFilterState | null>(null);
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  useEffect(() => {
    if (!user) return;
    loadPreferences();
  }, [user]);

  // Re-fetch candidates when prefs change
  useEffect(() => {
    if (!user) return;
    fetchCandidates();
  }, [user, roommatePrefs]);

  const loadPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('roommate_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setRoommatePrefs({
        preferred_gender: Array.isArray(data.preferred_gender) ? data.preferred_gender as string[] : [],
        preferred_budget_min: data.preferred_budget_min ?? null,
        preferred_budget_max: data.preferred_budget_max ?? null,
        preferred_age_min: (data as any).preferred_age_min ?? null,
        preferred_age_max: (data as any).preferred_age_max ?? null,
        preferred_cleanliness: (data as any).preferred_cleanliness ?? null,
        preferred_noise_tolerance: (data as any).preferred_noise_tolerance ?? null,
        preferred_smoking: (data as any).preferred_smoking ?? null,
        preferred_drinking: (data as any).preferred_drinking ?? null,
        preferred_work_schedule: (data as any).preferred_work_schedule ?? null,
        deal_breakers: Array.isArray(data.deal_breakers) ? data.deal_breakers as string[] : [],
      });
    }
  };

  const fetchCandidates = async () => {
    if (!user) return;
    const { data: myData } = await supabase.from('client_profiles').select('*').eq('user_id', user.id).maybeSingle();
    setMyProfile(myData);
    setRoommateAvailable(myData?.roommate_available ?? false);

    const { data: others } = await supabase
      .from('client_profiles')
      .select('*')
      .neq('user_id', user.id)
      .eq('roommate_available', true)
      .limit(50);

    const { data: swiped } = await supabase
      .from('roommate_matches')
      .select('target_user_id')
      .eq('user_id', user.id);
    const swipedIds = new Set((swiped || []).map((s: any) => s.target_user_id));

    let pool = (others || []).filter(o => !swipedIds.has(o.user_id));

    // Apply preference filters
    pool = applyPreferenceFilters(pool, roommatePrefs);

    const scored = pool
      .map(o => ({
        user_id: o.user_id,
        name: o.name,
        age: o.age,
        bio: o.bio,
        gender: o.gender,
        nationality: o.nationality,
        city: o.city,
        country: o.country,
        neighborhood: o.neighborhood,
        work_schedule: o.work_schedule,
        cleanliness_level: o.cleanliness_level,
        noise_tolerance: o.noise_tolerance,
        smoking_habit: o.smoking_habit,
        drinking_habit: o.drinking_habit,
        interests: Array.isArray(o.interests) ? o.interests as string[] : [],
        languages: Array.isArray(o.languages) ? o.languages as string[] : [],
        profile_images: Array.isArray(o.profile_images) ? o.profile_images as string[] : [],
        personality_traits: Array.isArray(o.personality_traits) ? o.personality_traits as string[] : [],
        preferred_activities: Array.isArray(o.preferred_activities) ? o.preferred_activities as string[] : [],
        compatibility: calculateCompatibility(myData || {}, o, roommatePrefs),
      }))
      .sort((a, b) => b.compatibility - a.compatibility);

    setCandidates(scored);
    setCurrentIndex(0);
    setIsLoading(false);
  };

  const handleToggleRoommate = async (checked: boolean) => {
    if (!user) return;
    setRoommateAvailable(checked);
    await supabase
      .from('client_profiles')
      .update({ roommate_available: checked } as any)
      .eq('user_id', user.id);
    toast.success(checked ? 'You are now visible as a roommate!' : 'You are hidden from roommate search.');
  };

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!user || currentIndex >= candidates.length) return;
    const target = candidates[currentIndex];

    await supabase.from('roommate_matches').insert({
      user_id: user.id,
      target_user_id: target.user_id,
      direction,
      compatibility_score: target.compatibility,
    });

    if (direction === 'right') {
      const { data: mutual } = await supabase
        .from('roommate_matches')
        .select('id')
        .eq('user_id', target.user_id)
        .eq('target_user_id', user.id)
        .eq('direction', 'right')
        .maybeSingle();
      if (mutual) {
        // Create a conversation for matched roommates so they can chat
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(client_id.eq.${user.id},owner_id.eq.${target.user_id}),and(client_id.eq.${target.user_id},owner_id.eq.${user.id})`)
          .maybeSingle();

        let convId = existingConv?.id;
        if (!convId) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              client_id: user.id,
              owner_id: target.user_id,
              status: 'active',
            })
            .select('id')
            .single();
          convId = newConv?.id;
        }

        toast.success(`🎉 You matched with ${target.name || 'a roommate'}!`, {
          description: 'A chat has been opened — start the conversation.',
          action: {
            label: 'Chat now',
            onClick: () => navigate('/messages'),
          },
          duration: 6000,
        });
      }
    }

    setCurrentIndex(prev => prev + 1);
  }, [user, currentIndex, candidates]);

  const handleButtonLike = useCallback(() => {
    cardRef.current?.triggerSwipe('right');
  }, []);

  const handleButtonDislike = useCallback(() => {
    cardRef.current?.triggerSwipe('left');
  }, []);

  const handleApplyFilters = (newFilters: RoommateFilterState) => {
    setRoommatePrefs(newFilters);
  };

  const topCard = candidates[currentIndex];
  const nextCard = candidates[currentIndex + 1];

  const mapToCardProfile = (c: RoommateCandidate) => ({
    user_id: c.user_id,
    name: c.name,
    age: c.age,
    city: c.city,
    country: c.country,
    bio: c.bio,
    profile_images: c.profile_images,
    interests: c.interests,
    languages: c.languages,
    work_schedule: c.work_schedule,
    cleanliness_level: c.cleanliness_level,
    noise_tolerance: c.noise_tolerance,
    personality_traits: c.personality_traits,
    preferred_activities: c.preferred_activities,
  });

  const filterCount = roommatePrefs ? Object.values(roommatePrefs).filter(v =>
    Array.isArray(v) ? v.length > 0 : v !== null
  ).length : 0;

  return (
    <div className="relative w-full flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 flex items-center justify-between">
        <PageHeader title="Roommate Match" subtitle="Find compatible roommates" />
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative flex items-center justify-center h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 transition-colors hover:bg-card"
          >
            <SlidersHorizontal className="h-4 w-4 text-foreground" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
          {/* Visible toggle */}
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visible</span>
            <Switch checked={roommateAvailable} onCheckedChange={handleToggleRoommate} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-[400px] w-full max-w-md rounded-3xl bg-card animate-pulse" />
        </div>
      ) : !topCard ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <Users className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-lg font-bold text-foreground">No more candidates</h2>
          <p className="text-sm text-muted-foreground text-center">Check back later for new potential roommates</p>
        </div>
      ) : (
        <div className="relative flex-1 w-full">
          {nextCard && (
            <div key={`next-${nextCard.user_id}`} className="w-full h-full absolute inset-0" style={{ zIndex: 5, transform: 'scale(0.95)', opacity: 0.7, pointerEvents: 'none' }}>
              <SimpleOwnerSwipeCard profile={mapToCardProfile(nextCard)} onSwipe={() => {}} isTop={false} />
            </div>
          )}

          <div key={topCard.user_id} className="w-full h-full absolute inset-0" style={{ zIndex: 10 }}>
            <SimpleOwnerSwipeCard ref={cardRef} profile={mapToCardProfile(topCard)} onSwipe={handleSwipe} isTop={true} />
            <div className="absolute top-20 right-4 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-bold text-white">{topCard.compatibility}%</span>
            </div>
          </div>

          <div className="absolute left-0 right-0 flex justify-center z-30" style={{ bottom: 'clamp(88px, 14vh, 128px)' }}>
            <SwipeActionButtonBar onLike={handleButtonLike} onDislike={handleButtonDislike} />
          </div>
        </div>
      )}

      <RoommateFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={roommatePrefs ?? undefined}
      />
    </div>
  );
}
