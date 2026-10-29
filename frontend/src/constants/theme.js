/**
 * Centralized theme tokens for light and dark mode.
 * Used throughout the app instead of hardcoding colors so ThemeContext
 * can switch palettes at runtime.
 */
export const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#6C63FF',
    primaryDark: '#4B45C6',
    secondary: '#FF6B6B',
    background: '#F8F9FC',
    surface: '#FFFFFF',
    text: '#1A1B25',
    textSecondary: '#6B6F80',
    border: '#E7E8F0',
    success: '#06D6A0',
    warning: '#FFD93D',
    danger: '#EF476F',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
    skeleton: '#E7E8F0',
    overlay: 'rgba(0,0,0,0.4)',
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#8B84FF',
    primaryDark: '#6C63FF',
    secondary: '#FF8787',
    background: '#12131A',
    surface: '#1C1D29',
    text: '#F1F2F8',
    textSecondary: '#9497AA',
    border: '#2B2C3A',
    success: '#2FE6B8',
    warning: '#FFE066',
    danger: '#FF6B8B',
    card: '#1C1D29',
    tabBar: '#1C1D29',
    skeleton: '#2B2C3A',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 };

export const CATEGORIES = [
  { name: 'Music', icon: 'music-note', color: '#FF6B6B' },
  { name: 'Workshop', icon: 'tools', color: '#4ECDC4' },
  { name: 'Festival', icon: 'party-popper', color: '#FFD93D' },
  { name: 'Sports', icon: 'basketball', color: '#1A936F' },
  { name: 'Food', icon: 'food', color: '#FF9F1C' },
  { name: 'Education', icon: 'school', color: '#6C63FF' },
  { name: 'Meetup', icon: 'account-group', color: '#3D5A80' },
  { name: 'Technology', icon: 'laptop', color: '#118AB2' },
  { name: 'Business', icon: 'briefcase', color: '#073B4C' },
  { name: 'Art', icon: 'palette', color: '#EF476F' },
  { name: 'Culture', icon: 'bank', color: '#8338EC' },
  { name: 'Charity', icon: 'hand-heart', color: '#06D6A0' },
];
