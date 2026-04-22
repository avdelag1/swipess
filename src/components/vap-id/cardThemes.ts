export interface CardTheme {
  name: string;
  background: string;
  pattern: string;
  patternOpacity: number;
  accentBar: string;
  accentColor: string;
  badgeColor: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  langTagBg: string;
  langTagBorder: string;
  langTagText: string;
  qrBg: string;
  isDark: boolean;
}

export const CARD_THEMES: CardTheme[] = [
  {
    name: 'Obsidian',
    background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 40%, #111111 100%)',
    pattern: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)',
    patternOpacity: 0.5,
    accentBar: 'linear-gradient(90deg, #666, #999, #666)',
    accentColor: '#a0a0a0',
    badgeColor: '#c0c0c0',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textTertiary: 'rgba(255,255,255,0.4)',
    tagBg: 'rgba(255,255,255,0.06)',
    tagBorder: 'rgba(255,255,255,0.08)',
    tagText: 'rgba(255,255,255,0.6)',
    langTagBg: 'rgba(160,160,160,0.12)',
    langTagBorder: 'rgba(160,160,160,0.2)',
    langTagText: 'rgba(200,200,200,0.8)',
    qrBg: '#ffffff',
    isDark: true,
  },
  {
    name: 'Pearl',
    background: 'linear-gradient(145deg, #fafaf9 0%, #f5f5f4 40%, #e7e5e4 100%)',
    pattern: '',
    patternOpacity: 0,
    accentBar: 'linear-gradient(90deg, #d4d4d4, #a3a3a3, #d4d4d4)',
    accentColor: '#525252',
    badgeColor: '#404040',
    textPrimary: '#1a1a1a',
    textSecondary: 'rgba(0,0,0,0.6)',
    textTertiary: 'rgba(0,0,0,0.35)',
    tagBg: 'rgba(0,0,0,0.04)',
    tagBorder: 'rgba(0,0,0,0.08)',
    tagText: 'rgba(0,0,0,0.55)',
    langTagBg: 'rgba(0,0,0,0.05)',
    langTagBorder: 'rgba(0,0,0,0.1)',
    langTagText: 'rgba(0,0,0,0.6)',
    qrBg: '#ffffff',
    isDark: false,
  },
  {
    name: 'Rosa Mexicano',
    background: 'linear-gradient(145deg, #c2185b 0%, #e91e63 40%, #ad1457 100%)',
    pattern: `radial-gradient(ellipse 14px 12px at 20px 20px, rgba(0,0,0,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 10px 8px at 50px 15px, rgba(0,0,0,0.1) 0%, transparent 70%),
      radial-gradient(ellipse 12px 10px at 35px 45px, rgba(0,0,0,0.11) 0%, transparent 70%),
      radial-gradient(ellipse 8px 6px at 70px 40px, rgba(0,0,0,0.09) 0%, transparent 70%),
      radial-gradient(ellipse 11px 9px at 10px 60px, rgba(0,0,0,0.1) 0%, transparent 70%),
      radial-gradient(ellipse 9px 7px at 60px 65px, rgba(0,0,0,0.08) 0%, transparent 70%)`,
    patternOpacity: 0.6,
    accentBar: 'linear-gradient(90deg, #f8bbd0, #fce4ec, #f8bbd0)',
    accentColor: '#fce4ec',
    badgeColor: '#fff0f5',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.85)',
    textTertiary: 'rgba(255,255,255,0.55)',
    tagBg: 'rgba(255,255,255,0.12)',
    tagBorder: 'rgba(255,255,255,0.15)',
    tagText: 'rgba(255,255,255,0.8)',
    langTagBg: 'rgba(255,224,238,0.15)',
    langTagBorder: 'rgba(255,224,238,0.25)',
    langTagText: 'rgba(255,240,245,0.9)',
    qrBg: '#ffffff',
    isDark: true,
  },
  {
    name: 'Jungle',
    background: 'linear-gradient(145deg, #1b3a2d 0%, #2d5a3f 40%, #1a4030 100%)',
    pattern: `radial-gradient(ellipse 60px 8px at 20% 30%, rgba(255,255,255,0.04) 0%, transparent 100%),
      radial-gradient(ellipse 80px 6px at 70% 60%, rgba(255,255,255,0.03) 0%, transparent 100%),
      radial-gradient(ellipse 50px 10px at 40% 80%, rgba(255,255,255,0.04) 0%, transparent 100%),
      radial-gradient(ellipse 70px 5px at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 100%)`,
    patternOpacity: 0.7,
    accentBar: 'linear-gradient(90deg, #4caf50, #81c784, #4caf50)',
    accentColor: '#81c784',
    badgeColor: '#a5d6a7',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.75)',
    textTertiary: 'rgba(255,255,255,0.45)',
    tagBg: 'rgba(255,255,255,0.07)',
    tagBorder: 'rgba(255,255,255,0.1)',
    tagText: 'rgba(255,255,255,0.65)',
    langTagBg: 'rgba(129,199,132,0.12)',
    langTagBorder: 'rgba(129,199,132,0.2)',
    langTagText: 'rgba(165,214,167,0.9)',
    qrBg: '#ffffff',
    isDark: true,
  },
  {
    name: 'Sahara',
    background: 'linear-gradient(145deg, #5d4037 0%, #8d6e63 40%, #6d4c41 100%)',
    pattern: `repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 12px),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 16px)`,
    patternOpacity: 0.8,
    accentBar: 'linear-gradient(90deg, #d7a86e, #f4c584, #d7a86e)',
    accentColor: '#f4c584',
    badgeColor: '#ffe0b2',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.8)',
    textTertiary: 'rgba(255,255,255,0.5)',
    tagBg: 'rgba(255,255,255,0.08)',
    tagBorder: 'rgba(255,255,255,0.12)',
    tagText: 'rgba(255,255,255,0.7)',
    langTagBg: 'rgba(244,197,132,0.15)',
    langTagBorder: 'rgba(244,197,132,0.25)',
    langTagText: 'rgba(255,224,178,0.9)',
    qrBg: '#ffffff',
    isDark: true,
  },
];


