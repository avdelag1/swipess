import { memo, useEffect, useRef } from 'react';

const SilverBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        let frame = 0;
        const animate = () => {
            frame += 0.003;
            const w = canvas.width;
            const h = canvas.height;

            // Deep Metallic Base with complex lighting
            const baseGradient = ctx.createLinearGradient(0, 0, w, h);
            baseGradient.addColorStop(0, '#6B7280'); // Gray 500
            baseGradient.addColorStop(0.2, '#E5E7EB'); // Gray 200
            baseGradient.addColorStop(0.5, '#D1D5DB'); // Gray 300
            baseGradient.addColorStop(0.8, '#F3F4F6'); // Gray 100
            baseGradient.addColorStop(1, '#9CA3AF'); // Gray 400

            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, w, h);

            // "Brushed Metal" Texture / Grain - Subtle vertical lines
            ctx.globalAlpha = 0.08;
            for (let i = 0; i < 300; i += 3) {
                ctx.beginPath();
                ctx.strokeStyle = i % 6 === 0 ? '#000' : '#fff';
                ctx.lineWidth = 0.5;
                const x = Math.random() * w;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;

            // Liquid Silver Flow (Replacing the simple wavy lines)
            const count = 12;
            for (let i = 0; i < count; i++) {
                const shift = (frame + i * 0.1) % 1;
                const opacity = Math.sin(shift * Math.PI) * 0.35;

                ctx.beginPath();
                // Alternating white and black "liquid" flows for depth
                // White flows are thicker, black flows are thin "cracks" or "shadows"
                ctx.strokeStyle = i % 2 === 0 ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity * 0.2})`;
                ctx.lineWidth = i % 2 === 0 ? (30 + Math.sin(frame + i) * 15) : (2 + Math.sin(frame + i) * 1);

                const startY = (i / count) * h;
                ctx.moveTo(-100, startY);

                for (let x = 0; x < w + 200; x += 40) {
                    const wave = Math.sin(x * 0.0015 + frame + i * 0.5) * 60;
                    ctx.lineTo(x, startY + wave);
                }
                ctx.stroke();
            }

            // High-intensity Metallic Sheen (The "Wow" factor)
            const sheenPos = ((frame * 0.4) % 1) * w * 3 - w;
            const sheenGradient = ctx.createLinearGradient(sheenPos, 0, sheenPos + w * 0.5, h);
            sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            sheenGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
            sheenGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)'); // Very bright center
            sheenGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
            sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = sheenGradient;
            ctx.fillRect(0, 0, w, h);

            // Rich Vignette for depth
            const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 1.2);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, w, h);

            requestRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ filter: 'contrast(1.2) brightness(1.1)' }}
        />
    );
};

export default memo(SilverBackground);
