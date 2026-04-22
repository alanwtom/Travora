import { useMemo } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { COLORS } from '@/lib/constants';

export type AppColorScheme = 'light' | 'dark';

export type AppColors = typeof COLORS & {
  background: string;
  surface: string;
  card: string;
  text: string;
  border: string;
  overlay: string;
};

export function getAppColors(scheme: AppColorScheme): AppColors {
  const isDark = scheme === 'dark';
  return {
    ...COLORS,
    background: isDark ? COLORS.backgroundDark : COLORS.background,
    surface: isDark ? COLORS.surfaceDark : COLORS.surface,
    card: isDark ? COLORS.surfaceDark : COLORS.card,
    text: isDark ? COLORS.textDark : COLORS.text,
    border: isDark ? COLORS.borderDark : COLORS.border,
    overlay: isDark ? 'rgba(0,0,0,0.55)' : COLORS.overlay,
  };
}

export function useAppColors(): AppColors {
  const scheme = (useColorScheme() ?? 'light') as AppColorScheme;
  return useMemo(() => getAppColors(scheme), [scheme]);
}

