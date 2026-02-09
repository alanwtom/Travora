export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  VIDEOS: 'videos',
} as const;

export const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB

export const FEED_PAGE_SIZE = 10;

export const APP_NAME = 'Travora';

export const COLORS = {
  // Warm travel-inspired palette
  primary: '#1A1A2E',         // deep navy (buttons, headings)
  primaryLight: '#2D2D44',    // lighter navy
  accent: '#D4856A',          // warm coral/terracotta
  accentLight: '#E8A890',     // soft coral
  warmPink: '#E8B4B8',        // soft pink
  warmGold: '#F5D5A0',        // golden hour
  lavender: '#C5B3D4',        // soft lavender
  sage: '#8BAF8E',            // muted sage green

  background: '#FFFFFF',      // clean white
  backgroundDark: '#1A1A2E',
  surface: '#F7F7F8',         // very light gray
  surfaceDark: '#2D2D44',
  card: '#FFFFFF',

  text: '#1A1A2E',            // deep navy
  textDark: '#FFFFFF',
  textMuted: '#6B7280',       // neutral gray
  textLight: '#9CA3AF',       // lighter gray

  border: '#E5E7EB',          // neutral border
  borderDark: '#3D3D54',

  error: '#D4645A',           // warm red
  success: '#6AAF72',         // sage green

  // Gradients (used as reference values)
  gradientStart: '#F5D5A0',   // golden
  gradientMid: '#E8B4B8',     // pink
  gradientEnd: '#C5B3D4',     // lavender

  overlay: 'rgba(26, 26, 46, 0.4)',
  overlayLight: 'rgba(26, 26, 46, 0.15)',
} as const;
