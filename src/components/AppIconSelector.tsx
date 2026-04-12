import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Smartphone } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

const ICONS = [
  { id: 'default', name: 'Sentient Default', bg: 'bg-black', icon: '✦', color: 'text-primary' },
  { id: 'dark', name: 'Pure Obsidian', bg: 'bg-zinc-950', icon: '✧', color: 'text-zinc-500' },
  { id: 'gold', name: 'Premium Gold', bg: 'bg-amber-950', icon: '♚', color: 'text-yellow-500' },
  { id: 'glass', name: 'Liquid Glass', bg: 'bg-transparent border border-white/20', icon: '⟡', color: 'text-white' },
];

export function AppIconSelector() {
  const [activeIcon, setActiveIcon] = useState('default');

  const handleSelect = (id: string) => {
    triggerHaptic('success');
    setActiveIcon(id);
    
    // Attempt logic for Capacitor (requires cap plugin setup, fallbacks to toast)
    // import { App } from '@capacitor/app'
    // This is a UI implementation. The native Xcode implementation requires CFBundleAlternateIcons.
  };

  return (
    <div className="w-full bg-card rounded-2xl border border-border/50 p-5 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground">App Icon</h3>
          <p className="text-xs text-muted-foreground">Customize your iOS Home Screen</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {ICONS.map((icon) => {
          const isActive = activeIcon === icon.id;
          return (
            <motion.button
              key={icon.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSelect(icon.id)}
              className="flex flex-col items-center gap-2"
            >
              <div 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative shadow-lg
                  ${icon.bg} ${icon.color}
                  ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              >
                {icon.icon}
                {isActive && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground text-center line-clamp-1">
                {icon.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
