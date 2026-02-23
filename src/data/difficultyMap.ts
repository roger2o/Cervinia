import type { Difficulty, DifficultyPreference } from '../types/graph';

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  blue: '#3b82f6',
  red: '#ef4444',
  black: '#1f2937',
};

export const PREFERENCE_LABELS: Record<DifficultyPreference, string> = {
  'blue': 'Blue',
  'easy-red': 'Blue/Red',
  'red': 'Red',
  'easy-black': 'Red/Black',
  'black': 'Black',
};

export const PREFERENCE_COLORS: Record<DifficultyPreference, string> = {
  'blue': '#3b82f6',
  'easy-red': '#ef4444',
  'red': '#ef4444',
  'easy-black': '#1f2937',
  'black': '#1f2937',
};

export const PREFERENCE_ORDER: DifficultyPreference[] = ['blue', 'easy-red', 'red', 'easy-black', 'black'];

/** Brighter variants for route overlay segments */
export const DIFFICULTY_ROUTE_COLORS: Record<Difficulty, string> = {
  blue: '#2563eb',
  red: '#dc2626',
  black: '#111827',
};
