import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Heart, X, Sparkles, Briefcase, Moon, Volume2, SprayCan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';

interface RoommateCandidate {
  user_id: string;
  name: string | null;
  age: number | null;
  bio: string | null;
  gender: string | null;
  nationality: string | null;
  city: string | null;
  neighborhood: string | null;
  work_schedule: string | null;
  cleanliness_level: string | null;
  noise_tolerance: string | null;
  smoking_habit: string | null;
  interests: any[];
  languages: any[];
  profile_images: any[];
  compatibility: number;
}

function calculateCompatibility(me: any, other: any): number {
  let score = 50; // Base
  // Schedule match
  if (me.work_schedule && other.work_schedule && me.work_schedule === other.work_schedule) score += 15;
  // Cleanliness match
  if (me.cleanliness_level && other.cleanliness_level && me.cleanliness_level === other.cleanliness_level) score += 15;
  // Noise tolerance match
  if (me.noise_tolerance && other.noise_tolerance && me.noise_tolerance === other.noise_tolerance) score += 10;
  // Smoking match
  if (me.smoking_habit === other.smoking_habit) score += 10;
  // Shared interests
  const myInterests = Array.isArray(me.interests) ? me.interests : [];
  const theirInterests = Array.isArray(other.interests) ? other.interests : [];
  const shared = myInterests.filter((i: string) => theirInterests.includes(i)).length;
  score += Math.min(shared * 5, 20);
  // Neighborhood match
  if (me.neighborhood && other.neighborhood && me.neighborhood === other.neighborhood) score += 10;
  return Math.min(score, 99);
}

export default function RoommateMatching() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<RoommateCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCandidates();
  }, [user]);

  const fetchCandidates = async () => {
    if (!user) return;
    // Fetch my profile
    const { data: myData } = await supabase.from('client_profiles').select('*').eq('user_id', user.id).maybeSingle();
    setMyProfile(myData);

    // Fetch other profiles (excluding self)
    const { data: others } = await supabase
      .from('client_profiles')
      .select('*')
      .neq('user_id', user.id)
      .limit(50);

    // Already swiped
    const { data: swiped } = await supabase
      .from('roommate_matches')
      .select('target_user_id')
      .eq('user_id', user.id);
    const swipedIds = new Set((swiped || []).map((s: any) => s.target_user_id));

    const scored = (others || [])
      .filter(o => !swipedIds.has(o.user_id))
      .map(o => ({
        ...o,
        interests: Array.isArray(o.interests) ? o.interests : [],
        languages: Array.isArray(o.languages) ? o.languages : [],
        profile_images: Array.isArray(o.profile_images) ? o.profile_images : [],
        compatibility: calculateCompatibility(myData || {}, o),
      }))
      .sort((a, b) => b.compatibility - a.compatibility);

    setCandidates(scored as RoommateCandidate[]);
    setIsLoading(false);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || currentIndex >= candidates.length) return;
    const target = candidates[currentIndex];
    setSwipeDirection(direction);

    await supabase.from('roommate_matches').insert({
      user_id: user.id,
      target_user_id: target.user_id,
      direction,
      compatibility_score: target.compatibility,
    });

    // Check for mutual match
    if (direction === 'right') {
      const { data: mutual } = await supabase
        .from('roommate_matches')
        .select('id')
        .eq('user_id', target.user_id)
        .eq('target_user_id', user.id)
        .eq('direction', 'right')
        .maybeSingle();
      if (mutual) {
        toast.success(`🎉 You matched with ${target.name || 'a roommate'}! Start chatting.`);
      }
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const current = candidates[currentIndex];

  const getImageUrl = (candidate: RoommateCandidate) => {
    if (candidate.profile_images.length > 0) return candidate.profile_images[0];
    return `https://api.dicebear.com/7.x/initials/svg?seed=${candidate.name || 'U'}`;
  };

  const TraitPill = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/50 text-xs">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-foreground/80">{value}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto">
      <PageHeader
        title="Roommate Match"
        subtitle="Find compatible roommates based on lifestyle"
      />

      {isLoading ? (
        <div className="h-[400px] rounded-3xl bg-card animate-pulse" />
      ) : !current ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Users className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-lg font-bold text-foreground">No more candidates</h2>
          <p className="text-sm text-muted-foreground text-center">Check back later for new potential roommates</p>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.user_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ 
                opacity: 0, 
                x: swipeDirection === 'right' ? 200 : swipeDirection === 'left' ? -200 : 0,
                rotate: swipeDirection === 'right' ? 10 : swipeDirection === 'left' ? -10 : 0
              }}
              className="relative rounded-3xl overflow-hidden bg-card border border-border/30"
            >
              {/* Photo */}
              <div className="h-56 relative">
                <img src={getImageUrl(current)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent" />
                {/* Compatibility badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-bold text-white">{current.compatibility}%</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {current.name || 'Anonymous'}{current.age ? `, ${current.age}` : ''}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {[current.nationality, current.neighborhood || current.city].filter(Boolean).join(' · ')}
                  </p>
                </div>

                {current.bio && <p className="text-xs text-muted-foreground line-clamp-2">{current.bio}</p>}

                <div className="flex flex-wrap gap-1.5">
                  <TraitPill icon={Briefcase} label="Schedule" value={current.work_schedule} />
                  <TraitPill icon={SprayCan} label="Clean" value={current.cleanliness_level} />
                  <TraitPill icon={Volume2} label="Noise" value={current.noise_tolerance} />
                  <TraitPill icon={Moon} label="Smoking" value={current.smoking_habit} />
                </div>

                {current.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {current.interests.slice(0, 6).map((interest: string, i: number) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full bg-card border-2 border-red-500/30 flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            >
              <X className="w-7 h-7 text-red-500" />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full bg-card border-2 border-green-500/30 flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            >
              <Heart className="w-7 h-7 text-green-500" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            {candidates.length - currentIndex - 1} more candidates
          </p>
        </>
      )}
    </div>
  );
}
