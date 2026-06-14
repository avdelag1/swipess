import { memo } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Navigation, Sparkles, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { appToast } from '@/utils/appNotification';
import useAppTheme from '@/hooks/useAppTheme';

const PREMIUM_DESTINATIONS = [
  { name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918, img: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?q=80&w=800&auto=format&fit=crop' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop' },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, img: 'https://images.unsplash.com/photo-1502602898657-3e907a5ea82c?q=80&w=800&auto=format&fit=crop' },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop' },
  { name: 'Monaco', country: 'Monaco', lat: 43.7384, lng: 7.4246, img: 'https://images.unsplash.com/photo-1558296726-17b5e40e69e3?q=80&w=800&auto=format&fit=crop' },
  { name: 'Ibiza', country: 'Spain', lat: 38.9067, lng: 1.4206, img: 'https://images.unsplash.com/photo-1559523165-2b4742a78a6c?q=80&w=800&auto=format&fit=crop' },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, img: 'https://images.unsplash.com/photo-1515896769750-31548ea180ed?q=80&w=800&auto=format&fit=crop' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800&auto=format&fit=crop' },
];

export const PassportModal = memo(() => {
  const { isLight } = useAppTheme();
  const isOpen = useModalStore(s => s.showPassportModal);
  const setModal = useModalStore(s => s.setModal);
  const setFilters = useFilterStore(s => s.setFilters);
  const currentLat = useFilterStore(s => s.userLatitude);
  const currentLng = useFilterStore(s => s.userLongitude);
  
  const onClose = () => {
    triggerHaptic('light');
    setModal('showPassportModal', false);
  };

  const handleTeleport = (dest: typeof PREMIUM_DESTINATIONS[0]) => {
    triggerHaptic('heavy');
    setFilters({ userLatitude: dest.lat, userLongitude: dest.lng });
    appToast.success(`Teleported to ${dest.name}, ${dest.country}!`);
    onClose();
  };

  const handleReset = () => {
    triggerHaptic('medium');
    setFilters({ userLatitude: null, userLongitude: null });
    appToast.info('Location tracking reset to your actual position.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10020] flex flex-col justify-end pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={cn("absolute inset-0 pointer-events-auto", isLight ? "bg-black/20 backdrop-blur-md" : "bg-black/60 backdrop-blur-xl")}
      />

      <motion.div
        initial={{ y: "100%", filter: 'blur(20px)', scale: 0.95 }}
        animate={{ y: 0, filter: 'blur(0px)', scale: 1 }}
        exit={{ y: "100%", filter: 'blur(10px)', scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "w-full max-h-[85vh] rounded-t-3xl flex flex-col pointer-events-auto overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.3)]",
          isLight ? "bg-white" : "bg-[#0A0A0A] border-t border-white/10"
        )}
      >
        <div className="p-6 pb-4 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={cn("text-xl font-black uppercase tracking-widest", isLight ? "text-slate-900" : "text-white")}>Global Passport</h2>
              <p className={cn("text-[11px] font-bold uppercase tracking-widest mt-1", isLight ? "text-slate-500" : "text-white/40")}>Teleport your feed instantly</p>
            </div>
          </div>
          <button onClick={onClose} className={cn("p-2 rounded-full transition-all", isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/5 text-white/50 hover:bg-white/10")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
          
          <button
            onClick={handleReset}
            className={cn(
              "w-full mb-6 p-4 rounded-2xl flex items-center justify-between transition-all border group",
              isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-white/5 border-white/10 hover:border-white/20",
              currentLat === null && currentLng === null && (isLight ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-indigo-500 ring-2 ring-indigo-500/40")
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isLight ? "bg-indigo-100" : "bg-indigo-500/20")}>
                <Navigation className={cn("w-4 h-4", isLight ? "text-indigo-600" : "text-indigo-400")} />
              </div>
              <div className="text-left">
                <div className={cn("text-sm font-black uppercase tracking-widest", isLight ? "text-slate-900" : "text-white")}>Current Location</div>
                <div className={cn("text-[10px] font-bold uppercase tracking-wider", isLight ? "text-slate-500" : "text-white/40")}>Use device GPS</div>
              </div>
            </div>
            {currentLat === null && currentLng === null && <Sparkles className="w-4 h-4 text-indigo-500" />}
          </button>

          <div className="grid grid-cols-2 gap-3 pb-8">
            {PREMIUM_DESTINATIONS.map((dest) => {
              const isActive = currentLat === dest.lat && currentLng === dest.lng;
              return (
                <button
                  key={dest.name}
                  onClick={() => handleTeleport(dest)}
                  className="relative group rounded-2xl overflow-hidden aspect-[4/5] shadow-lg active:scale-95 transition-all"
                >
                  <img src={dest.img} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90" />
                  
                  {isActive && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white shadow-sm">Active</span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                    <h3 className="text-lg font-black text-white leading-none shadow-sm">{dest.name}</h3>
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin className="w-3 h-3 text-white/70" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{dest.country}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
});
PassportModal.displayName = 'PassportModal';
