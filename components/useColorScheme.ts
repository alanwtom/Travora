import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeMode } from '@/providers/ThemeModeProvider';

export function useColorScheme() {
  const system = useSystemColorScheme() ?? 'light';
  try {
    const { effectiveScheme } = useThemeMode();
    return effectiveScheme ?? system;
  } catch {
    // In case this hook is called outside the provider (e.g. during early bootstrap),
    // fall back to the system theme.
    return system;
  }
}
