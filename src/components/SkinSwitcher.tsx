import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X, Stars, Sun, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { useVisualPreferences } from '@/hooks/useVisualPreferences';

export type AppSkin = 'default' | 'animal' | 'bw';

export function SkinSwitcher() {
  const [skin, setSkin] = useState<AppSkin>('default');
  const [isOpen, setIsOpen] = useState(false);
  const { preferences, setBackgroundMode } = useVisualPreferences();

  useEffect(() => {
    // Load saved skin
    const saved = localStorage.getItem('app_skin') as AppSkin;
    if (saved) setSkin(saved);
  }, []);

  useEffect(() => {
    // Apply skin to body
    document.body.classList.remove('skin-animal', 'skin-bw');
    if (skin !== 'default') {
      document.body.classList.add(`skin-${skin}`);
    }
    localStorage.setItem('app_skin', skin);
  }, [skin]);

  const handleSelectSkin = (newSkin: AppSkin) => {
    haptics.select();
    setSkin(newSkin);
  };

  const handleSelectBackground = (mode: "stars" | "sunset" | "off") => {
    haptics.success();
    setBackgroundMode(mode);
  };

  return (
    <div className="fixed bottom-[110px] right-4 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            className="mb-3 flex flex-col gap-4 p-4 bg-black/70 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-64"
          >
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1 mb-3">Color Filters</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleSelectSkin('default')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    skin === 'default' ? "bg-white/20 text-white ring-1 ring-white/30" : "text-white/60 hover:bg-white/10"
                  )}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-rose-500" />
                  Classic Theme
                </button>
                <button
                  onClick={() => handleSelectSkin('bw')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    skin === 'bw' ? "bg-white/20 text-white ring-1 ring-white/30" : "text-white/60 hover:bg-white/10"
                  )}
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-600 border border-white/10" />
                  Noir B&W
                </button>
                <button
                  onClick={() => handleSelectSkin('animal')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    skin === 'animal' ? "bg-[#AF702C] text-orange-50 ring-1 ring-orange-400/50" : "text-white/60 hover:bg-white/10"
                  )}
                >
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#AF702C', backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 15c2-4 7-6 12-4 4 1 6 6 4 10-1 4-6 5-10 4-4-2-7-6-6-10zm25 5c3-3 8-1 9 4 1 4-1 8-5 9-5 1-9-2-8-6 0-4 2-6 4-7z' fill='%232a1805' fill-opacity='0.6'/%3E%3C/svg%3E")` }} />
                  Wild Print
                </button>
              </div>
            </div>

            <div className="h-px bg-white/10 mx-1" />

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1 mb-3">Live Backgrounds</p>
              <div className="grid grid-cols-1 gap-2">
                 <button
                  onClick={() => handleSelectBackground('off')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    preferences.background_mode === 'off' ? "bg-white/20 text-white ring-1 ring-white/30" : "text-white/60 hover:bg-white/10"
                  )}
                >
                  <Hash className="w-5 h-5" />
                  Clean Static
                </button>
                <button
                  onClick={() => handleSelectBackground('stars')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    preferences.background_mode === 'stars' ? "bg-blue-500/20 text-blue-100 ring-1 ring-blue-400/30" : "text-white/60 hover:bg-white/10"
                  )}
                >
                  <Stars className="w-5 h-5 text-blue-300" />
                  Midnight Stars
                </button>
                <button
                  onClick={() => handleSelectBackground('sunset')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    preferences.background_mode === 'sunset' ? "bg-orange-500/20 text-orange-100 ring-1 ring-orange-400/30" : "text-white/60 hover:bg-white/10"
                  )}
                >
                  <Sun className="w-5 h-5 text-orange-300" />
                  Zen Sunset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          haptics.impact('light');
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all overflow-hidden",
          isOpen ? "bg-white/20 backdrop-blur-3xl border border-white/40" : "bg-black/50 backdrop-blur-xl border border-white/20"
        )}
        title="App Skin & Background"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="palette" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <Palette size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
