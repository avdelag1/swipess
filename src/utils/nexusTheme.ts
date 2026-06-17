/** Nexus design tokens — rose / violet / indigo (LegalHub + profile hub palette). */
export const NEXUS = {
  rose: '#EB4898',
  violet: '#8B5CF6',
  indigo: '#6366F1',
  cyan: '#06B6D4',
  shell: '#0a0a0b',
  glass: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
} as const;

export const NEXUS_GRADIENTS = {
  /** Magic AI / wizard primary — cyan → indigo → violet */
  ai: 'linear-gradient(135deg, #06B6D4 0%, #6366F1 55%, #8B5CF6 100%)',
  /** Client CTAs — rose → violet */
  cta: 'linear-gradient(135deg, #EB4898 0%, #8B5CF6 100%)',
  /** Profile hub tiles — orange → rose (kept — user likes these) */
  warm: 'linear-gradient(135deg, #FF4D00 0%, #EB4898 100%)',
  /** Owner / legal accent */
  owner: 'linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)',
} as const;

export const nexusGlassCard =
  'rounded-[2rem] border border-white/[0.06] bg-white/[0.04] backdrop-blur-[32px] saturate-[1.8]';

export const nexusSectionLabel =
  'text-[10px] font-black uppercase tracking-[0.28em] text-[#8B5CF6]';