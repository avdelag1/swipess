import { motion } from 'framer-motion';

interface SwipessSPatternProps {
    opacity?: number;
    count?: number;
}

/**
 * SwipessSPattern - Premium branded watermark layer.
 * Scatters subtle cinematic 'S' marks across the interface to enhance brand depth.
 */
export const SwipessSPattern = ({ opacity = 0.02, count = 5 }: SwipessSPatternProps) => {
    // Strategic positions to avoid cluttering key content areas
    const positions = [
        { top: '12%', left: '8%', rotate: -12 },
        { top: '48%', right: '12%', rotate: 8 },
        { bottom: '18%', left: '12%', rotate: 15 },
        { top: '28%', right: '25%', rotate: -5 },
        { bottom: '35%', right: '8%', rotate: 10 },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-20">
            {positions.slice(0, count).map((pos, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity, scale: 1 }}
                    transition={{
                        duration: 2.5,
                        delay: i * 0.5,
                        ease: [0.23, 1, 0.32, 1]
                    }}
                    style={{
                        position: 'absolute',
                        ...pos,
                    }}
                    className="text-[#E4007C] select-none pointer-events-none"
                >
                    {/* Stylized 'S' with a slight glow / flame feel */}
                    <div className="relative">
                        <span className="text-[14vw] font-black italic leading-none block drop-shadow-2xl">
                            S
                        </span>
                        {/* Subtle glow behind the S */}
                        <div className="absolute inset-0 blur-[40px] bg-[#E4007C]/20 rounded-full scale-150 -z-10" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
