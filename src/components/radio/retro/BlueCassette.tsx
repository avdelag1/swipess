import { motion, AnimatePresence } from 'framer-motion';
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
            {/* HD Cassette Watermark Image */}
            <motion.img
                src="/images/retro-cassette-hd.png"
                alt="Retro Cassette"
                className="w-full h-full object-contain"
                style={{
                    opacity: 0.2,
                    filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))',
                    mixBlendMode: 'screen',
                }}
                animate={{
                    scale: isPlaying ? [1, 1.01, 1] : 1,
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                draggable={false}
            />

            {/* Label Overlays (Dynamic Text) */}
            <div className="absolute top-[55px] left-[75px] right-[75px] h-[50px] flex flex-col items-center justify-center overflow-hidden pointer-events-none z-10">
                <span
                    className="text-foreground/70 font-handwriting text-lg leading-tight truncate w-full text-center drop-shadow-lg"
                    style={{
                        textShadow: '0 0 16px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    {stationName || 'Swipess Mix'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {frequency || '98.5 FM'}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/70 uppercase italic">
                        {genre || 'Live'}
                    </span>
                </div>
            </div>

            {/* On Air glow */}
            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-[68px] right-[45px] w-[55px] h-[18px] bg-orange-500/30 blur-lg rounded-full pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Interactive Hotspots (Invisible Buttons) */}
            <button
                onClick={handleVolumeDown}
                className="absolute bottom-[20px] left-[55px] w-[45px] h-[45px] rounded-full active:bg-foreground/10 transition-colors"
                aria-label="Volume Down"
            />
            <button
                onClick={handleVolumeUp}
                className="absolute bottom-[20px] right-[55px] w-[45px] h-[45px] rounded-full active:bg-foreground/10 transition-colors"
                aria-label="Volume Up"
            />
            <button
                onClick={handleTogglePlay}
                className="absolute bottom-[75px] left-1/2 -translate-x-1/2 w-[55px] h-[55px] rounded-full active:bg-foreground/10 transition-colors"
                aria-label="Play/Pause"
            />
            <button
                onClick={handlePrev}
                className="absolute bottom-[88px] left-[130px] w-[35px] h-[35px] rounded-full active:bg-foreground/10 transition-colors"
                aria-label="Previous Station"
            />
            <button
                onClick={handleNext}
                className="absolute bottom-[88px] right-[130px] w-[35px] h-[35px] rounded-full active:bg-foreground/10 transition-colors"
                aria-label="Next Station"
            />
            <button
                onClick={handleSave}
                className="absolute bottom-[75px] left-[55px] w-[110px] h-[35px] rounded-md active:bg-foreground/10 transition-colors"
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
