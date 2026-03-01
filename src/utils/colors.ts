/**
 * Theme-Aware Semantic Color Utilities
 * Provides consistent, theme-safe colors for common UI patterns
 */

export type SemanticColorType = 'success' | 'warning' | 'error' | 'info';
export type ColorVariant = 'bg' | 'text' | 'border' | 'bgLight';

/**
 * Get semantic color classes for a given type and theme
 * @param type - The semantic color type (success, warning, error, info)
 * @param variant - The CSS type (bg, text, border, bgLight)
 * @param isDarkTheme - Whether we're in dark mode
 * @returns The Tailwind color class
 */
export function getSemanticColor(
  type: SemanticColorType,
  variant: ColorVariant = 'bg',
  isDarkTheme: boolean = true
): string {
  const colors: Record<SemanticColorType, Record<ColorVariant, Record<'dark' | 'light', string>>> = {
    success: {
      bg: {
        dark: 'bg-emerald-600',
        light: 'bg-emerald-500',
      },
      bgLight: {
        dark: 'bg-emerald-500/20',
        light: 'bg-emerald-50',
      },
      text: {
        dark: 'text-emerald-400',
        light: 'text-emerald-600',
      },
      border: {
        dark: 'border-emerald-500/40',
        light: 'border-emerald-300',
      },
    },
    warning: {
      bg: {
        dark: 'bg-amber-600',
        light: 'bg-amber-500',
      },
      bgLight: {
        dark: 'bg-amber-500/20',
        light: 'bg-amber-50',
      },
      text: {
        dark: 'text-amber-400',
        light: 'text-amber-600',
      },
      border: {
        dark: 'border-amber-500/40',
        light: 'border-amber-300',
      },
    },
    error: {
      bg: {
        dark: 'bg-red-600',
        light: 'bg-red-500',
      },
      bgLight: {
        dark: 'bg-red-500/20',
        light: 'bg-red-50',
      },
      text: {
        dark: 'text-red-400',
        light: 'text-red-600',
      },
      border: {
        dark: 'border-red-500/40',
        light: 'border-red-300',
      },
    },
    info: {
      bg: {
        dark: 'bg-blue-600',
        light: 'bg-blue-500',
      },
      bgLight: {
        dark: 'bg-blue-500/20',
        light: 'bg-blue-50',
      },
      text: {
        dark: 'text-blue-400',
        light: 'text-blue-600',
      },
      border: {
        dark: 'border-blue-500/40',
        light: 'border-blue-300',
      },
    },
  };

  return colors[type]?.[variant]?.[isDarkTheme ? 'dark' : 'light'] || 'bg-gray-500';
}

/**
 * Get multiple semantic colors at once
 * Useful for building className strings
 */
export function getSemanticColors(
  type: SemanticColorType,
  isDarkTheme: boolean = true
): Record<ColorVariant, string> {
  return {
    bg: getSemanticColor(type, 'bg', isDarkTheme),
    bgLight: getSemanticColor(type, 'bgLight', isDarkTheme),
    text: getSemanticColor(type, 'text', isDarkTheme),
    border: getSemanticColor(type, 'border', isDarkTheme),
  };
}

/**
 * Status color mapping for common status values
 */
export const statusColorMap: Record<string, SemanticColorType> = {
  // Success/Active states
  active: 'success',
  completed: 'success',
  approved: 'success',
  verified: 'success',
  trusted: 'success',
  online: 'success',

  // Warning/Pending states
  pending: 'warning',
  processing: 'warning',
  review: 'warning',
  caution: 'warning',
  attention: 'warning',

  // Error/Failed states
  error: 'error',
  failed: 'error',
  rejected: 'error',
  denied: 'error',
  offline: 'error',

  // Info/Neutral states
  info: 'info',
  default: 'info',
  neutral: 'info',
};

/**
 * Get semantic color for a status string
 * @param status - The status string
 * @param isDarkTheme - Whether we're in dark mode
 * @returns The Tailwind color class
 */
export function getStatusColor(
  status: string,
  variant: ColorVariant = 'bg',
  isDarkTheme: boolean = true
): string {
  const semanticType = statusColorMap[status.toLowerCase()] || 'info';
  return getSemanticColor(semanticType, variant, isDarkTheme);
}
