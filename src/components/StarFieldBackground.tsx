import { memo, useMemo } from 'react';

/**
 * CINEMATIC DAY/NIGHT CYCLE BACKGROUND
 * 120s loop: Sunset → Night → Sunrise → repeat
 * Realistic muted tones, no purple/pink. Earth & ocean colors only.
 */

function generateStars(count: number) {
  const stars: { top: string; left: string; size: number; delay: string; duration: string }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      top: `${Math.random() * 60}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      delay: `${(Math.random() * 5).toFixed(1)}s`,
      duration: `${(Math.random() * 3 + 2).toFixed(1)}s`,
    });
  }
  return stars;
}

function StarFieldBackground() {
  const stars = useMemo(() => generateStars(45), []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {/* SKY */}
      <div className="sf-sky" />

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
      <svg className="sf-wave sf-wave-1" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" />
      </svg>
      <svg className="sf-wave sf-wave-2" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,80 C360,20 720,100 1080,40 C1260,10 1380,70 1440,80 L1440,120 L0,120 Z" />
      </svg>
      <svg className="sf-wave sf-wave-3" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,90 C180,60 360,100 540,70 C720,40 900,100 1080,80 C1260,60 1380,90 1440,85 L1440,120 L0,120 Z" />
      </svg>

      <style>{`
        /* ===== SKY - realistic muted earth tones ===== */
        .sf-sky {
          position: absolute;
          inset: 0;
          animation: sfSkyCycle 120s linear infinite;
        }
        @keyframes sfSkyCycle {
          0%   { background: linear-gradient(180deg, #d4873a 0%, #c46a2e 25%, #a34525 50%, #5a2a1a 75%, #1a1510 100%); }
          10%  { background: linear-gradient(180deg, #b35a28 0%, #8c3a1e 25%, #5c2518 50%, #2a1810 75%, #0f0d0a 100%); }
          20%  { background: linear-gradient(180deg, #6b3020 0%, #3a1a12 25%, #1a120e 50%, #0d0b09 75%, #080706 100%); }
          25%  { background: linear-gradient(180deg, #1a1510 0%, #0f0d0a 25%, #0a0908 50%, #070605 75%, #050404 100%); }
          33%  { background: linear-gradient(180deg, #0a0c14 0%, #08091a 25%, #060812 50%, #04050c 75%, #030406 100%); }
          50%  { background: linear-gradient(180deg, #080a12 0%, #060818 25%, #050710 50%, #03040a 75%, #020305 100%); }
          60%  { background: linear-gradient(180deg, #0d0c14 0%, #1a1218 25%, #2a1510 50%, #1a0f0a 75%, #0a0806 100%); }
          70%  { background: linear-gradient(180deg, #3a2015 0%, #6b3520 25%, #a04a28 50%, #c46a2e 75%, #d4873a 100%); }
          80%  { background: linear-gradient(180deg, #c49050 0%, #d4a060 25%, #c88040 50%, #a05a30 75%, #704028 100%); }
          90%  { background: linear-gradient(180deg, #d4903a 0%, #c47030 25%, #a85028 50%, #7a3820 75%, #4a2518 100%); }
          100% { background: linear-gradient(180deg, #d4873a 0%, #c46a2e 25%, #a34525 50%, #5a2a1a 75%, #1a1510 100%); }
        }

        /* ===== SUN - warm golden, not neon ===== */
        .sf-sun {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          left: 50%;
          margin-left: -25px;
          background: radial-gradient(circle, #ffe8b0 0%, #e8a840 45%, #c07020 80%, transparent 100%);
          box-shadow: 0 0 30px 10px rgba(232, 168, 64, 0.35), 0 0 60px 20px rgba(192, 112, 32, 0.15);
          animation: sfSunPos 120s linear infinite;
          will-change: top, opacity;
        }
        @keyframes sfSunPos {
          0%   { top: 32%; opacity: 1; }
          15%  { top: 55%; opacity: 0.9; }
          25%  { top: 70%; opacity: 0.2; }
          30%  { top: 74%; opacity: 0; }
          60%  { top: 74%; opacity: 0; }
          65%  { top: 70%; opacity: 0.2; }
          75%  { top: 50%; opacity: 0.9; }
          85%  { top: 30%; opacity: 1; }
          95%  { top: 32%; opacity: 1; }
          100% { top: 32%; opacity: 1; }
        }

        /* ===== MOON ===== */
        .sf-moon {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          left: 38%;
          background: radial-gradient(circle at 35% 35%, #e8e4d8 0%, #c8c0b0 60%, #a09888 100%);
          box-shadow: 0 0 15px 5px rgba(232, 228, 216, 0.12);
          animation: sfMoonPos 120s linear infinite;
          will-change: opacity;
        }
        @keyframes sfMoonPos {
          0%   { opacity: 0; top: 18%; }
          28%  { opacity: 0; top: 18%; }
          35%  { opacity: 0.7; top: 14%; }
          50%  { opacity: 0.9; top: 11%; }
          58%  { opacity: 0.7; top: 14%; }
          65%  { opacity: 0; top: 18%; }
          100% { opacity: 0; top: 18%; }
        }

        /* ===== STARS ===== */
        .sf-stars-container {
          position: absolute;
          inset: 0;
          animation: sfStarsVis 120s linear infinite;
          will-change: opacity;
        }
        @keyframes sfStarsVis {
          0%   { opacity: 0; }
          28%  { opacity: 0; }
          35%  { opacity: 1; }
          58%  { opacity: 1; }
          65%  { opacity: 0; }
          100% { opacity: 0; }
        }
        .sf-star {
          position: absolute;
          border-radius: 50%;
          background: #e8e0d0;
          animation: sfTwinkle ease-in-out infinite alternate;
        }
        @keyframes sfTwinkle {
          0%   { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 0.9; transform: scale(1.1); }
        }

        /* ===== OCEAN - dark realistic water ===== */
        .sf-ocean {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 28%;
          animation: sfOceanCycle 120s linear infinite;
        }
        @keyframes sfOceanCycle {
          0%   { background: linear-gradient(180deg, rgba(164,69,37,0.25) 0%, #1a1510 35%, #0d0b08 100%); }
          25%  { background: linear-gradient(180deg, rgba(15,13,10,0.4) 0%, #080706 35%, #040403 100%); }
          33%  { background: linear-gradient(180deg, rgba(8,10,18,0.5) 0%, #04050c 35%, #020305 100%); }
          50%  { background: linear-gradient(180deg, rgba(6,8,16,0.4) 0%, #03040a 35%, #020204 100%); }
          70%  { background: linear-gradient(180deg, rgba(160,74,40,0.2) 0%, #1a1510 35%, #0d0b08 100%); }
          85%  { background: linear-gradient(180deg, rgba(196,128,64,0.2) 0%, #2a3848 35%, #141c28 100%); }
          100% { background: linear-gradient(180deg, rgba(164,69,37,0.25) 0%, #1a1510 35%, #0d0b08 100%); }
        }
        .sf-ocean-shimmer {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.015) 10%,
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
          height: 45px;
          will-change: transform;
        }
        .sf-wave-1 { z-index: 3; }
        .sf-wave-1 path { animation: sfWF1 120s linear infinite; }
        .sf-wave-2 { z-index: 2; height: 35px; bottom: 6px; }
        .sf-wave-2 path { animation: sfWF2 120s linear infinite; }
        .sf-wave-3 { z-index: 1; height: 30px; bottom: 12px; }
        .sf-wave-3 path { animation: sfWF3 120s linear infinite; }

        @keyframes sfWF1 {
          0%   { fill: rgba(26,21,16,0.6); }
          33%  { fill: rgba(5,6,12,0.7); }
          50%  { fill: rgba(4,5,10,0.7); }
          85%  { fill: rgba(20,28,40,0.6); }
          100% { fill: rgba(26,21,16,0.6); }
        }
        @keyframes sfWF2 {
          0%   { fill: rgba(26,21,16,0.35); }
          33%  { fill: rgba(5,6,12,0.45); }
          50%  { fill: rgba(4,5,10,0.45); }
          85%  { fill: rgba(20,28,40,0.35); }
          100% { fill: rgba(26,21,16,0.35); }
        }
        @keyframes sfWF3 {
          0%   { fill: rgba(26,21,16,0.2); }
          33%  { fill: rgba(5,6,12,0.3); }
          50%  { fill: rgba(4,5,10,0.3); }
          85%  { fill: rgba(20,28,40,0.2); }
          100% { fill: rgba(26,21,16,0.2); }
        }

        .sf-wave-1 { animation: sfWM1 7s ease-in-out infinite; }
        .sf-wave-2 { animation: sfWM2 9s ease-in-out infinite; }
        .sf-wave-3 { animation: sfWM3 11s ease-in-out infinite; }
        @keyframes sfWM1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-12px)} }
        @keyframes sfWM2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(10px)} }
        @keyframes sfWM3 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-7px)} }

        @media (prefers-reduced-motion: reduce) {
          .sf-sky,.sf-sun,.sf-moon,.sf-stars-container,.sf-ocean,.sf-ocean-shimmer,.sf-star,.sf-wave,.sf-wave path {
            animation: none !important;
          }
          .sf-sky { background: linear-gradient(180deg, #d4873a 0%, #c46a2e 25%, #a34525 50%, #5a2a1a 75%, #1a1510 100%) !important; }
          .sf-sun { opacity: 1 !important; top: 32% !important; }
          .sf-moon { opacity: 0 !important; }
          .sf-stars-container { opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default memo(StarFieldBackground);
