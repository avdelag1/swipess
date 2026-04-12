import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ChevronLeft, MapPin } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function VapValidate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // In reality, we would fetch user details based on `id`
  const isValid = id === 'vap_camille_77x';

  return (
    <div className={cn(
      "min-h-screen w-full flex flex-col pt-12 pb-10 px-6",
      isLight ? "bg-zinc-50" : "bg-black"
    )}>
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-12">
        <button 
          onClick={() => navigate('/')}
          className={cn(
            "p-2 rounded-full",
            isLight ? "bg-white border border-black/5" : "bg-white/5 border border-white/5"
          )}
        >
          <ChevronLeft className={cn("w-5 h-5", isLight ? "text-black" : "text-white")} />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn("w-5 h-5", isLight ? "text-primary" : "text-white")} />
          <span className={cn(
            "text-xs font-bold tracking-widest uppercase",
            isLight ? "text-black/60" : "text-white/60"
          )}>
            Tulum Resident Portal
          </span>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {isValid ? (
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
              <p className={cn("text-base font-medium", isLight ? "text-zinc-900" : "text-white")}>Camille Dubois</p>
            </div>
            
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", isLight ? "text-zinc-400" : "text-zinc-500")}>Membership Level</p>
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-medium">VIP Member</span>
              </div>
            </div>

            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", isLight ? "text-zinc-400" : "text-zinc-500")}>Valid Until</p>
              <p className={cn("text-base font-medium", isLight ? "text-zinc-900" : "text-white")}>August 2026</p>
            </div>
          </div>
          
          <p className={cn("text-xs text-center mt-8", isLight ? "text-zinc-400" : "text-zinc-600")}>
            Discounts at participating locations apply. ID provided by Swipess App.
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
