/**
 * Card themes.
 *
 * Each is a complete palette rather than a tint, because a carousel is read as
 * one set: mixing a light card into a dark deck looks like a mistake. Contrast
 * of body text against its background is kept high so the cards stay legible at
 * the size a feed actually renders them.
 */
export interface CarouselTheme {
  id: string;
  label: string;
  background: string;
  title: string;
  body: string;
  muted: string;
  accent: string;
}

export const THEMES: CarouselTheme[] = [
  { id: 'ink',    label: 'Ink',    background: '#0F172A', title: '#F8FAFC', body: '#CBD5E1', muted: '#64748B', accent: '#38BDF8' },
  { id: 'paper',  label: 'Paper',  background: '#FAF7F2', title: '#111827', body: '#374151', muted: '#9CA3AF', accent: '#F97316' },
  { id: 'mint',   label: 'Mint',   background: '#052E2B', title: '#ECFDF5', body: '#A7F3D0', muted: '#4B8F86', accent: '#34D399' },
  { id: 'plum',   label: 'Plum',   background: '#2E1065', title: '#F5F3FF', body: '#DDD6FE', muted: '#8B7BB8', accent: '#C084FC' },
  { id: 'signal', label: 'Signal', background: '#18181B', title: '#FAFAFA', body: '#D4D4D8', muted: '#71717A', accent: '#EF4444' },
];

export const DEFAULT_THEME = THEMES[0];
