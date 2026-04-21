import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ChevronLeft, MapPin, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function VapValidate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, isLight } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['vap-validate', id],
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, city, country, created_at')
        .eq('user_id', id!)
        .maybeSingle();
      if (!profile) return null;

      const { data: client } = await supabase
        .from('client_profiles')
        .select('occupation, nationality')
        .eq('user_id', id!)
        .maybeSingle();

      const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        name: profile.full_name || 'Resident',
        location: [profile.city, profile.country].filter(Boolean).join(', '),
        occupation: client?.occupation || '',
        nationality: client?.nationality || '',
        memberSince,
      };
    },
  });

  const isValid = !!data;

  return (
    <div className={cn(
      "min-h-screen w-full flex flex-col pt-12 pb-10 px-6",
      isLight ? "bg-zinc-50" : "bg-black"
    )}>
      <div className="w-full flex items-center justify-between mb-12">
        <button
          onClick={() => navigate('/')}
          className={cn("p-2 rounded-full", isLight ? "bg-white border border-black/5" : "bg-white/5 border border-white/5")}
        >
          <ChevronLeft className={cn("w-5 h-5", isLight ? "text-black" : "text-white")} />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn("w-5 h-5", isLight ? "text-primary" : "text-white")} />
          <span className={cn("text-xs font-bold tracking-widest uppercase", isLight ? "text-black/60" : "text-white/60")}>
            Nexus Resident Portal
          </span>
        </div>
        <div className="w-9" />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className={cn("w-8 h-8 animate-spin", isLight ? "text-zinc-400" : "text-zinc-600")} />
        </div>
      ) : isValid ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex-1 w-full max-w-sm mx-auto rounded-3xl p-8 flex flex-col items-center justify-center text-center",
            isLight ? "bg-white border border-black/5 shadow-xl" : "bg-zinc-900 border border-white/10 shadow-2xl"
          )}
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 ring-8 ring-green-500/5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className={cn("text-2xl font-bold mb-2", isLight ? "text-zinc-900" : "text-white")}>
            Valid Local Resident
          </h1>
          <p className={isLight ? "text-zinc-500" : "text-zinc-400"}>
            This Virtual Residency ID is active.
          </p>
          <div className={cn(
            "w-full mt-8 rounded-2xl p-6 text-left space-y-4",
            isLight ? "bg-zinc-50 border border-black/5" : "bg-black/40 border border-white/5"
          )}>
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", isLight ? "text-zinc-400" : "text-zinc-500")}>Name</p>
              <p className={cn("text-base font-medium", isLight ? "text-zinc-900" : "text-white")}>{data.name}</p>
            </div>
            {data.occupation && (
              <div>
                <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", isLight ? "text-zinc-400" : "text-zinc-500")}>Occupation</p>
                <p className={cn("text-base font-medium", isLight ? "text-zinc-900" : "text-white")}>{data.occupation}</p>
              </div>
            )}
            {data.location && (
              <div>
                <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", isLight ? "text-zinc-400" : "text-zinc-500")}>Location</p>
                <p className={cn("text-base font-medium", isLight ? "text-zinc-900" : "text-white")}>{data.location}</p>
              </div>
            )}
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", isLight ? "text-zinc-400" : "text-zinc-500")}>Member Since</p>
              <p className={cn("text-base font-medium", isLight ? "text-zinc-900" : "text-white")}>{data.memberSince}</p>
            </div>
          </div>
          <p className={cn("text-xs text-center mt-8", isLight ? "text-zinc-400" : "text-zinc-600")}>
            Discounts at participating locations apply. ID provided by Nexus.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex-1 w-full max-w-sm mx-auto rounded-3xl p-8 flex flex-col items-center justify-center text-center",
            isLight ? "bg-white border border-black/5 shadow-xl" : "bg-zinc-900 border border-white/10 shadow-2xl"
          )}
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 ring-8 ring-red-500/5">
            <ShieldCheck className="w-10 h-10 text-red-500" />
          </div>
          <h1 className={cn("text-2xl font-bold mb-2", isLight ? "text-zinc-900" : "text-white")}>
            Invalid ID
          </h1>
          <p className={isLight ? "text-zinc-500" : "text-zinc-400"}>
            This Virtual Residency ID is not recognized or has expired.
          </p>
        </motion.div>
      )}
    </div>
  );
}

