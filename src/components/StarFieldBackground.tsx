import { memo, useEffect, useRef } from 'react';

/**
 * StarFieldBackground
 * 
 * A high-performance, premium canvas-based star field effect.
 * Features delicate twinkling stars with smooth animation.
 */
const StarFieldBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Array<{
            x: number;
            y: number;
            size: number;
            opacity: number;
            twinkleSpeed: number;
            twinklePhase: number;
        }> = [];

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            initStars();
        };

        const initStars = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const starCount = Math.floor((w * h) / 800);

            stars = Array.from({ length: Math.min(starCount, 1200) }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 0.8 + 0.2, // Tiny, elegant stars
                opacity: Math.random() * 0.5 + 0.2,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2,
            }));
        };

        const draw = (time: number) => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            ctx.clearRect(0, 0, w, h);

            stars.forEach((star) => {
                const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed * 100 + star.twinklePhase) * 0.5 + 0.5;
                const currentOpacity = star.opacity * (0.3 + twinkle * 0.7);

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        animationFrameId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none w-full h-full"
            style={{
                background: 'transparent',
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.1))'
            }}
        />
    );
};

export default memo(StarFieldBackground);
