import { memo, useMemo } from 'react';

/**
 * CINEMATIC DAY/NIGHT CYCLE BACKGROUND
 * 80s loop: Sunset → Night → Sunrise → repeat
 * Realistic muted tones with VISIBLE motion throughout.
 */

function generateStars(count: number) {
  const stars: { top: string; left: string; size: number; delay: string; duration: string }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      top: `${Math.random() * 55}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      delay: `${(Math.random() * 4).toFixed(1)}s`,
      duration: `${(Math.random() * 2.5 + 1.5).toFixed(1)}s`,
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

      {/* Horizon glow band */}
      <div className="sf-horizon-glow" />

      {/* SUN */}
      <div className="sf-sun">
        <div className="sf-sun-core" />
        <div className="sf-sun-rays" />
      </div>

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
        <div className="sf-ocean-shimmer sf-ocean-shimmer-2" />
      </div>

      {/* WAVES - multiple layers for depth */}
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
        /* ===== SKY - 80s cycle, realistic earth tones ===== */
        .sf-sky {
          position: absolute;
          inset: 0;
          animation: sfSkyCycle 80s linear infinite;
        }
        @keyframes sfSkyCycle {
          0%   { background: linear-gradient(180deg, #d4873a 0%, #c46a2e 25%, #a34525 50%, #5a2a1a 75%, #1a1510 100%); }
          12%  { background: linear-gradient(180deg, #b35a28 0%, #8c3a1e 25%, #5c2518 50%, #2a1810 75%, #0f0d0a 100%); }
          22%  { background: linear-gradient(180deg, #4a2218 0%, #2a1510 25%, #150e0b 50%, #0a0908 75%, #060505 100%); }
          30%  { background: linear-gradient(180deg, #0a0c14 0%, #08091a 25%, #060812 50%, #04050c 75%, #030406 100%); }
          50%  { background: linear-gradient(180deg, #080a12 0%, #060818 25%, #050710 50%, #03040a 75%, #020305 100%); }
          62%  { background: linear-gradient(180deg, #1a1210 0%, #3a1e14 25%, #6b3520 50%, #a04a28 75%, #c46a2e 100%); }
          75%  { background: linear-gradient(180deg, #c49050 0%, #d4a060 25%, #c88040 50%, #a05a30 75%, #704028 100%); }
          88%  { background: linear-gradient(180deg, #d4903a 0%, #c47030 25%, #a85028 50%, #7a3820 75%, #4a2518 100%); }
          100% { background: linear-gradient(180deg, #d4873a 0%, #c46a2e 25%, #a34525 50%, #5a2a1a 75%, #1a1510 100%); }
        }

        /* ===== HORIZON GLOW - warm band at horizon ===== */
        .sf-horizon-glow {
          position: absolute;
          left: 0;
          right: 0;
          top: 60%;
          height: 20%;
          animation: sfHorizonGlow 80s linear infinite;
          filter: blur(30px);
        }
        @keyframes sfHorizonGlow {
          0%   { background: radial-gradient(ellipse 120% 100% at 50% 50%, rgba(212,135,58,0.4) 0%, transparent 70%); }
          22%  { background: radial-gradient(ellipse 120% 100% at 50% 50%, rgba(180,80,30,0.25) 0%, transparent 70%); }
          30%  { background: radial-gradient(ellipse 120% 100% at 50% 50%, rgba(10,12,20,0) 0%, transparent 70%); }
          50%  { background: radial-gradient(ellipse 120% 100% at 50% 50%, rgba(10,12,20,0) 0%, transparent 70%); }
          62%  { background: radial-gradient(ellipse 120% 100% at 50% 50%, rgba(200,100,40,0.3) 0%, transparent 70%); }
          75%  { background: radial-gradient(ellipse 120% 100% at 50% 50%, rgba(212,160,96,0.35) 0%, transparent 70%); }
          100% { background: radial-gradient(ellipse 120% 100% at 50% 50%, rgba(212,135,58,0.4) 0%, transparent 70%); }
        }

        /* ===== SUN - visibly moves down and up ===== */
        .sf-sun {
          position: absolute;
          width: 56px;
          height: 56px;
          left: 50%;
          margin-left: -28px;
          animation: sfSunPos 80s linear infinite;
          will-change: top, opacity;
        }
        .sf-sun-core {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff7cc 0%, #f0c040 50%, #d08020 100%);
          box-shadow: 0 0 20px 8px rgba(240,192,64,0.4);
        }
        .sf-sun-rays {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240,192,64,0.3) 0%, rgba(208,128,32,0.1) 50%, transparent 70%);
          animation: sfSunPulse 4s ease-in-out infinite;
        }
        @keyframes sfSunPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.3); opacity: 1; }
        }
        @keyframes sfSunPos {
          0%   { top: 30%; opacity: 1; }
          8%   { top: 38%; opacity: 1; }
          15%  { top: 50%; opacity: 0.95; }
          22%  { top: 62%; opacity: 0.6; }
          28%  { top: 70%; opacity: 0.15; }
          32%  { top: 74%; opacity: 0; }
          58%  { top: 74%; opacity: 0; }
          62%  { top: 70%; opacity: 0.15; }
          68%  { top: 60%; opacity: 0.6; }
          75%  { top: 45%; opacity: 0.95; }
          82%  { top: 34%; opacity: 1; }
          90%  { top: 30%; opacity: 1; }
          100% { top: 30%; opacity: 1; }
        }

        /* ===== MOON ===== */
        .sf-moon {
          position: absolute;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          left: 38%;
          background: radial-gradient(circle at 35% 35%, #e8e4d8 0%, #c8c0b0 60%, #a09888 100%);
          box-shadow: 0 0 12px 4px rgba(232, 228, 216, 0.1);
          animation: sfMoonPos 80s linear infinite;
          will-change: top, opacity;
        }
        @keyframes sfMoonPos {
          0%   { opacity: 0; top: 20%; }
          28%  { opacity: 0; top: 20%; }
          35%  { opacity: 0.7; top: 15%; }
          42%  { opacity: 0.9; top: 12%; }
          50%  { opacity: 0.9; top: 11%; }
          55%  { opacity: 0.7; top: 13%; }
          62%  { opacity: 0; top: 18%; }
          100% { opacity: 0; top: 20%; }
        }

        /* ===== STARS ===== */
        .sf-stars-container {
          position: absolute;
          inset: 0;
          animation: sfStarsVis 80s linear infinite;
          will-change: opacity;
        }
        @keyframes sfStarsVis {
          0%   { opacity: 0; }
          28%  { opacity: 0; }
          35%  { opacity: 1; }
          55%  { opacity: 1; }
          62%  { opacity: 0; }
          100% { opacity: 0; }
        }
        .sf-star {
          position: absolute;
          border-radius: 50%;
          background: #e8e0d0;
          animation: sfTwinkle ease-in-out infinite alternate;
        }
        @keyframes sfTwinkle {
          0%   { opacity: 0.15; transform: scale(0.7); }
          100% { opacity: 0.95; transform: scale(1.2); }
        }

        /* ===== OCEAN - dark realistic water ===== */
        .sf-ocean {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 28%;
          animation: sfOceanCycle 80s linear infinite;
          overflow: hidden;
        }
        @keyframes sfOceanCycle {
          0%   { background: linear-gradient(180deg, rgba(164,69,37,0.25) 0%, #1a1510 35%, #0d0b08 100%); }
          30%  { background: linear-gradient(180deg, rgba(8,10,18,0.5) 0%, #04050c 35%, #020305 100%); }
          50%  { background: linear-gradient(180deg, rgba(6,8,16,0.4) 0%, #03040a 35%, #020204 100%); }
          75%  { background: linear-gradient(180deg, rgba(196,128,64,0.2) 0%, #2a3040 35%, #141820 100%); }
          100% { background: linear-gradient(180deg, rgba(164,69,37,0.25) 0%, #1a1510 35%, #0d0b08 100%); }
        }

        /* Shimmer streaks on water - moving horizontally */
        .sf-ocean-shimmer {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.02) 8%,
            transparent 16%
          );
          animation: sfShimmer 6s ease-in-out infinite;
        }
        .sf-ocean-shimmer-2 {
          animation: sfShimmer2 8s ease-in-out infinite;
          background: repeating-linear-gradient(
            85deg,
            transparent 0%,
            rgba(255,255,255,0.015) 12%,
            transparent 24%
          );
        }
        @keyframes sfShimmer {
          0%   { transform: translateX(-8%) scaleY(1); }
          50%  { transform: translateX(8%) scaleY(1.02); }
          100% { transform: translateX(-8%) scaleY(1); }
        }
        @keyframes sfShimmer2 {
          0%   { transform: translateX(6%); }
          50%  { transform: translateX(-6%); }
          100% { transform: translateX(6%); }
        }

        /* ===== WAVES - visible swaying motion ===== */
        .sf-wave {
          position: absolute;
          bottom: 0;
          left: -10%;
          width: 120%;
          will-change: transform;
        }
        .sf-wave-1 {
          z-index: 3;
          height: 50px;
          animation: sfWM1 5s ease-in-out infinite;
        }
        .sf-wave-1 path {
          animation: sfWF1 80s linear infinite;
        }
        .sf-wave-2 {
          z-index: 2;
          height: 40px;
          bottom: 5px;
          animation: sfWM2 7s ease-in-out infinite;
        }
        .sf-wave-2 path {
          animation: sfWF2 80s linear infinite;
        }
        .sf-wave-3 {
          z-index: 1;
          height: 35px;
          bottom: 12px;
          animation: sfWM3 9s ease-in-out infinite;
        }
        .sf-wave-3 path {
          animation: sfWF3 80s linear infinite;
        }

        @keyframes sfWF1 {
          0%   { fill: rgba(26,21,16,0.55); }
          30%  { fill: rgba(5,6,14,0.65); }
          50%  { fill: rgba(4,5,12,0.65); }
          75%  { fill: rgba(20,24,35,0.55); }
          100% { fill: rgba(26,21,16,0.55); }
        }
        @keyframes sfWF2 {
          0%   { fill: rgba(26,21,16,0.35); }
          30%  { fill: rgba(5,6,14,0.45); }
          50%  { fill: rgba(4,5,12,0.45); }
          75%  { fill: rgba(20,24,35,0.35); }
          100% { fill: rgba(26,21,16,0.35); }
        }
        @keyframes sfWF3 {
          0%   { fill: rgba(26,21,16,0.2); }
          30%  { fill: rgba(5,6,14,0.3); }
          50%  { fill: rgba(4,5,12,0.3); }
          75%  { fill: rgba(20,24,35,0.2); }
          100% { fill: rgba(26,21,16,0.2); }
        }

        /* Wave horizontal sway - bigger movement, clearly visible */
        @keyframes sfWM1 {
          0%   { transform: translateX(0) translateY(0); }
          25%  { transform: translateX(-20px) translateY(-2px); }
          50%  { transform: translateX(0) translateY(0); }
          75%  { transform: translateX(20px) translateY(-1px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes sfWM2 {
          0%   { transform: translateX(0) translateY(0); }
          25%  { transform: translateX(15px) translateY(-1px); }
          50%  { transform: translateX(0) translateY(0); }
          75%  { transform: translateX(-15px) translateY(-2px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes sfWM3 {
          0%   { transform: translateX(0) translateY(0); }
          33%  { transform: translateX(-10px) translateY(-1px); }
          66%  { transform: translateX(10px) translateY(-1px); }
          100% { transform: translateX(0) translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sf-sky,.sf-sun,.sf-sun-rays,.sf-moon,.sf-stars-container,
          .sf-ocean,.sf-ocean-shimmer,.sf-star,.sf-wave,.sf-wave path,
          .sf-horizon-glow {
            animation: none !important;
          }
          .sf-sky { background: linear-gradient(180deg, #d4873a 0%, #c46a2e 25%, #a34525 50%, #5a2a1a 75%, #1a1510 100%) !important; }
          .sf-sun { opacity: 1 !important; top: 30% !important; }
          .sf-moon { opacity: 0 !important; }
          .sf-stars-container { opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default memo(StarFieldBackground);
