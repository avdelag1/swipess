import { motion } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { triggerHaptic } from '@/utils/haptics';

interface BlueCassetteProps {
    isPlaying: boolean;
    stationName?: string;
    frequency?: string;
    genre?: string;
}

export function BlueCassette({ isPlaying, stationName, frequency, genre }: BlueCassetteProps) {
    const { togglePlayPause, changeStation, setVolume, state, toggleFavorite } = useRadio();

    const handleVolumeDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('light');
        setVolume(Math.max(0, state.volume - 0.1));
    };

    const handleVolumeUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('light');
        setVolume(Math.min(1, state.volume + 0.1));
    };

    const handleTogglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('medium');
        togglePlayPause();
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('light');
        changeStation('prev');
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('light');
        changeStation('next');
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('success');
        if (state.currentStation) {
            toggleFavorite(state.currentStation.id);
        }
    };

    return (
        <div className="relative w-[340px] h-[220px] mx-auto select-none group">
            {/* Main Cassette Image */}
            <motion.img
                src="/images/blue-cassette.png"
                alt="Blue Cassette"
                className="w-full h-full object-contain drop-shadow-2xl"
                animate={{
                    scale: isPlaying ? [1, 1.01, 1] : 1,
                    rotate: isPlaying ? [0, 0.5, -0.5, 0] : 0
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Label Overlays (Dynamic Text) */}
            <div className="absolute top-[65px] left-[85px] right-[85px] h-[40px] flex flex-col items-center justify-center overflow-hidden pointer-events-none">
                <span className="text-black/80 font-handwriting text-lg leading-tight truncate w-full text-center">
                    {stationName || 'Swipess Mix'}
                </span>
                <div className="flex items-center gap-2 opacity-60">
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest">{frequency || '98.5 FM'}</span>
                    <span className="text-[10px] font-medium text-black uppercase italic">{genre || 'Live'}</span>
                </div>
            </div>

            {/* On Air Light Overlay */}
            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute bottom-[68px] right-[45px] w-[55px] h-[18px] bg-red-600/40 blur-md rounded-full pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Interactive Hotspots (Invisible Buttons) */}

            {/* Bottom Left: Volume Down (+) - User said "it should be less there" */}
            <button
                onClick={handleVolumeDown}
                className="absolute bottom-[20px] left-[55px] w-[45px] h-[45px] rounded-full active:bg-white/10 transition-colors"
                aria-label="Volume Down"
            />

            {/* Bottom Right: Volume Up (-) */}
            <button
                onClick={handleVolumeUp}
                className="absolute bottom-[20px] right-[55px] w-[45px] h-[45px] rounded-full active:bg-white/10 transition-colors"
                aria-label="Volume Up"
            />

            {/* Middle: Play/Pause */}
            <button
                onClick={handleTogglePlay}
                className="absolute bottom-[75px] left-1/2 -translate-x-1/2 w-[55px] h-[55px] rounded-full active:bg-white/10 transition-colors"
                aria-label="Play/Pause"
            />

            {/* Middle Left: Skip Back */}
            <button
                onClick={handlePrev}
                className="absolute bottom-[88px] left-[130px] w-[35px] h-[35px] rounded-full active:bg-white/10 transition-colors"
                aria-label="Previous Station"
            />

            {/* Middle Right: Skip Forward */}
            <button
                onClick={handleNext}
                className="absolute bottom-[88px] right-[130px] w-[35px] h-[35px] rounded-full active:bg-white/10 transition-colors"
                aria-label="Next Station"
            />

            {/* Left: Save Session */}
            <button
                onClick={handleSave}
                className="absolute bottom-[75px] left-[55px] w-[110px] h-[35px] rounded-md active:bg-white/10 transition-colors"
                aria-label="Save Station"
            />
        </div>
    );
}

// Add simple handwriting font style to head if not present
if (typeof document !== 'undefined' && !document.getElementById('cassette-fonts')) {
    const style = document.createElement('style');
    style.id = 'cassette-fonts';
    style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
    .font-handwriting { font-family: 'Permanent Marker', cursive; }
  `;
    document.head.appendChild(style);
}

import { AnimatePresence } from 'framer-motion';
