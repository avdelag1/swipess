/** Profile-page gradient palette — matches ClientProfile action buttons */
export const PASSPORT_GRADIENTS = {
  passport: 'linear-gradient(135deg, #6366F1, #A855F7)',
  roommates: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
  seekers: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  tokens: 'linear-gradient(135deg, #10B981, #06B6D4)',
  premium: 'linear-gradient(135deg, #F59E0B, #D97706)',
  listings: 'linear-gradient(135deg, #EC4899, #F43F5E)',
  people: 'linear-gradient(135deg, #3B82F6, #6366F1)',
  all: 'linear-gradient(135deg, #6366F1, #A855F7)',
} as const;

export const RADIUS_GRADIENTS: Record<number, string> = {
  5: 'linear-gradient(135deg, #10B981, #06B6D4)',
  20: 'linear-gradient(135deg, #6366F1, #A855F7)',
  40: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  80: 'linear-gradient(135deg, #F59E0B, #D97706)',
};

export function gradientForRadius(km: number): string {
  if (km <= 12) return RADIUS_GRADIENTS[5];
  if (km <= 30) return RADIUS_GRADIENTS[20];
  if (km <= 55) return RADIUS_GRADIENTS[40];
  return RADIUS_GRADIENTS[80];
}