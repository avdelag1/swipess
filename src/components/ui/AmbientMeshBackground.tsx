import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface AmbientMeshProps {
  color?: string;
  intensity?: number;
  speed?: number;
}

/**
 * 🌌 SENTIENT AMBIENT MESH SYSTEM
 * Generates a high-performance, GPU-accelerated animated mesh gradient 
 * that reacts to the category color passed to it. It creates a sense 
 * of physical depth and organic life in the background.
 */
export function AmbientMeshBackground({ color = '#f97316', intensity = 0.15, speed = 10 }: AmbientMeshProps) {
  // Generate a unique mesh pattern based on the color
  const gradients = useMemo(() => {
    return [
      `radial-gradient(circle at 20% 30%, ${color}40 0%, transparent 50%)`,
      `radial-gradient(circle at 80% 70%, ${color}30 0%, transparent 50%)`,
      `radial-gradient(circle at 50% 50%, ${color}20 0%, transparent 60%)`,
    ];
  }, [color]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: intensity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Layer 1: Base color glow */}
          <div 
            className="absolute inset-0 transition-colors duration-1000"
            style={{ backgroundColor: `${color}05` }}
          />

          {/* Layer 2: Animated Mesh Blotches */}
          <motion.div 
            animate={{
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.1, 1, 0.9, 1],
            }}
            transition={{
              duration: speed * 2.5,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -inset-[50%] opacity-60"
            style={{
              background: gradients[0],
              filter: 'blur(80px)'
            }}
          />

          <motion.div 
            animate={{
              rotate: [360, 270, 180, 90, 0],
              scale: [1, 0.9, 1.1, 1, 1],
            }}
            transition={{
              duration: speed * 3.2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -inset-[50%] opacity-50"
            style={{
              background: gradients[1],
              filter: 'blur(100px)'
            }}
          />

          <motion.div 
            animate={{
              x: ['-10%', '10%', '-10%'],
              y: ['-10%', '10%', '-10%'],
            }}
            transition={{
              duration: speed * 1.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -inset-[30%] opacity-40"
            style={{
              background: gradients[2],
              filter: 'blur(120px)'
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Darkening Scrim (ensures text remains eligible) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
    </div>
  );
}

