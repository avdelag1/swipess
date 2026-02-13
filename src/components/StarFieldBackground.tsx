import { memo, useMemo } from 'react';

/**
 * CINEMATIC DAY/NIGHT CYCLE BACKGROUND
 * 120s loop: Sunset → Night → Sunrise → repeat
 * Pure CSS animations, GPU-accelerated, zero JS loops
 */

function generateStars(count: number) {
  const stars: { top: string; left: string; size: number; delay: string; duration: string }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      top: `${Math.random() * 65}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2.5 + 0.5,
      delay: `${(Math.random() * 5).toFixed(1)}s`,
      duration: `${(Math.random() * 3 + 2).toFixed(1)}s`,
    });
  }
  return stars;
}

function StarFieldBackground() {
  const stars = useMemo(() => generateStars(50), []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {/* SKY */}
      <div className="absolute inset-0 sf-sky" />

      {/* SUN */}
      <div className="sf-sun" />

      {/* MOON */}
      <div className="sf-moon" />

      {/* STARS */}
      <div className="sf-stars-container">
        {stars.map((s, i) => (
          <div
            key={i}
            className="sf-star"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      {/* OCEAN */}
      <div className="sf-ocean">
        <div className="sf-ocean-shimmer" />
      </div>

      {/* WAVES */}
      <svg
        className="sf-wave sf-wave-1"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" />
      </svg>
      <svg
        className="sf-wave sf-wave-2"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0,80 C360,20 720,100 1080,40 C1260,10 1380,70 1440,80 L1440,120 L0,120 Z" />
      </svg>
      <svg
        className="sf-wave sf-wave-3"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0,90 C180,60 360,100 540,70 C720,40 900,100 1080,80 C1260,60 1380,90 1440,85 L1440,120 L0,120 Z" />
      </svg>

      <style>{`
        /* ===== SKY CYCLE ===== */
        .sf-sky {
          animation: sfSkyCycle 120s linear infinite;
          will-change: background;
        }
        @keyframes sfSkyCycle {
          /* Sunset */
          0%   { background: linear-gradient(180deg, #ff6b35 0%, #ff8c42 20%, #f7567c 45%, #6a0572 70%, #1a0533 100%); }
          8%   { background: linear-gradient(180deg, #e85d26 0%, #ff6347 20%, #c44569 45%, #4a0e4e 70%, #0d0221 100%); }
          15%  { background: linear-gradient(180deg, #c0392b 0%, #d35400 20%, #8e44ad 45%, #2c003e 70%, #060011 100%); }
          25%  { background: linear-gradient(180deg, #6c3483 0%, #4a235a 20%, #1b2631 45%, #0b0e1a 70%, #020108 100%); }
          /* Night */
          33%  { background: linear-gradient(180deg, #0a0e27 0%, #0d1137 20%, #0f1442 45%, #0a0f2e 70%, #050816 100%); }
          50%  { background: linear-gradient(180deg, #080c22 0%, #0b0f30 20%, #0d1238 45%, #090d28 70%, #040712 100%); }
          /* Sunrise */
          60%  { background: linear-gradient(180deg, #0f1442 0%, #1a1a5e 20%, #2d1b69 45%, #1a0533 70%, #0a0e27 100%); }
          70%  { background: linear-gradient(180deg, #2d1b69 0%, #6c3483 20%, #c0392b 45%, #e67e22 70%, #f39c12 100%); }
          78%  { background: linear-gradient(180deg, #f39c12 0%, #e74c3c 20%, #ff6b6b 45%, #feca57 70%, #ff9ff3 100%); }
          85%  { background: linear-gradient(180deg, #fdcb6e 0%, #ff7675 20%, #fab1a0 45%, #ffeaa7 70%, #dfe6e9 100%); }
          /* Transition back to sunset */
          92%  { background: linear-gradient(180deg, #ff9ff3 0%, #ff6b6b 20%, #ee5a24 45%, #f39c12 70%, #ffeaa7 100%); }
          100% { background: linear-gradient(180deg, #ff6b35 0%, #ff8c42 20%, #f7567c 45%, #6a0572 70%, #1a0533 100%); }
        }

        /* ===== SUN ===== */
        .sf-sun {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          left: 50%;
          margin-left: -30px;
          background: radial-gradient(circle, #fff7ae 0%, #ffd32a 40%, #ff9f43 70%, transparent 100%);
          box-shadow: 0 0 40px 15px rgba(255, 211, 42, 0.5), 0 0 80px 30px rgba(255, 159, 67, 0.3);
          animation: sfSunCycle 120s linear infinite;
          will-change: transform, opacity;
        }
        @keyframes sfSunCycle {
          0%   { transform: translateY(0); opacity: 1; top: 30%; }
          25%  { transform: translateY(0); opacity: 0.3; top: 68%; }
          30%  { transform: translateY(0); opacity: 0; top: 75%; }
          58%  { transform: translateY(0); opacity: 0; top: 75%; }
          65%  { transform: translateY(0); opacity: 0; top: 75%; }
          70%  { transform: translateY(0); opacity: 0.3; top: 68%; }
          78%  { transform: translateY(0); opacity: 1; top: 40%; }
          85%  { transform: translateY(0); opacity: 1; top: 25%; }
          92%  { transform: translateY(0); opacity: 1; top: 30%; }
          100% { transform: translateY(0); opacity: 1; top: 30%; }
        }

        /* ===== MOON ===== */
        .sf-moon {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          left: 35%;
          background: radial-gradient(circle at 35% 35%, #f5f6fa 0%, #dcdde1 60%, #b0b3b8 100%);
          box-shadow: 0 0 20px 8px rgba(245, 246, 250, 0.2), 0 0 50px 15px rgba(200, 210, 230, 0.1);
          animation: sfMoonCycle 120s linear infinite;
          will-change: opacity;
        }
        @keyframes sfMoonCycle {
          0%   { opacity: 0; top: 20%; }
          25%  { opacity: 0; top: 20%; }
          33%  { opacity: 0.8; top: 15%; }
          50%  { opacity: 1; top: 12%; }
          58%  { opacity: 0.8; top: 15%; }
          65%  { opacity: 0; top: 20%; }
          100% { opacity: 0; top: 20%; }
        }

        /* ===== STARS ===== */
        .sf-stars-container {
          position: absolute;
          inset: 0;
          animation: sfStarsVisibility 120s linear infinite;
          will-change: opacity;
        }
        @keyframes sfStarsVisibility {
          0%   { opacity: 0; }
          25%  { opacity: 0; }
          33%  { opacity: 1; }
          58%  { opacity: 1; }
          65%  { opacity: 0; }
          100% { opacity: 0; }
        }
        .sf-star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: sfTwinkle ease-in-out infinite alternate;
        }
        @keyframes sfTwinkle {
          0%   { opacity: 0.3; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); }
        }

        /* ===== OCEAN ===== */
        .sf-ocean {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30%;
          animation: sfOceanCycle 120s linear infinite;
          will-change: background;
        }
        @keyframes sfOceanCycle {
          0%   { background: linear-gradient(180deg, rgba(255,107,53,0.3) 0%, #1a0533 40%, #0d0221 100%); }
          25%  { background: linear-gradient(180deg, rgba(44,0,62,0.5) 0%, #050816 40%, #020108 100%); }
          33%  { background: linear-gradient(180deg, rgba(10,14,39,0.6) 0%, #050816 40%, #020510 100%); }
          50%  { background: linear-gradient(180deg, rgba(8,12,34,0.5) 0%, #040712 40%, #020410 100%); }
          70%  { background: linear-gradient(180deg, rgba(192,57,43,0.3) 0%, #1a0533 40%, #0d0221 100%); }
          85%  { background: linear-gradient(180deg, rgba(253,203,110,0.3) 0%, #2d6cb5 40%, #1a4a7a 100%); }
          100% { background: linear-gradient(180deg, rgba(255,107,53,0.3) 0%, #1a0533 40%, #0d0221 100%); }
        }
        .sf-ocean-shimmer {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.03) 10%,
            transparent 20%
          );
          animation: sfShimmer 8s ease-in-out infinite;
        }
        @keyframes sfShimmer {
          0%, 100% { transform: translateX(-5%); }
          50%      { transform: translateX(5%); }
        }

        /* ===== WAVES ===== */
        .sf-wave {
          position: absolute;
          bottom: 0;
          left: -5%;
          width: 110%;
          height: 50px;
          will-change: transform;
        }
        .sf-wave-1 {
          z-index: 3;
          animation: sfOceanCycle 120s linear infinite, sfWaveMove1 7s ease-in-out infinite;
        }
        .sf-wave-1 path {
          fill: rgba(0, 0, 0, 0.35);
          animation: sfWaveFill1 120s linear infinite;
        }
        @keyframes sfWaveFill1 {
          0%   { fill: rgba(26, 5, 51, 0.5); }
          33%  { fill: rgba(5, 8, 22, 0.7); }
          50%  { fill: rgba(4, 7, 18, 0.7); }
          85%  { fill: rgba(26, 74, 122, 0.5); }
          100% { fill: rgba(26, 5, 51, 0.5); }
        }
        .sf-wave-2 {
          z-index: 2;
          height: 40px;
          bottom: 8px;
          animation: sfWaveMove2 9s ease-in-out infinite;
        }
        .sf-wave-2 path {
          fill: rgba(0, 0, 0, 0.2);
          animation: sfWaveFill2 120s linear infinite;
        }
        @keyframes sfWaveFill2 {
          0%   { fill: rgba(26, 5, 51, 0.3); }
          33%  { fill: rgba(5, 8, 22, 0.5); }
          50%  { fill: rgba(4, 7, 18, 0.5); }
          85%  { fill: rgba(45, 108, 181, 0.3); }
          100% { fill: rgba(26, 5, 51, 0.3); }
        }
        .sf-wave-3 {
          z-index: 1;
          height: 35px;
          bottom: 15px;
          animation: sfWaveMove3 11s ease-in-out infinite;
        }
        .sf-wave-3 path {
          fill: rgba(0, 0, 0, 0.12);
          animation: sfWaveFill3 120s linear infinite;
        }
        @keyframes sfWaveFill3 {
          0%   { fill: rgba(26, 5, 51, 0.2); }
          33%  { fill: rgba(5, 8, 22, 0.35); }
          50%  { fill: rgba(4, 7, 18, 0.35); }
          85%  { fill: rgba(45, 108, 181, 0.2); }
          100% { fill: rgba(26, 5, 51, 0.2); }
        }
        @keyframes sfWaveMove1 {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(-15px); }
        }
        @keyframes sfWaveMove2 {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(12px); }
        }
        @keyframes sfWaveMove3 {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(-8px); }
        }

        /* ===== REDUCED MOTION ===== */
        @media (prefers-reduced-motion: reduce) {
          .sf-sky, .sf-sun, .sf-moon, .sf-stars-container,
          .sf-ocean, .sf-ocean-shimmer, .sf-star,
          .sf-wave, .sf-wave path {
            animation: none !important;
          }
          .sf-sky {
            background: linear-gradient(180deg, #ff6b35 0%, #ff8c42 20%, #f7567c 45%, #6a0572 70%, #1a0533 100%) !important;
          }
          .sf-sun { opacity: 1 !important; top: 30% !important; }
          .sf-moon { opacity: 0 !important; }
          .sf-stars-container { opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default memo(StarFieldBackground);
