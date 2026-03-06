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
            frame += 0.005;
            const w = canvas.width;
            const h = canvas.height;

            // Base metallic silver gradient
            const baseGradient = ctx.createLinearGradient(0, 0, w, h);
            baseGradient.addColorStop(0, '#FFFFFF');
            baseGradient.addColorStop(0.3, '#E5E7EB');
            baseGradient.addColorStop(0.5, '#9CA3AF');
            baseGradient.addColorStop(0.7, '#E5E7EB');
            baseGradient.addColorStop(1, '#D1D5DB');

            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, w, h);

            // Animated "White and Black lines" effect
            ctx.lineWidth = 2;
            const lineCount = 40;
            const spacing = h / lineCount;

            for (let i = -10; i < lineCount + 10; i++) {
                const y = i * spacing;

                // Silver/White line
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(frame + i * 0.2) * 0.2})`;
                ctx.lineWidth = 15;

                ctx.moveTo(0, y);
                for (let x = 0; x < w; x += 20) {
                    const wave = Math.sin(x * 0.002 + frame + i * 0.5) * 50;
                    ctx.lineTo(x, y + wave);
                }
                ctx.stroke();

                // Black line (sleek and thin)
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 + Math.cos(frame * 1.5 + i * 0.3) * 0.1})`;
                ctx.lineWidth = 1;
                ctx.moveTo(0, y + 10);
                for (let x = 0; x < w; x += 20) {
                    const wave = Math.sin(x * 0.002 + frame + i * 0.5) * 50;
                    ctx.lineTo(x, y + wave + 10);
                }
                ctx.stroke();
            }

            // Shimmer sheen
            const sheenX = (Math.sin(frame * 2) * 0.5 + 0.5) * w * 1.5 - (w * 0.25);
            const sheenGradient = ctx.createLinearGradient(sheenX, 0, sheenX + w * 0.3, h);
            sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            sheenGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
            sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = sheenGradient;
            ctx.fillRect(0, 0, w, h);

            // Vignette
            const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 1.2);
            vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
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
