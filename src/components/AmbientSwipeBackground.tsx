import { motion } from 'framer-motion';

/**
 * Ambient background for swipe interfaces.
 * Provides a dynamic, premium aesthetic with subtle moving gradients.
 */
export const AmbientSwipeBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-[#FAFAFA]">
            {/* Dynamic Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, 40, 0],
                    y: [0, 25, 0],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-[90px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.1, 0.18, 0.1],
                    x: [0, -35, 0],
                    y: [0, 50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[20%] -right-[15%] w-[55%] h-[55%] rounded-full bg-gradient-to-bl from-pink-500/15 to-rose-400/10 blur-[85px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.05, 0.12, 0.05],
                    x: [0, 30, 0],
                    y: [0, -45, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-[15%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-blue-400/10 to-indigo-500/10 blur-[100px]"
            />

            {/* Soft Texture Mesh */}
            <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />

            {/* Subtle vignettes */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/[0.03]" />
        </div>
    );
};
