import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

export type AppSkin = 'default' | 'animal' | 'bw';

export function SkinSwitcher() {
  const [skin, setSkin] = useState<AppSkin>('default');
  const [isOpen, setIsOpen] = useState(false);

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

  const handleSelect = (newSkin: AppSkin) => {
    haptics.select();
    setSkin(newSkin);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-[110px] right-4 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 flex flex-col gap-2 p-2 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl"
          >
            <button
              onClick={() => handleSelect('default')}
              className={cn("px-4 py-3 rounded-xl text-sm font-bold text-white transition-all", skin === 'default' ? "bg-white/20" : "hover:bg-white/10")}
            >
              Normal Theme
            </button>
            <button
              onClick={() => handleSelect('bw')}
              className={cn("px-4 py-3 rounded-xl text-sm font-bold transition-all bg-zinc-800 text-zinc-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]", skin === 'bw' ? "ring-2 ring-white" : "hover:bg-zinc-700")}
              style={{ filter: 'grayscale(100%)' }}
            >
              Black &amp; White Filter
            </button>
            <button
              onClick={() => handleSelect('animal')}
              className={cn("px-4 py-3 rounded-xl text-sm font-bold text-orange-200 transition-all", skin === 'animal' ? "ring-2 ring-orange-500" : "hover:brightness-110")}
              style={{
                backgroundColor: '#AF702C',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 15c2-4 7-6 12-4 4 1 6 6 4 10-1 4-6 5-10 4-4-2-7-6-6-10zm25 5c3-3 8-1 9 4 1 4-1 8-5 9-5 1-9-2-8-6 0-4 2-6 4-7z' fill='%232a1805' fill-opacity='0.6' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                color: '#FFF3E0',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              Animal Print Skin
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)] overflow-hidden"
        title="App Skin / Filter"
      >
        {isOpen ? <X size={20} /> : <Palette size={20} />}
      </motion.button>
    </div>
  );
}
