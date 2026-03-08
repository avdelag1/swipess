import { memo, useEffect, useRef } from 'react';

interface Spot {
    x: number;
    y: number;
    r: number;
    rotation: number;
    points: { dx: number; dy: number }[];
    opacity: number;
}

const CheetahBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spotsRef = useRef<Spot[]>([]);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initSpots();
        };

        const initSpots = () => {
            const w = canvas.width;
            const h = canvas.height;
            const count = Math.floor((w * h) / 3000);
            const spots: Spot[] = [];

            for (let i = 0; i < count; i++) {
                const radius = 12 + Math.random() * 22;
                const pointsCount = 5 + Math.floor(Math.random() * 5);
                const points = [];
                for (let p = 0; p < pointsCount; p++) {
                    const angle = (p / pointsCount) * Math.PI * 2;
                    const jitter = radius * 0.4;
                    points.push({
                        dx: Math.cos(angle) * (radius + (Math.random() - 0.5) * jitter),
                        dy: Math.sin(angle) * (radius + (Math.random() - 0.5) * jitter)
                    });
                }

                spots.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: radius,
                    rotation: Math.random() * Math.PI * 2,
                    points,
                    opacity: 0.4 + Math.random() * 0.4
                });
            }
            spotsRef.current = spots;
        };

        resize();
        window.addEventListener('resize', resize);

        let frame = 0;
        const animate = () => {
            frame += 0.02;
            const w = canvas.width;
            const h = canvas.height;

            // Deep, dark skin base with slight organic movement
            const baseGradient = ctx.createRadialGradient(
                w / 2, h / 2, 0,
                w / 2, h / 2, w * 0.8
            );

            // Breathing color shift
            const breathingInt = Math.sin(frame) * 0.5 + 0.5; // 0 to 1
            const baseGold = `rgba(${218 + breathingInt * 20}, ${165 + breathingInt * 15}, 32, 1)`;
            const lightAmber = `rgba(${251}, ${191}, ${36}, 0.8)`;
            const deepBlack = `rgba(15, 10, 5, 1)`;

            ctx.fillStyle = deepBlack;
            ctx.fillRect(0, 0, w, h);

            // Create a rich, organic base skin gradient
            const skinGradient = ctx.createRadialGradient(
                w / 2, h / 2, 0,
                w / 2, h / 2, w * 0.9
            );
            skinGradient.addColorStop(0, lightAmber);
            skinGradient.addColorStop(0.6, baseGold);
            skinGradient.addColorStop(1, deepBlack);

            ctx.fillStyle = skinGradient;
            ctx.fillRect(0, 0, w, h);

            // Animation params
            const breathingScale = 1 + Math.sin(frame) * 0.02;
            const breathingY = Math.sin(frame) * 10;

            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(breathingScale, breathingScale);
            ctx.translate(-w / 2, -h / 2 + breathingY);

            // Draw spots
            for (const spot of spotsRef.current) {
                ctx.save();
                ctx.translate(spot.x, spot.y);
                ctx.rotate(spot.rotation + Math.sin(frame * 0.5) * 0.1);

                ctx.beginPath();
                ctx.moveTo(spot.points[0].dx, spot.points[0].dy);
                for (let i = 1; i < spot.points.length; i++) {
                    const p = spot.points[i];
                    const prevP = spot.points[i - 1];
                    const xc = (p.dx + prevP.dx) / 2;
                    const yc = (p.dy + prevP.dy) / 2;
                    ctx.quadraticCurveTo(prevP.dx, prevP.dy, xc, yc);
                }
                ctx.closePath();

                // Outer rosette ring - pitch black
                const spotAlpha = spot.opacity * (0.9 + breathingInt * 0.1);
                ctx.fillStyle = `rgba(5, 5, 5, ${spotAlpha})`;
                ctx.fill();

                // Inner rosette center - warm amber to create leopard rosette effect
                const innerR = spot.r * 0.45;
                ctx.beginPath();
                ctx.arc(0, 0, innerR, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${180 + Math.floor(breathingInt * 30)}, ${130 + Math.floor(breathingInt * 20)}, 20, ${spotAlpha * 0.55})`;
                ctx.fill();

                ctx.restore();
            }
            ctx.restore();

            // Vignette to pull it together
            const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 1.1);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
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
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{ filter: 'contrast(1.1) brightness(0.9) saturate(1.2)' }}
        />
    );
};

export default memo(CheetahBackground);
