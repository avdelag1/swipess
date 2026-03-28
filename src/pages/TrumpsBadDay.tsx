/**
 * TrumpsBadDay — Worms-style canvas mini-game.
 * A little Mexican guy armed with 5 weapons shoots at cartoon Trump.
 * Lives as an app page alongside the Stars / Orbs / etc. filter screens.
 *
 * Controls  : Drag from the catapult area → release to fire
 * Weapons   : 1-Rock  2-Arrow  3-Grenade  4-Bomb  5-Bazooka
 * Scenes    : "Change Scene" button cycles 5 backgrounds
 * Scoring   : 100 × combo per hit, saved to Supabase
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share2 } from 'lucide-react';

const lockOrientation = async () => {
  if (screen.orientation && 'lock' in screen.orientation) {
    try {
      await (screen.orientation as any).lock('landscape');
    } catch (err) {
      console.warn('Orientation lock failed:', err);
    }
  }
};

const unlockOrientation = () => {
  if (screen.orientation && 'unlock' in screen.orientation) {
    try {
      screen.orientation.unlock();
    } catch (err) {
      console.warn('Orientation unlock failed:', err);
    }
  }
};

// ─── Canvas size ─────────────────────────────────────────────────────────────
const CW = 1280;
const CH = 720;

// ─── Types ───────────────────────────────────────────────────────────────────
type WeaponKey = 'rock' | 'arrow' | 'grenade' | 'bomb' | 'bazooka' | 'laser';
type BgKey = 'whitehouse' | 'mexican' | 'epstein' | 'mara_lago' | 'prison';

interface Projectile {
  x: number; y: number; vx: number; vy: number;
  weapon: WeaponKey; active: boolean;
  bounces: number; age: number;
  explodeTimer: number;
  trail: { x: number; y: number }[];
  smoke: { x: number; y: number; a: number }[];
}
interface Explosion {
  x: number; y: number;
  radius: number; frame: number; maxFrame: number; big: boolean;
}
interface Confetti {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rot: number; rotV: number; life: number;
}
interface G {
  score: number; combo: number; misses: number; hits: number;
  wind: number; bgIndex: number; weapon: WeaponKey;
  highScore: number; isNewHighScore: boolean;
  phase: 'playing' | 'gameover';
  // Trump
  tx: number; ty: number; tw: number; th: number;
  tHit: boolean; tHitF: number; tHairOff: boolean;
  tDancing: boolean; tDanceF: number;
  tPhrase: string; tPhraseT: number;
  tVelX: number;
  tVelY: number;
  jailing: boolean;
  tJumping: boolean;
  tApproach: boolean;
  // Shooter
  spPhrase: string; spTimer: number;
  // Arrays
  projectiles: Projectile[];
  explosions: Explosion[];
  confetti: Confetti[];
  particles: { x: number, y: number, r: number, vx: number, vy: number, age: number, type: 'dust'|'spark'|'laser' }[];
  // Terrain
  heights: Float32Array;
  // Drag
  drag: boolean; dragEnd: { x: number; y: number };
  // Visual FX
  shake: number;
}

// ─── Statics ─────────────────────────────────────────────────────────────────
const BACKGROUNDS: { key: BgKey; label: string }[] = [
  { key: 'whitehouse', label: 'White House' },
  { key: 'mexican',    label: 'Border Wall'  },
  { key: 'epstein',    label: 'Epstein Island' },
  { key: 'mara_lago',  label: 'Mar-a-Lago'   },
  { key: 'prison',     label: 'Prison Yard'  },
];

const WEAPONS: { key: WeaponKey; icon: string; label: string }[] = [
  { key: 'rock',    icon: '🪨', label: 'Rock'    },
  { key: 'arrow',   icon: '🏹', label: 'Arrow'   },
  { key: 'grenade', icon: '💣', label: 'Grenade' },
  { key: 'bomb',    icon: '💥', label: 'Bomb'    },
  { key: 'bazooka', icon: '🚀', label: 'Bazooka' },
  { key: 'laser',   icon: '🔫', label: 'Laser'   },
];

const HIT_PHRASES   = ["You're FIRED!", "FAKE NEWS!", "WITCH HUNT!", "TREMENDOUS hit!", "Believe me!", "Nobody does it worse!", "I'm very stable!", "SAD!"];
const MISS_PHRASES  = ["You're a DISGRACE!", "LOSER!", "You should be ASHAMED!", "Very Sad!", "Total DISASTER!", "WRONG!", "You can't hit me!"];
const SHOOT_PHRASES = ["¡Ándale!", "¡Órale!", "¡Arriba!", "¡Híjole!", "¡Vámonos!"];

const WEAPON_GRAVITY: Record<WeaponKey, number> = { rock: 0.4, arrow: 0.2, grenade: 0.35, bomb: 0.5, bazooka: 0.1, laser: 0.0 };
const WEAPON_BOUNCE:  Record<WeaponKey, number> = { rock: 0.3, arrow: 0.05, grenade: 0.72, bomb: 0.2, bazooka: 0, laser: 0.0 };
const WEAPON_RADIUS:  Record<WeaponKey, number> = { rock: 12, arrow: 6, grenade: 10, bomb: 15, bazooka: 8, laser: 3 };
const WEAPON_SPEED:   Record<WeaponKey, number> = { rock: 1.0, arrow: 1.2, grenade: 0.9, bomb: 0.8, bazooka: 1.5, laser: 6.0 };
const CATAPULT_X = 100;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

// ─── Audio ───────────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
const AC = (): AudioContext => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _audioCtx;
};
const beep = (freq: number, dur: number, type: OscillatorType = 'square', vol = 0.25) => {
  try {
    const ctx = AC(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * 0.3, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* noop */ }
};
const boom = () => {
  try {
    const ctx = AC(); const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * 0.5, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    src.connect(g); g.connect(ctx.destination); src.start();
  } catch { /* noop */ }
};

// ─── Terrain ─────────────────────────────────────────────────────────────────
function genTerrain(): Float32Array {
  const h = new Float32Array(CW);
  for (let x = 0; x < CW; x++) {
    h[x] = 100 + Math.sin(x * 0.008) * 30 + Math.sin(x * 0.02 + 1.2) * 15 + Math.sin(x * 0.05 + 0.7) * 8;
  }
  return h;
}
function craterTerrain(heights: Float32Array, cx: number, cy: number, r: number) {
  const base = CH - 80;
  for (let x = Math.max(0, cx - r | 0); x < Math.min(CW, (cx + r) | 0); x++) {
    const dy = Math.sqrt(Math.max(0, r * r - (x - cx) ** 2));
    const tY = base - heights[x];
    const eBottom = cy + dy;
    if (eBottom > tY) heights[x] = Math.max(0, base - eBottom);
  }
}
const terrainY = (heights: Float32Array, x: number) => (CH - 80) - (heights[Math.max(0, Math.min(CW - 1, x | 0))] ?? 120);

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawBg(ctx: CanvasRenderingContext2D, bg: BgKey) {
  switch (bg) {
    case 'whitehouse': {
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#6bb8e8'); sky.addColorStop(0.65, '#c2e8f5'); sky.addColorStop(1, '#4a8e34');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#4CAF50'; ctx.fillRect(0, CH * 0.63, CW, CH * 0.37);
      // White House
      ctx.fillStyle = '#f4f4ee'; ctx.fillRect(680, 145, 420, 265);
      for (let i = 0; i < 7; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(700 + i * 55, 165, 16, 215); }
      ctx.fillStyle = '#e2e2da';
      ctx.beginPath(); ctx.moveTo(660, 145); ctx.lineTo(890, 70); ctx.lineTo(1120, 145); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(890, 130, 58, Math.PI, 2 * Math.PI); ctx.fill();
      // Flags
      [680, 890, 1100].forEach(fx => {
        ctx.fillStyle = '#888'; ctx.fillRect(fx, 72, 4, 95);
        ctx.fillStyle = '#B22234'; ctx.fillRect(fx + 4, 72, 48, 32);
        for (let s = 0; s < 6; s += 2) { ctx.fillStyle = '#fff'; ctx.fillRect(fx + 4, 78 + s * 3.5, 48, 2.5); }
        ctx.fillStyle = '#3C3B6E'; ctx.fillRect(fx + 4, 72, 19, 13);
      });
      // Fence
      for (let fx = 0; fx < CW; fx += 28) {
        ctx.fillStyle = '#efefdf';
        ctx.fillRect(fx, 376, 3, 78); ctx.fillRect(fx, 382, 32, 5); ctx.fillRect(fx, 405, 32, 5);
      }
      // Trees
      [55, 155, 590, 645].forEach(tx => {
        ctx.fillStyle = '#5a8a30'; ctx.beginPath(); ctx.arc(tx, 315, 38, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6B8E23'; ctx.beginPath(); ctx.arc(tx, 285, 27, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8B6914'; ctx.fillRect(tx - 7, 338, 14, 52);
      });
      break;
    }
    case 'mexican': {
      const sky = ctx.createLinearGradient(0, 0, 0, CH * 0.65);
      sky.addColorStop(0, '#FF7A00'); sky.addColorStop(0.5, '#FFD000'); sky.addColorStop(1, '#F5B847');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH * 0.65);
      ctx.fillStyle = '#D2A96A'; ctx.fillRect(0, CH * 0.6, CW, CH * 0.4);
      // Wall
      ctx.fillStyle = '#9E9E9E'; ctx.fillRect(380, 90, 520, 420);
      ctx.strokeStyle = '#787878'; ctx.lineWidth = 1.5;
      for (let wy = 90; wy < 510; wy += 48) { ctx.beginPath(); ctx.moveTo(380, wy); ctx.lineTo(900, wy); ctx.stroke(); }
      for (let wx = 380; wx < 900; wx += 78) { ctx.beginPath(); ctx.moveTo(wx, 90); ctx.lineTo(wx, 510); ctx.stroke(); }
      // Graffiti
      ctx.fillStyle = '#FF3800'; ctx.font = 'bold 26px Arial'; ctx.fillText('NO MORE WALLS!', 420, 195);
      ctx.fillStyle = '#00BB00'; ctx.font = '21px Arial'; ctx.fillText('🇲🇽 MEXICO LIBRE 🇲🇽', 430, 262);
      ctx.fillStyle = '#FFD700'; ctx.font = '18px Arial'; ctx.fillText('TRUMP GO HOME', 460, 330);
      ctx.fillStyle = '#FF4444'; ctx.font = 'bold 16px Arial'; ctx.fillText('VIVA LA RESISTENCIA!', 435, 390);
      // Cacti
      [75, 200, 990, 1110, 1210].forEach(cx => {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(cx - 9, 378, 18, 122); ctx.fillRect(cx - 32, 418, 28, 13); ctx.fillRect(cx + 14, 440, 28, 13);
        ctx.fillRect(cx - 32, 405, 13, 28); ctx.fillRect(cx + 14, 427, 13, 28);
      });
      // Sun
      ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(1110, 75, 58, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath(); ctx.moveTo(1110 + Math.cos(a) * 68, 75 + Math.sin(a) * 68);
        ctx.lineTo(1110 + Math.cos(a) * 88, 75 + Math.sin(a) * 88); ctx.stroke();
      }
      break;
    }
    case 'epstein': {
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#1a1a3e'); sky.addColorStop(0.4, '#2d3561'); sky.addColorStop(0.7, '#4a6fa5'); sky.addColorStop(1, '#1a5276');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#1a5276'; ctx.fillRect(0, CH * 0.56, CW, CH * 0.44);
      ctx.fillStyle = '#8B7355'; ctx.fillRect(0, CH * 0.63, CW, CH * 0.37);
      ctx.fillStyle = '#2E8B57'; ctx.fillRect(0, CH * 0.61, CW, 28);
      // Temple
      ctx.fillStyle = '#5D4037'; ctx.fillRect(490, 140, 360, 335);
      for (let s = 0; s < 5; s++) { ctx.fillStyle = `hsl(30,35%,${22 + s * 5}%)`; ctx.fillRect(490 - s * 14, 475 - s * 24, 360 + s * 28, 24); }
      ctx.fillStyle = '#111'; ctx.fillRect(640, 325, 75, 150);
      ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) ctx.strokeRect(504 + i * 80, 155, 66, 270);
      ctx.fillStyle = '#8B6914'; ctx.font = '28px serif';
      ['💀', '💀', '💀'].forEach((s, i) => ctx.fillText(s, 522 + i * 98, 235));
      // Pool
      ctx.fillStyle = '#1B5E20'; ctx.fillRect(895, 535, 255, 108);
      ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 4; ctx.strokeRect(895, 535, 255, 108);
      // Palms
      [48, 105, 1155, 1210].forEach(tx => {
        ctx.fillStyle = '#6B4423'; ctx.fillRect(tx - 6, 375, 11, 155);
        ctx.strokeStyle = '#228B22'; ctx.lineWidth = 6;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath(); ctx.moveTo(tx, 375);
          ctx.quadraticCurveTo(tx + Math.cos(a) * 38, 375 + Math.sin(a) * 18, tx + Math.cos(a) * 78, 375 + Math.sin(a) * 48);
          ctx.stroke();
        }
      });
      // Stars
      for (let i = 0; i < 55; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath();
        ctx.arc((i * 137.5) % CW, (i * 73) % (CH * 0.38), 1.4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'mara_lago': {
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#87CEEB'); sky.addColorStop(0.7, '#FFF8DC'); sky.addColorStop(1, '#90EE90');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#2E8B57'; ctx.fillRect(0, CH * 0.56, CW, CH * 0.44);
      // Golf holes
      for (let i = 0; i < 5; i++) {
        const hx = 195 + i * 215;
        ctx.fillStyle = '#1B5E20'; ctx.beginPath(); ctx.arc(hx, 568, 23, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#888'; ctx.fillRect(hx, 538, 3, 38);
        ctx.fillStyle = '#FFD700'; ctx.fillRect(hx + 3, 538, 18, 13);
        ctx.fillStyle = '#000'; ctx.font = '10px sans-serif'; ctx.fillText(`${i + 1}`, hx + 8, 549);
      }
      // Mansion
      ctx.fillStyle = '#F4E04D'; ctx.fillRect(590, 115, 560, 330);
      ctx.fillStyle = '#FFD700'; ctx.fillRect(590, 108, 560, 14); ctx.fillRect(590, 440, 560, 11);
      ctx.fillStyle = '#87CEEB';
      for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
        ctx.fillRect(615 + col * 100, 145 + row * 82, 48, 48);
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; ctx.strokeRect(615 + col * 100, 145 + row * 82, 48, 48);
      }
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 38px serif'; ctx.fillText('TRUMP', 718, 418);
      // Gold palms
      [95, 195, 1155, 1205].forEach(px => {
        ctx.fillStyle = '#A0522D'; ctx.fillRect(px - 7, 345, 13, 185);
        ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 7;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
          ctx.beginPath(); ctx.moveTo(px, 345);
          ctx.quadraticCurveTo(px + Math.cos(a) * 38, 345 + Math.sin(a) * 18, px + Math.cos(a) * 88, 345 + Math.sin(a) * 52);
          ctx.stroke();
        }
      });
      // Golf clubs
      for (let i = 0; i < 4; i++) {
        const gx = 45 + i * 305; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(gx, 418); ctx.lineTo(gx + 9, 518); ctx.stroke();
        ctx.beginPath(); ctx.arc(gx + 9, 518, 11, 0, Math.PI * 2); ctx.stroke();
      }
      break;
    }
    case 'prison': {
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#37474F'); sky.addColorStop(0.5, '#455A64'); sky.addColorStop(1, '#546E7A');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#9E9E9E'; ctx.fillRect(0, CH * 0.6, CW, CH * 0.4);
      // Walls
      ctx.fillStyle = '#616161'; ctx.fillRect(0, 45, 58, CH); ctx.fillRect(CW - 58, 45, 58, CH);
      // Guard towers
      [0, CW - 78].forEach(tx => {
        ctx.fillStyle = '#424242'; ctx.fillRect(tx, 18, 78, 98);
        ctx.fillStyle = '#BDBDBD'; ctx.fillRect(tx + 9, 28, 58, 58);
        ctx.fillStyle = '#FFEB3B'; ctx.beginPath(); ctx.arc(tx + 38, 38, 11, 0, Math.PI * 2); ctx.fill();
      });
      // Barbed wire
      for (let bx = 58; bx < CW - 58; bx += 18) {
        ctx.strokeStyle = '#BDBDBD'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx, 78); ctx.lineTo(bx + 18, 78); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + 9, 73); ctx.lineTo(bx + 9, 83); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + 4, 75); ctx.lineTo(bx + 14, 81); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, 98); ctx.lineTo(bx + 18, 98); ctx.stroke();
      }
      // Cell block
      ctx.fillStyle = '#546E7A'; ctx.fillRect(195, 145, 815, 308);
      for (let row = 0; row < 3; row++) for (let col = 0; col < 10; col++) {
        ctx.fillStyle = '#263238'; ctx.fillRect(215 + col * 76, 162 + row * 85, 44, 58);
        ctx.strokeStyle = '#9E9E9E'; ctx.lineWidth = 2.5;
        for (let b = 0; b < 4; b++) {
          ctx.beginPath(); ctx.moveTo(215 + col * 76 + b * 12, 162 + row * 85);
          ctx.lineTo(215 + col * 76 + b * 12, 218 + row * 85); ctx.stroke();
        }
      }
      // Prisoners
      for (let i = 0; i < 4; i++) {
        const px = 100 + i * 300; const py = 540;
        ctx.fillStyle = '#FF5722'; ctx.fillRect(px - 14, py - 48, 28, 48);
        ctx.fillStyle = '#FFCCBC'; ctx.beginPath(); ctx.arc(px, py - 58, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = '10px monospace'; ctx.fillText('47', px - 8, py - 23);
      }
      break;
    }
  }
}

function drawTerrain(ctx: CanvasRenderingContext2D, heights: Float32Array) {
  const base = CH - 80;
  ctx.fillStyle = '#3d6e33';
  ctx.beginPath(); ctx.moveTo(0, CH);
  for (let x = 0; x < CW; x++) ctx.lineTo(x, base - heights[x]);
  ctx.lineTo(CW, CH); ctx.closePath(); ctx.fill();

  const dirt = ctx.createLinearGradient(0, base, 0, CH);
  dirt.addColorStop(0, '#6B4226'); dirt.addColorStop(1, '#3E2A1A');
  ctx.fillStyle = dirt;
  ctx.beginPath(); ctx.moveTo(0, CH);
  for (let x = 0; x < CW; x++) ctx.lineTo(x, base - heights[x] + 9);
  ctx.lineTo(CW, CH); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#66BB6A'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, base - heights[0]);
  for (let x = 1; x < CW; x++) ctx.lineTo(x, base - heights[x]);
  ctx.stroke();
}

function drawSLogo(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 300px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', CW / 2, CH / 2);
  ctx.restore();
}

function drawCatapult(
  ctx: CanvasRenderingContext2D,
  heights: Float32Array,
  drag: boolean,
  dragEndX: number, dragEndY: number,
) {
  const base = CH - 80;
  const th = heights[CATAPULT_X] ?? 120;
  const bY = base - th;

  // Slingshot frame
  ctx.strokeStyle = '#6B3410'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(CATAPULT_X, bY - 5); ctx.lineTo(CATAPULT_X - 22, bY - 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CATAPULT_X, bY - 5); ctx.lineTo(CATAPULT_X + 22, bY - 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CATAPULT_X, bY - 5); ctx.lineTo(CATAPULT_X, bY + 32); ctx.stroke();

  // Elastic
  if (drag) {
    ctx.strokeStyle = '#DEB887'; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(CATAPULT_X - 22, bY - 62); ctx.lineTo(dragEndX, dragEndY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CATAPULT_X + 22, bY - 62); ctx.lineTo(dragEndX, dragEndY); ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = '#DEB887'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(CATAPULT_X - 22, bY - 62); ctx.lineTo(CATAPULT_X, bY - 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CATAPULT_X + 22, bY - 62); ctx.lineTo(CATAPULT_X, bY - 46); ctx.stroke();
  }

  // Mexican character - Modern Polish
  const cx = CATAPULT_X; const cy = bY - 62;
  const breathe = Math.sin(Date.now() * 0.005) * 2;

  ctx.save();
  ctx.translate(cx, cy + breathe);

  // Shoes
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.ellipse(-8, 0, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, 0, 10, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Serape (body) - Rounded & Gradient
  const bodyGrad = ctx.createLinearGradient(-25, -55, 25, -10);
  bodyGrad.addColorStop(0, '#CC3300');
  bodyGrad.addColorStop(0.3, '#FFD700');
  bodyGrad.addColorStop(0.6, '#006600');
  bodyGrad.addColorStop(1, '#CC3300');
  
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  (ctx as any).roundRect(-22, -58, 44, 48, [12, 12, 5, 5]);
  ctx.fill();
  
  // Mexican Flag Stripe (middle)
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(-6, -58, 12, 48);
  ctx.fillStyle = '#0a5d00';
  ctx.beginPath(); ctx.arc(0, -34, 3, 0, Math.PI * 2); ctx.fill();

  // Head
  const headGrad = ctx.createRadialGradient(0, -70, 5, 0, -70, 20);
  headGrad.addColorStop(0, '#e0ac69');
  headGrad.addColorStop(1, '#8d5524');
  ctx.fillStyle = headGrad; 
  ctx.beginPath(); ctx.arc(0, -70, 18, 0, Math.PI * 2); ctx.fill();

  // Eyes (Blinking)
  const isBlinking = (Math.floor(Date.now() / 200) % 15 === 0);
  ctx.fillStyle = '#111';
  if (isBlinking) {
    ctx.fillRect(-8, -74, 6, 2);
    ctx.fillRect(2, -74, 6, 2);
  } else {
    ctx.beginPath(); ctx.arc(-5, -73, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -73, 3, 0, Math.PI * 2); ctx.fill();
    // Eye shines
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-6, -74.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -74.5, 1, 0, Math.PI * 2); ctx.fill();
  }

  // Mustache
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-15, -60);
  ctx.quadraticCurveTo(-15, -68, 0, -68);
  ctx.quadraticCurveTo(15, -68, 15, -60);
  ctx.quadraticCurveTo(0, -55, -15, -60);
  ctx.fill();

  // Sombrero (High Detail)
  ctx.fillStyle = '#DEB887';
  ctx.beginPath(); ctx.ellipse(0, -88, 42, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 1.5; ctx.stroke();
  
  // Crown
  const crownGrad = ctx.createLinearGradient(-20, -115, 20, -90);
  crownGrad.addColorStop(0, '#DEB887');
  crownGrad.addColorStop(0.5, '#f5deb3');
  crownGrad.addColorStop(1, '#cd853f');
  ctx.fillStyle = crownGrad;
  ctx.beginPath(); ctx.ellipse(0, -100, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.stroke();

  // Band & Pompoms
  ctx.fillStyle = '#CC3300'; ctx.fillRect(-21, -94, 42, 6);
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.arc(-16 + i * 8, -91, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function drawTrump(ctx: CanvasRenderingContext2D, g: G, _frame: number) {
  const { tx, ty, tw, th, tHit, tHitF, tHairOff, tDancing, tDanceF, tPhrase, tPhraseT, tVelY } = g;

  let ox = 0, oy = 0, rot = 0;
  if (tDancing) { const df = tDanceF % 40; ox = Math.sin(df * 0.4) * 14; oy = -Math.abs(Math.sin(df * 0.8)) * 9; rot = Math.sin(df * 0.4) * 0.14; }
  if (tHit && tHitF < 30) { rot = (tHitF / 30) * Math.PI * 0.28; ox -= tHitF * 1.8; oy -= Math.sin((tHitF / 30) * Math.PI) * 28; }

  const cx = tx + tw / 2 + ox; const cy = ty + th / 2 + oy;
  const isJumping = tVelY < -2 || tVelY > 2;
  const breathe = Math.sin(Date.now() * 0.006) * 1.5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // Suit (Body)
  const suitGrad = ctx.createLinearGradient(-25, -20, 25, 30);
  suitGrad.addColorStop(0, '#1a237e'); // Navy Blue
  suitGrad.addColorStop(1, '#0d1137');
  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  (ctx as any).roundRect(-24, -20 + breathe, 48, 55, [15, 15, 5, 5]);
  ctx.fill();

  // White Shirt
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(0, -20 + breathe);
  ctx.lineTo(-12, -20 + breathe);
  ctx.lineTo(0, 10 + breathe);
  ctx.lineTo(12, -20 + breathe);
  ctx.closePath();
  ctx.fill();

  // Red Tie
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.moveTo(-3, -20 + breathe);
  ctx.lineTo(3, -20 + breathe);
  ctx.lineTo(5, 18 + breathe);
  ctx.lineTo(0, 24 + breathe);
  ctx.lineTo(-5, 18 + breathe);
  ctx.closePath();
  ctx.fill();

  // Hands
  ctx.fillStyle = '#ffcc99';
  const handY = isJumping ? -15 : 5;
  ctx.beginPath(); ctx.arc(-28, handY + breathe, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(28, handY + breathe, 7, 0, Math.PI * 2); ctx.fill();

  // Head
  const skinGrad = ctx.createRadialGradient(0, -45, 2, 0, -45, 20);
  skinGrad.addColorStop(0, '#ffcc99');
  skinGrad.addColorStop(1, '#e68a00');
  ctx.fillStyle = skinGrad;
  ctx.beginPath(); ctx.arc(0, -45, 22, 0, Math.PI * 2); ctx.fill();

  // Face
  ctx.strokeStyle = '#8d5524'; ctx.lineWidth = 1;
  ctx.beginPath(); // Eyebrows
  ctx.moveTo(-12, -54); ctx.lineTo(-4, -50); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, -54); ctx.lineTo(4, -50); ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(-7, -48, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -48, 2, 0, Math.PI * 2); ctx.fill();

  if (tPhraseT > 0 || isJumping) {
    ctx.fillStyle = '#441111';
    ctx.beginPath(); ctx.ellipse(0, -36, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#8d5524'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -37); ctx.quadraticCurveTo(0, -35, 6, -37); ctx.stroke();
  }

  // Hair
  if (!tHairOff) {
    ctx.fillStyle = '#ffd54f';
    const hOff = isJumping ? -5 : 0;
    ctx.beginPath();
    ctx.moveTo(-24, -55 + hOff);
    ctx.quadraticCurveTo(-20, -78 + hOff, 15, -74 + hOff);
    ctx.quadraticCurveTo(32, -68 + hOff, 28, -45 + hOff);
    ctx.quadraticCurveTo(24, -58 + hOff, 0, -58 + hOff);
    ctx.quadraticCurveTo(-15, -58 + hOff, -24, -55 + hOff);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#e68a00'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -62, 10, Math.PI, 2 * Math.PI); ctx.stroke();
  }

  // Speech Bubble
  if (tPhraseT > 0 && tPhrase) {
    ctx.save();
    ctx.translate(-cx, -cy);
    ctx.globalAlpha = Math.min(1, tPhraseT / 18);
    const bx = cx; const by = cy - 100;
    const bw = tPhrase.length * 9 + 45;
    const bh = 50;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bx - bw * 0.3, by, bh * 0.45, Math.PI * 0.5, Math.PI * 1.5, false);
    ctx.arc(bx, by - bh * 0.4, bh * 0.55, Math.PI, Math.PI * 2, false);
    ctx.arc(bx + bw * 0.3, by, bh * 0.45, Math.PI * 1.5, Math.PI * 0.5, false);
    ctx.arc(bx, by + bh * 0.35, bh * 0.4, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.beginPath(); ctx.arc(bx - 12, by + bh * 0.8, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx - 22, by + bh * 1.2, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#1a1a1b'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
    ctx.fillText(tPhrase, bx, by + 5);
    ctx.restore();
  }

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
  if (!p.active) return;

  // Smoke (bazooka)
  for (const s of p.smoke) {
    ctx.fillStyle = `rgba(160,160,160,${s.a})`; ctx.beginPath();
    ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Trail
  for (let i = 0; i < p.trail.length; i++) {
    ctx.fillStyle = `rgba(255,255,120,${(i / p.trail.length) * 0.45})`;
    ctx.beginPath(); ctx.arc(p.trail[i].x, p.trail[i].y, 2, 0, Math.PI * 2); ctx.fill();
  }

  const ang = Math.atan2(p.vy, p.vx);
  ctx.save(); ctx.translate(p.x, p.y);

  switch (p.weapon) {
    case 'rock':
      ctx.rotate(p.age * 0.11);
      ctx.fillStyle = '#777';
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(5, -10); ctx.lineTo(-9, -8);
      ctx.lineTo(-12, 2); ctx.lineTo(-5, 10); ctx.lineTo(9, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(-3, -3, 4, 0, Math.PI * 2); ctx.fill();
      break;
    case 'arrow':
      ctx.rotate(ang);
      ctx.fillStyle = '#8B4513'; ctx.fillRect(-16, -2, 31, 4);
      ctx.fillStyle = '#AAA'; ctx.beginPath(); ctx.moveTo(15, -6); ctx.lineTo(28, 0); ctx.lineTo(15, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FF4444'; ctx.fillRect(-16, -7, 11, 5); ctx.fillRect(-16, 2, 11, 5);
      break;
    case 'grenade':
      ctx.rotate(p.age * 0.14);
      ctx.fillStyle = '#3a7d3a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#666'; ctx.fillRect(-3, -13, 7, 5);
      if (p.explodeTimer > 0 && p.explodeTimer < 80) { ctx.fillStyle = '#FF8C00'; ctx.beginPath(); ctx.arc(0, -15, 2 + Math.random() * 3, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'bomb':
      ctx.rotate(p.age * 0.07);
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(9, -24, 4, -33); ctx.stroke();
      ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(4, -33, 3 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bazooka':
      ctx.rotate(ang);
      ctx.fillStyle = '#8B6914'; ctx.fillRect(-18, -5, 37, 10);
      ctx.fillStyle = '#CC4400'; ctx.beginPath(); ctx.moveTo(19, -5); ctx.lineTo(33, 0); ctx.lineTo(19, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#666'; ctx.fillRect(-18, -12, 11, 7); ctx.fillRect(-18, 5, 11, 7);
      ctx.fillStyle = '#FF6600'; ctx.beginPath(); ctx.arc(-22, 0, 5 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
      break;
    case 'laser':
      ctx.rotate(ang);
      ctx.fillStyle = '#FF0000';
      ctx.shadowBlur = 10; ctx.shadowColor = '#FF0000';
      ctx.fillRect(-20, -2, 40, 4);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-15, -1, 30, 2);
      ctx.shadowBlur = 0;
      break;
  }
  ctx.restore();
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, vx: number, vy: number,
  weapon: WeaponKey, wind: number, frame: number,
) {
  const g = WEAPON_GRAVITY[weapon];
  ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,180,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx, sy);
  let px = sx, py = sy, pvx = vx, pvy = vy;
  for (let s = 0; s < 130; s++) {
    pvx += wind * 0.01; pvy += g; px += pvx; py += pvy;
    if (py > CH + 60 || px < -60 || px > CW + 60) break;
    if (s % 3 === 0) ctx.lineTo(px, py);
    // Animated dot
    if ((s - (frame % 12)) % 12 === 0) {
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(px, py);
    }
  }
  ctx.stroke(); ctx.setLineDash([]);
}

function drawExplosion(ctx: CanvasRenderingContext2D, e: Explosion) {
  const prog = e.frame / e.maxFrame;
  const r = e.radius * prog;
  ctx.save(); ctx.globalAlpha = 1 - prog;
  const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
  grad.addColorStop(0,   `rgba(255,255,0,${1 - prog})`);
  grad.addColorStop(0.45, `rgba(255,100,0,${(1 - prog) * 0.8})`);
  grad.addColorStop(1,   'rgba(255,0,0,0)');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#FF8C00'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.stroke();
  if (prog < 0.5) {
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + e.frame * 0.12;
      ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * r * 1.18, e.y + Math.sin(a) * r * 1.18, 3 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawConfetti(ctx: CanvasRenderingContext2D, confetti: Confetti[]) {
  for (const c of confetti) {
    ctx.save(); ctx.globalAlpha = Math.min(1, c.life / 28);
    ctx.translate(c.x, c.y); ctx.rotate(c.rot);
    ctx.fillStyle = c.color; ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
    ctx.restore();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, g: G, _frame: number) {
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.68)'; ctx.fillRect(0, 0, CW, 58);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 25px Arial'; ctx.fillText("🎯 Trump's Bad Day", 18, 36);
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 20px Arial'; ctx.fillText(`Score: ${g.score}`, 370, 36);
  if (g.combo > 1) { ctx.fillStyle = '#FF6600'; ctx.font = `bold ${18 + g.combo}px Arial`; ctx.fillText(`x${g.combo} COMBO!`, 530, 36); }
  // Lives
  for (let i = 0; i < 3; i++) {
    ctx.font = '20px Arial'; ctx.fillStyle = i < g.misses ? '#444' : '#FF4444';
    ctx.fillText(i < g.misses ? '🖤' : '❤️', 745 + i * 32, 36);
  }
  // Wind
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Arial'; ctx.fillText('WIND:', 872, 32);
  const ws = Math.abs(g.wind); const wa = g.wind > 0 ? '→' : g.wind < 0 ? '←' : '·';
  ctx.fillStyle = ws > 3.5 ? '#FF4444' : ws > 1.8 ? '#FFA500' : '#00FF88';
  ctx.font = `bold ${13 + ws | 0}px Arial`; ctx.fillText(`${wa} ${ws.toFixed(1)}`, 928, 32);
  ctx.fillStyle = '#FFD700'; ctx.font = '14px Arial'; ctx.fillText(`Best: ${g.highScore}`, CW - 148, 36);

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.68)'; ctx.fillRect(0, CH - 58, CW, 58);
  WEAPONS.forEach((w, i) => {
    const wx = 28 + i * 78;
    if (g.weapon === w.key) {
      ctx.fillStyle = 'rgba(255,200,0,0.28)'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
      ctx.beginPath(); (ctx as any).roundRect(wx - 4, CH - 54, 68, 48, 6); ctx.fill(); ctx.stroke();
    }
    ctx.font = '26px Arial'; ctx.fillText(w.icon, wx + 11, CH - 18);
    ctx.fillStyle = g.weapon === w.key ? '#FFD700' : '#AAA'; ctx.font = '11px Arial'; ctx.fillText(w.label, wx + 4, CH - 3);
    ctx.fillStyle = '#777'; ctx.font = '10px Arial'; ctx.fillText(`[${i + 1}]`, wx + 4, CH - 50);
  });
  ctx.fillStyle = '#AAA'; ctx.font = '13px Arial'; ctx.textAlign = 'center';
  ctx.fillText('← Drag & Release to fire', CW / 2 + 200, CH - 20); ctx.textAlign = 'left';

  // Shooter phrase
  if (g.spTimer > 0 && g.spPhrase) {
    ctx.globalAlpha = Math.min(1, g.spTimer / 14);
    ctx.fillStyle = '#88FF88'; ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center';
    ctx.fillText(g.spPhrase, 110, CH - 72);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }
}

function drawGameOver(ctx: CanvasRenderingContext2D, g: G) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, CW, CH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 72px Arial'; ctx.fillText('GAME OVER!', CW / 2, CH / 2 - 90);
  if (g.isNewHighScore) { ctx.fillStyle = '#FF6600'; ctx.font = 'bold 38px Arial'; ctx.fillText('🏆 NEW HIGH SCORE! 🏆', CW / 2, CH / 2 - 28); }
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 46px Arial'; ctx.fillText(`Final Score: ${g.score}`, CW / 2, CH / 2 + 42);
  ctx.fillStyle = '#AAA'; ctx.font = '26px Arial'; ctx.fillText('Press R  or tap  Play Again', CW / 2, CH / 2 + 100);
  ctx.textAlign = 'left';
}

function spawnConfetti(cx: number, cy: number): Confetti[] {
  const cols = ['#FFD700','#FF4444','#00BB44','#4488FF','#FF88CC','#FFFFFF','#FF8800'];
  return Array.from({ length: 60 }, () => ({
    x: cx, y: cy,
    vx: rand(-7, 7), vy: rand(-10, -2),
    color: pick(cols), size: rand(6, 14),
    rot: rand(0, Math.PI * 2), rotV: rand(-0.25, 0.25),
    life: rand(80, 140),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TrumpsBadDay() {
  const navigate = useNavigate();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gRef       = useRef<G | null>(null);
  const rafRef     = useRef<number>(0);
  const frameRef   = useRef(0);
  const [phase,         setPhase]         = useState<'playing' | 'gameover'>('playing');
  const [uiScore,       setUiScore]       = useState(0);
  const [_uiHighScore,  setUiHighScore]   = useState(0);
  const [_isNewHS,      setIsNewHS]       = useState(false);
  const [bgLabel,       setBgLabel]       = useState(BACKGROUNDS[0].label);
  const [leaderboard,   setLeaderboard]   = useState<{ score: number; created_at: string }[]>([]);
  const [showLB,        setShowLB]        = useState(false);

  // ── Scale canvas coords
  const toCanvas = useCallback((cx: number, cy: number) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: (cx - r.left) * (CW / r.width), y: (cy - r.top) * (CH / r.height) };
  }, []);

  // ── Catapult launch pos
  const catPos = (heights: Float32Array) => {
    const th = heights[CATAPULT_X] ?? 120;
    return { x: CATAPULT_X, y: (CH - 80) - th - 62 };
  };

  // ── Init a fresh game state
  const makeGame = useCallback((): G => {
    const heights = genTerrain();
    const base = CH - 80;
    const tX0 = 1060;
    return {
      score: 0, combo: 0, misses: 0, hits: 0,
      wind: rand(-5, 5),
      bgIndex: 0, weapon: 'rock',
      highScore: gRef.current?.highScore ?? 0,
      isNewHighScore: false,
      phase: 'playing',
      tx: tX0, ty: base - (heights[tX0] ?? 120) - 200, tw: 100, th: 200,
      tHit: false, tHitF: 0, tHairOff: false,
      tDancing: false, tDanceF: 0,
      tPhrase: '', tPhraseT: 0,
      tVelX: 0, tVelY: 0,
      jailing: false,
      tJumping: false,
      tApproach: true,
      spPhrase: '', spTimer: 0,
      projectiles: [], explosions: [], confetti: [],
      particles: [],
      heights,
      drag: false, dragEnd: { x: CATAPULT_X, y: 400 },
      shake: 0,
    };
  }, []);

  // ── Save score
  const saveScore = useCallback(async (g: G) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await (supabase as any).from('trump_game_scores').insert({
        user_id: session.user.id, score: g.score, combo: g.combo,
        weapon_used: g.weapon, background: BACKGROUNDS[g.bgIndex].key,
      });
    } catch { /* ignore */ }
  }, []);

  // ── Fetch leaderboard
  const fetchLB = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from('trump_game_scores').select('score, created_at')
        .order('score', { ascending: false }).limit(5);
      if (data) setLeaderboard(data as any);
    } catch { /* ignore */ }
  }, []);

  // ── Lock landscape orientation when component mounts
  useEffect(() => {
    lockOrientation();
    return () => unlockOrientation();
  }, []);

  // ── Main game loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    gRef.current = makeGame();

    const onHit = (g: G, hx: number, hy: number) => {
      if (g.tHit) return;
      g.tHit = true; g.tHitF = 0; g.tHairOff = false;
      g.combo++; g.hits++;
      g.score += 100 * g.combo;
      g.misses = 0;
      g.shake = 15;
      g.tPhrase = pick(HIT_PHRASES); g.tPhraseT = 90;
      beep(400, 0.15);
      if (g.combo >= 3) g.confetti.push(...spawnConfetti(hx, hy));
      if (g.score > g.highScore) {
        g.highScore = g.score; g.isNewHighScore = true;
        if (g.confetti.length < 100) g.confetti.push(...spawnConfetti(CW / 2, CH / 2));
      }
      setTimeout(() => {
        if (!gRef.current) return;
        const ng = gRef.current;
        ng.tx = rand(940, 1160); ng.ty = terrainY(ng.heights, ng.tx + ng.tw / 2) - ng.th;
      }, 1600);
      setUiScore(g.score); setUiHighScore(g.highScore);
    };

    const onMiss = (g: G) => {
      g.combo = 0; g.misses++;
      g.tDancing = true; g.tDanceF = 0;
      g.tPhrase = pick(MISS_PHRASES); g.tPhraseT = 110;
      g.wind = rand(-5, 5);
      beep(350, 0.4, 'sawtooth', 0.18);
      if (g.misses >= 3) {
        g.phase = 'gameover';
        saveScore(g);
        setPhase('gameover'); setUiScore(g.score); setUiHighScore(g.highScore); setIsNewHS(g.isNewHighScore);
      }
    };

    const loop = () => {
      const g = gRef.current!;
      frameRef.current++;
      const F = frameRef.current;

      if (g.phase === 'gameover') {
        ctx.clearRect(0, 0, CW, CH);
        drawBg(ctx, BACKGROUNDS[g.bgIndex].key);
        drawSLogo(ctx);
        // Particles Drawing
      g.particles.forEach(p => {
        ctx.save();
        const alpha = 1 - (p.age / 40);
        if (p.type === 'dust') {
          ctx.fillStyle = `rgba(180, 180, 180, ${alpha * 0.5})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'spark') {
          ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
          ctx.shadowBlur = 10; ctx.shadowColor = 'orange';
          ctx.fillRect(p.x, p.y, p.r, p.r);
        } else if (p.type === 'laser') {
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y); ctx.stroke();
        }
        ctx.restore();
      });

      drawCatapult(ctx, g.heights, g.drag, g.dragEnd.x, g.dragEnd.y);
      drawTrump(ctx, g, F);
        drawConfetti(ctx, g.confetti);
        g.confetti = g.confetti.map(c => ({ ...c, x: c.x + c.vx, y: c.y + c.vy, vy: c.vy + 0.22, life: c.life - 1 })).filter(c => c.life > 0 && c.y < CH);
        drawGameOver(ctx, g);
        rafRef.current = requestAnimationFrame(loop); return;
      }

      // Wind cycle
      if (F % 310 === 0) g.wind = rand(-5, 5);

      // Screen Shake & Context setup
      if (g.shake > 0) {
        ctx.save();
        const sx = (Math.random() - 0.5) * g.shake;
        const sy = (Math.random() - 0.5) * g.shake;
        ctx.translate(sx, sy);
        g.shake *= 0.92;
        if (g.shake < 0.5) g.shake = 0;
      }

      // Trump
      if (g.tHit) {
        g.tHitF++;
        if (g.tHitF === 9) g.tHairOff = true;
        if (g.tHitF > 42) { g.tHit = false; g.tHitF = 0; g.tHairOff = false; }
      }
      if (g.tPhraseT > 0) g.tPhraseT--;
      if (g.tDancing) { g.tDanceF++; if (g.tDanceF > 85) { g.tDancing = false; g.tDanceF = 0; } }
      if (g.spTimer > 0) g.spTimer--;

      // Speed ramp & Approaching logic
      const lvl = Math.floor(g.hits / 5);
      const approachSpeed = 0.5; // Base speed
      const speedRamp = Math.min(lvl * 0.3, 3); // Speed increase based on level
      if (g.tApproach) {
        g.tVelX = approachSpeed * (1 + speedRamp);
        // Modern Platformer AI: Jump randomly or when feeling aggressive
        if (Math.random() < 0.015 && g.ty >= 440) {
          g.tVelY = -24;
          g.tPhrase = "I JUMP HIGH!"; g.tPhraseT = 80;
          // Spawn Dust Particles
          for(let i=0; i<6; i++) g.particles.push({ x: g.tx+g.tw/2, y: g.ty+g.th, r: 4+Math.random()*4, vx: (Math.random()-0.5)*6, vy: -Math.random()*3, age: 0, type: 'dust' });
        }
      } else {
        g.tVelX *= 0.85;
      }
      g.tx += g.tVelX;
      g.ty += g.tVelY;
      
      // Gravity & Ground Logic
      if (g.ty < 440) {
        g.tVelY += 1.2; // Gravity
        g.tJumping = true;
      } else {
        g.ty = 440; g.tVelY = 0;
        if (g.tJumping) {
            g.tJumping = false;
            // Land Particles
            for(let i=0; i<8; i++) g.particles.push({ x: g.tx+g.tw/2, y: g.ty+g.th, r: 5+Math.random()*5, vx: (Math.random()-0.5)*12, vy: -Math.random()*4, age: 0, type: 'dust' });
        }
      }

      // Update Particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.age++;
        return p.age < 40;
      });

      // Hit Logic & Jailing
      if (g.tHit) {
        g.tHitF++;
        if (g.tHitF > 60) { g.tHit = false; g.tHitF = 0; }
      }
      if (g.tx < 180 && !g.jailing) { // Trump reaches the catapult
        g.jailing = true; // Set jailing state
        g.tPhrase = "GOT YOU! TO JAIL!"; g.tPhraseT = 200;
        g.shake = 35; // Jailing Screen Shake
        g.phase = 'gameover'; // Set game over phase
        saveScore(g); // Save score
        setTimeout(() => {
          setPhase('gameover'); setUiScore(g.score); setUiHighScore(g.highScore); setIsNewHS(g.isNewHighScore);
        }, 1500);
      }

      // Projectiles
      for (const p of g.projectiles) {
        if (!p.active) continue;
        p.age++;
        p.vx += g.wind * 0.01;
        p.vy += WEAPON_GRAVITY[p.weapon];
        p.x += p.vx; p.y += p.vy;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 22) p.trail.shift();

        if (p.weapon === 'bazooka') {
          p.smoke.push({ x: p.x - p.vx * 2, y: p.y - p.vy * 2, a: 0.55 });
          p.smoke = p.smoke.map(s => ({ ...s, a: s.a - 0.035 })).filter(s => s.a > 0);
          if (p.smoke.length > 18) p.smoke.shift();
        }

        // Grenade timer
        if (p.weapon === 'grenade') {
          p.explodeTimer--;
          if (p.explodeTimer <= 0) {
            g.explosions.push({ x: p.x, y: p.y, radius: 85, frame: 0, maxFrame: 32, big: false });
            craterTerrain(g.heights, p.x, p.y, 62);
            boom();
            const dx = p.x - (g.tx + g.tw / 2), dy = p.y - (g.ty + g.th / 2);
            if (Math.sqrt(dx * dx + dy * dy) < 125) onHit(g, p.x, p.y);
            p.active = false; continue;
          }
        }

        // Terrain hit
        const tY = terrainY(g.heights, p.x);
        const r = WEAPON_RADIUS[p.weapon];
        if (p.y + r >= tY) {
          const bo = WEAPON_BOUNCE[p.weapon];
          if (bo > 0.1 && p.bounces < 4 && Math.abs(p.vy) > 2.5) {
            p.y = tY - r; p.vy = -p.vy * bo; p.vx *= 0.8; p.bounces++;
          } else {
            if (p.weapon === 'bomb') {
              g.explosions.push({ x: p.x, y: tY, radius: 128, frame: 0, maxFrame: 38, big: true });
              craterTerrain(g.heights, p.x, tY, 105);
              boom();
              const dx = p.x - (g.tx + g.tw / 2), dy = tY - (g.ty + g.th / 2);
              if (Math.sqrt(dx * dx + dy * dy) < 170) onHit(g, p.x, tY);
            } else if (p.weapon === 'laser') {
              g.explosions.push({ x: p.x, y: tY, radius: 15, frame: 0, maxFrame: 10, big: false });
            } else {
              g.explosions.push({ x: p.x, y: tY, radius: 28, frame: 0, maxFrame: 18, big: false });
            }
            p.active = false;
            if (!g.projectiles.some(q => q.active)) onMiss(g);
          }
        }

        // Off-screen miss
        if (p.x > CW + 120 || p.y > CH + 120 || p.x < -120) {
          p.active = false;
          if (!g.projectiles.some(q => q.active)) onMiss(g);
        }

        // Trump hit (AABB)
        if (p.x + r > g.tx && p.x - r < g.tx + g.tw && p.y + r > g.ty && p.y - r < g.ty + g.th) {
          onHit(g, p.x, p.y);
          p.active = false;
          if (p.weapon === 'bomb' || p.weapon === 'bazooka') {
            g.explosions.push({ x: p.x, y: p.y, radius: p.weapon === 'bomb' ? 125 : 62, frame: 0, maxFrame: p.weapon === 'bomb' ? 38 : 26, big: p.weapon === 'bomb' });
            boom();
          } else if (p.weapon === 'laser') {
            g.explosions.push({ x: p.x, y: p.y, radius: 20, frame: 0, maxFrame: 12, big: false });
          }
        }
      }
      g.projectiles = g.projectiles.filter(p => p.active || p.age < 6);
      g.explosions = g.explosions.filter(e => { e.frame++; return e.frame < e.maxFrame; });
      g.confetti = g.confetti.map(c => ({ ...c, x: c.x + c.vx, y: c.y + c.vy, vy: c.vy + 0.22, vx: c.vx * 0.99, rot: c.rot + c.rotV, life: c.life - 1 })).filter(c => c.life > 0 && c.y < CH);

      // Draw
      ctx.clearRect(0, 0, CW, CH);
      drawBg(ctx, BACKGROUNDS[g.bgIndex].key);
      drawSLogo(ctx);
      drawTerrain(ctx, g.heights);
      drawCatapult(ctx, g.heights, g.drag, g.dragEnd.x, g.dragEnd.y);

      if (g.drag) {
        const cp = catPos(g.heights);
        const dx = cp.x - g.dragEnd.x, dy = cp.y - g.dragEnd.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const spd = Math.min(dist / 15, 25) * WEAPON_SPEED[g.weapon];
        const ang = Math.atan2(dy, dx);
        drawTrajectory(ctx, cp.x, cp.y, Math.cos(ang) * spd, Math.sin(ang) * spd, g.weapon, g.wind, F);
      }

      drawTrump(ctx, g, F);
      for (const p of g.projectiles) drawProjectile(ctx, p);
      for (const e of g.explosions)  drawExplosion(ctx, e);
      // Particles Drawing
      g.particles.forEach(p => {
        ctx.save();
        const alpha = 1 - (p.age / 40);
        if (p.type === 'dust') {
          ctx.fillStyle = `rgba(180, 180, 180, ${alpha * 0.5})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'spark') {
          ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
          ctx.shadowBlur = 10; ctx.shadowColor = 'orange';
          ctx.fillRect(p.x, p.y, p.r, p.r);
        } else if (p.type === 'laser') {
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y); ctx.stroke();
        }
        ctx.restore();
      });
      drawConfetti(ctx, g.confetti);
      drawHUD(ctx, g, F);

      if (g.shake > 0) ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [makeGame, saveScore]);

  // ── Input handlers
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) { const t = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0]; return toCanvas(t.clientX, t.clientY); }
      return toCanvas((e as MouseEvent).clientX, (e as MouseEvent).clientY);
    };

    const onStart = (e: Event) => {
      e.preventDefault();
      const g = gRef.current; if (!g || g.phase === 'gameover') return;
      if (g.projectiles.some(p => p.active)) return;
      const pos = getPos(e as MouseEvent | TouchEvent);
      if (pos.x < 340 && pos.y > CH * 0.28) { g.drag = true; g.dragEnd = pos; }
    };
    const onMove = (e: Event) => {
      e.preventDefault();
      const g = gRef.current; if (!g || !g.drag) return;
      g.dragEnd = getPos(e as MouseEvent | TouchEvent);
    };
    const onEnd = (e: Event) => {
      e.preventDefault();
      const g = gRef.current; if (!g || !g.drag) return;
      g.drag = false;
      const cp = catPos(g.heights);
      const dx = cp.x - g.dragEnd.x, dy = cp.y - g.dragEnd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const spd = Math.min(dist / 15, 25) * WEAPON_SPEED[g.weapon];
      if (spd < 1) return;
      const ang = Math.atan2(dy, dx);
      g.projectiles.push({
        x: cp.x, y: cp.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        weapon: g.weapon, active: true, bounces: 0, age: 0,
        explodeTimer: g.weapon === 'grenade' ? 120 : 0,
        trail: [], smoke: [],
      });
      g.spPhrase = pick(SHOOT_PHRASES); g.spTimer = 65;
      beep(200, 0.12, 'sine', 0.18);
    };

    const onKey = (e: KeyboardEvent) => {
      const g = gRef.current; if (!g) return;
      const wmap: Record<string, WeaponKey> = { '1': 'rock', '2': 'arrow', '3': 'grenade', '4': 'bomb', '5': 'bazooka' };
      if (wmap[e.key]) { g.weapon = wmap[e.key]; }
      if ((e.key === 'r' || e.key === 'R') && g.phase === 'gameover') {
        const hs = g.highScore; gRef.current = makeGame(); gRef.current.highScore = hs;
        setPhase('playing'); setUiScore(0); setIsNewHS(false);
      }
    };

    canvas.addEventListener('mousedown',  onStart);
    canvas.addEventListener('mousemove',  onMove);
    canvas.addEventListener('mouseup',    onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove',  onMove,  { passive: false });
    canvas.addEventListener('touchend',   onEnd,   { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      canvas.removeEventListener('mousedown',  onStart);
      canvas.removeEventListener('mousemove',  onMove);
      canvas.removeEventListener('mouseup',    onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [toCanvas, makeGame]);

  const handleBg = () => {
    const g = gRef.current; if (!g) return;
    g.bgIndex = (g.bgIndex + 1) % BACKGROUNDS.length;
    setBgLabel(BACKGROUNDS[g.bgIndex].label);
  };

  const handleRestart = () => {
    const hs = gRef.current?.highScore ?? 0;
    gRef.current = makeGame(); gRef.current.highScore = hs;
    setPhase('playing'); setUiScore(0); setIsNewHS(false);
  };

  const handleShare = () => {
    const txt = `I caused ${uiScore} accidents to Trump today! Play Trump's Bad Day on Swipess! 🎯🇲🇽`;
    navigator.clipboard?.writeText(txt).catch(() => {});
    alert('Copied to clipboard! Share it! 📤');
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-3 left-3 z-20 flex items-center gap-1.5 text-white bg-black/55 rounded-full px-3 py-1.5 hover:bg-black/75 text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Scene */}
      <button
        onClick={handleBg}
        className="absolute top-3 right-32 z-20 text-white bg-black/55 rounded-full px-3 py-1.5 hover:bg-black/75 text-xs transition-colors"
      >
        🌍 {bgLabel}
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="absolute top-3 right-3 z-20 flex items-center gap-1.5 text-white bg-black/55 rounded-full px-3 py-1.5 hover:bg-black/75 text-sm transition-colors"
      >
        <Share2 size={14} /> Share
      </button>

      {/* Leaderboard */}
      <button
        onClick={() => { setShowLB(v => !v); if (!showLB) fetchLB(); }}
        className="absolute top-12 right-3 z-20 text-white bg-black/55 rounded-full px-3 py-1.5 hover:bg-black/75 text-xs transition-colors"
      >
        🏆 Scores
      </button>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CW} height={CH}
        className="max-w-full max-h-full"
        style={{ aspectRatio: '16/9', cursor: 'crosshair', touchAction: 'none' }}
      />

      {/* Game over React overlay buttons */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 flex items-end justify-center z-10 pb-24 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3 items-center">
            <button
              onClick={handleRestart}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-12 py-3 rounded-full text-xl transition-colors shadow-lg"
            >
              🔄 Play Again
            </button>
            <button
              onClick={handleShare}
              className="bg-white/18 hover:bg-white/30 text-white px-8 py-2 rounded-full text-sm transition-colors"
            >
              📤 Share Score: {uiScore.toLocaleString()}
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard panel */}
      {showLB && (
        <div className="absolute top-20 right-3 z-30 bg-black/88 text-white rounded-xl p-4 w-60 shadow-2xl border border-yellow-500/30">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-yellow-400 text-sm">🏆 Top Scores</span>
            <button onClick={() => setShowLB(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
          </div>
          {leaderboard.length === 0
            ? <p className="text-gray-400 text-xs">No scores yet — be first!</p>
            : leaderboard.map((e, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-white/10 text-xs">
                  <span className="text-gray-400">#{i + 1}</span>
                  <span className="font-bold">{e.score.toLocaleString()}</span>
                  <span className="text-gray-500">{new Date(e.created_at).toLocaleDateString()}</span>
                </div>
              ))
          }
        </div>
      )}

      {/* Orientation Overlay for Phones */}
      <div className="portrait:flex hidden fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-8 relative">
           <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full animate-pulse" />
           <div className="w-full h-full border-2 border-white/20 rounded-2xl flex items-center justify-center animate-[spin_3s_linear_infinite]">
              <div className="w-16 h-8 border-2 border-white/60 rounded-lg" />
           </div>
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-2">Rotate Your Phone</h2>
        <p className="text-sm text-white/50 font-bold uppercase tracking-widest">Landscape mode required for maximum speed</p>
      </div>
    </div>
  );
}
