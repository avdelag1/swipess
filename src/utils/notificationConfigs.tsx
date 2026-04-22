import { ThumbsUp, Star, MessageCircle, UserPlus, Zap, Crown } from 'lucide-react';

export const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M3 5h4"/><path d="M21 17v4"/><path d="M19 19h4"/>
  </svg>
);

export const notificationTypeConfigs: Record<string, { icon: any; bg: string; accentColor: string; label: string }> = {
  like: {
    icon: ThumbsUp,
    bg: 'rgba(244, 63, 94, 0.1)',
    accentColor: '#f43f5e',
    label: 'Like'
  },
  super_like: {
    icon: Star,
    bg: 'rgba(245, 158, 11, 0.15)',
    accentColor: '#f59e0b',
    label: 'Super Like'
  },
  message: {
    icon: MessageCircle,
    bg: 'rgba(59, 130, 246, 0.12)',
    accentColor: '#3b82f6',
    label: 'Message'
  },
  match: {
    icon: SparklesIcon,
    bg: 'rgba(168, 85, 247, 0.15)',
    accentColor: '#a855f7',
    label: 'Match'
  },
  new_user: {
    icon: UserPlus,
    bg: 'rgba(16, 185, 129, 0.12)',
    accentColor: '#10b981',
    label: 'New User'
  },
  premium_purchase: {
    icon: Crown,
    bg: 'rgba(139, 92, 246, 0.15)',
    accentColor: '#8b5cf6',
    label: 'Premium'
  },
  activation_purchase: {
    icon: Zap,
    bg: 'rgba(249, 115, 22, 0.12)',
    accentColor: '#f97316',
    label: 'Activation'
  },
};


