/**
 * FontAwesome to Lucide icon name mapping
 * Maps FontAwesome icon names used in the codebase to Lucide equivalents
 */

export const FontAwesomeToLucide: Record<string, string> = {
  // Navigation
  'home': 'Home',
  'compass': 'Compass',
  'user': 'User',
  'bell': 'Bell',
  'plus': 'Plus',
  'add': 'Plus',

  // Actions
  'heart': 'Heart',
  'heart-o': 'Heart',
  'thumbs-up': 'ThumbsUp',
  'thumbs-down': 'ThumbsDown',
  'send': 'Send',
  'comment': 'MessageCircle',
  'comment-o': 'MessageCircle',
  'comments': 'MessageCircle',
  'share-alt': 'Share2',
  'share-square-o': 'Share2',
  'bookmark': 'Bookmark',
  'bookmark-o': 'Bookmark',

  // Search & Filters
  'search': 'Search',
  'sliders-h': 'SlidersHorizontal',
  'filter': 'Filter',

  // Editing
  'edit': 'Pencil',
  'pencil': 'Pencil',
  'close': 'X',
  'times': 'X',
  'times-circle': 'XCircle',
  'trash': 'Trash2',
  'trash-o': 'Trash2',

  // Status & Feedback
  'check': 'Check',
  'check-circle': 'CheckCircle',
  'checkmark': 'Check',
  'check-circle-o': 'CircleCheck',
  'info-circle': 'Info',
  'exclamation-circle': 'AlertCircle',
  'exclamation-triangle': 'AlertTriangle',
  'question-circle': 'HelpCircle',

  // Media
  'play': 'Play',
  'pause': 'Pause',
  'video-camera': 'Video',
  'videocamera': 'Video',
  'image': 'Image',
  'photo': 'Image',
  'camera': 'Camera',
  'play-circle': 'PlayCircle',
  'eye': 'Eye',

  // Location & Travel
  'map-marker': 'MapPin',
  'map-marked-alt': 'MapPin',
  'map-pin': 'MapPin',
  'thumb-tack': 'MapPin',
  'calendar': 'Calendar',
  'calendar-alt': 'Calendar',
  'clock': 'Clock',
  'time': 'Clock',

  // Categories
  'flask': 'Flask',
  'star': 'Star',
  'star-o': 'Star',
  'utensils': 'Utensils',
  'landmark': 'Landmark',
  'umbrella-beach': 'Umbrella',
  'hiking': 'Mountain',

  // UI Controls
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'chevron-down': 'ChevronDown',
  'chevron-up': 'ChevronUp',
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'bars': 'Menu',
  'ellipsis-h': 'MoreHorizontal',
  'ellipsis-v': 'MoreVertical',

  // Auth & User
  'mail': 'Mail',
  'envelope': 'Mail',
  'envelope-o': 'Mail',
  'lock': 'Lock',
  'lock-open': 'LockOpen',
  'sign-in': 'LogIn',
  'sign-out': 'LogOut',
  'user-plus': 'UserPlus',
  'user-minus': 'UserMinus',
  'users': 'Users',
  'people-outline': 'Users',

  // Settings & Misc
  'cogs': 'Settings',
  'gear': 'Settings',
  'magic': 'Wand2',
  'sparkles': 'Sparkles',
  'wand-magic-sparkles': 'Wand2',
  'bug': 'Bug',
  'robot': 'Bot',
  'wallet': 'Wallet',
  'database': 'Database',
  'activity': 'Activity',
  'cloud-upload': 'UploadCloud',
  'upload': 'Upload',
  'plus-circle': 'PlusCircle',
  'minus-circle': 'MinusCircle',
  'minus': 'Minus',
  'flag': 'Flag',
};

/**
 * Maps a FontAwesome icon name to a Lucide icon name
 * @param iconName - FontAwesome icon name
 * @returns Lucide icon name
 */
export function mapIconName(iconName: string): string {
  return FontAwesomeToLucide[iconName] || iconName;
}

/**
 * Determines if a FontAwesome icon should be filled/solid
 * @param iconName - FontAwesome icon name
 * @returns true if the icon should be filled
 */
export function isFilledIcon(iconName: string): boolean {
  // Outline icons in FontAwesome typically have '-o' suffix
  return !iconName.endsWith('-o');
}
