// Design tokens from /app/design_guidelines.json
export const C = {
  surface: '#09090B',
  onSurface: '#FAFAFA',
  surfaceSecondary: '#18181B',
  onSurfaceSecondary: '#A1A1AA',
  surfaceTertiary: '#27272A',
  onSurfaceTertiary: '#D4D4D8',
  brand: '#10B981',
  brandTertiary: 'rgba(16, 185, 129, 0.12)',
  onBrandPrimary: '#022C22',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#27272A',
  borderStrong: '#3F3F46',
  divider: '#18181B',
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const R = { sm: 6, md: 12, lg: 20, pill: 999 };
export const F = { sm: 12, base: 14, lg: 16, xl: 20, xxl: 24, display: 40 };

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom_days';
export type Category = 'streaming' | 'software' | 'fitness' | 'utilities' | 'other';
export type Status = 'active' | 'paused' | 'cancelled';

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'streaming', label: 'Streaming' },
  { key: 'software', label: 'Software' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'other', label: 'Other' },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  streaming: '#10B981',
  software: '#F59E0B',
  fitness: '#EF4444',
  utilities: '#8B5CF6',
  other: '#A1A1AA',
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

export const REMINDER_OPTIONS = [1, 3, 7];

export type Preset = {
  key: string;
  name: string;
  cost: number;
  category: Category;
  color: string;
  monogram: string;
};

// Preset services with tinted color + monogram fallback (avoids brand-image legal issues).
export const PRESETS: Preset[] = [
  { key: 'netflix', name: 'Netflix', cost: 15.49, category: 'streaming', color: '#E50914', monogram: 'N' },
  { key: 'disney', name: 'Disney+', cost: 10.99, category: 'streaming', color: '#0E47A1', monogram: 'D' },
  { key: 'hulu', name: 'Hulu', cost: 7.99, category: 'streaming', color: '#1CE783', monogram: 'H' },
  { key: 'max', name: 'Max', cost: 9.99, category: 'streaming', color: '#0046FE', monogram: 'M' },
  { key: 'prime', name: 'Amazon Prime', cost: 14.99, category: 'streaming', color: '#00A8E1', monogram: 'A' },
  { key: 'spotify', name: 'Spotify', cost: 10.99, category: 'streaming', color: '#1DB954', monogram: 'S' },
  { key: 'apple_music', name: 'Apple Music', cost: 10.99, category: 'streaming', color: '#FA243C', monogram: 'A' },
  { key: 'youtube', name: 'YouTube Premium', cost: 13.99, category: 'streaming', color: '#FF0000', monogram: 'Y' },
  { key: 'apple_tv', name: 'Apple TV+', cost: 9.99, category: 'streaming', color: '#000000', monogram: 'T' },
  { key: 'paramount', name: 'Paramount+', cost: 7.99, category: 'streaming', color: '#0064FF', monogram: 'P' },
  { key: 'peacock', name: 'Peacock', cost: 7.99, category: 'streaming', color: '#F0A500', monogram: 'P' },
  { key: 'ps_plus', name: 'PlayStation Plus', cost: 9.99, category: 'streaming', color: '#003791', monogram: 'P' },
  { key: 'gamepass', name: 'Xbox Game Pass', cost: 16.99, category: 'streaming', color: '#107C10', monogram: 'X' },
  { key: 'adobe', name: 'Adobe Creative Cloud', cost: 59.99, category: 'software', color: '#FF0000', monogram: 'A' },
  { key: 'ms365', name: 'Microsoft 365', cost: 9.99, category: 'software', color: '#0078D4', monogram: 'M' },
  { key: 'icloud', name: 'iCloud+', cost: 2.99, category: 'software', color: '#3693F3', monogram: 'I' },
  { key: 'gone', name: 'Google One', cost: 1.99, category: 'software', color: '#4285F4', monogram: 'G' },
  { key: 'dropbox', name: 'Dropbox', cost: 11.99, category: 'software', color: '#0061FF', monogram: 'D' },
  { key: 'chatgpt', name: 'ChatGPT Plus', cost: 20.00, category: 'software', color: '#10A37F', monogram: 'C' },
  { key: 'notion', name: 'Notion', cost: 10.00, category: 'software', color: '#000000', monogram: 'N' },
  { key: 'canva', name: 'Canva Pro', cost: 12.99, category: 'software', color: '#00C4CC', monogram: 'C' },
  { key: 'planet_fitness', name: 'Planet Fitness', cost: 24.99, category: 'fitness', color: '#582C83', monogram: 'P' },
  { key: 'gym', name: 'Gym Membership', cost: 39.99, category: 'fitness', color: '#EF4444', monogram: 'G' },
  { key: 'custom_stream', name: 'Streaming Service', cost: 9.99, category: 'streaming', color: '#10B981', monogram: 'S' },
];

export const findPreset = (name: string): Preset | undefined => {
  const n = name.trim().toLowerCase();
  return PRESETS.find(p => p.name.toLowerCase() === n || p.key === n);
};
