import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getPref, setPref } from './db';

export interface Theme {
  bg: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  accent: string;
  danger: string;
  good: string;
  chipBg: string;
  orange: string;
  yellow: string;
  blue: string;
  red: string;
}

export type ThemeMode = 'neon' | 'system' | 'light' | 'dark' | 'midnight' | 'paper' | 'nord';

export const THEME_MODES: Array<{ mode: ThemeMode; label: string }> = [
  { mode: 'neon', label: 'Neon' },
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'midnight', label: 'Midnight' },
  { mode: 'paper', label: 'Paper' },
  { mode: 'nord', label: 'Nord' },
];

const light: Theme = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  text: '#111318',
  sub: '#6B7280',
  border: '#E5E7EB',
  accent: '#4F46E5',
  danger: '#DC2626',
  good: '#16A34A',
  chipBg: '#EEF0F4',
  orange: '#F59E0B',
  yellow: '#EAB308',
  blue: '#3B82F6',
  red: '#DC2626',
};

const dark: Theme = {
  bg: '#0B0D12',
  card: '#161A22',
  text: '#F3F4F6',
  sub: '#9CA3AF',
  border: '#262B36',
  accent: '#818CF8',
  danger: '#F87171',
  good: '#4ADE80',
  chipBg: '#232936',
  orange: '#FB923C',
  yellow: '#FACC15',
  blue: '#60A5FA',
  red: '#F87171',
};

const midnight: Theme = {
  bg: '#000000',
  card: '#0E0E11',
  text: '#F5F5F4',
  sub: '#8E8E93',
  border: '#232327',
  accent: '#A78BFA',
  danger: '#F87171',
  good: '#4ADE80',
  chipBg: '#1A1A1F',
  orange: '#FBBF24',
  yellow: '#FACC15',
  blue: '#93C5FD',
  red: '#F87171',
};

const paper: Theme = {
  bg: '#F3ECDD',
  card: '#FBF7EE',
  text: '#3B342B',
  sub: '#8B7F6E',
  border: '#E3D8C4',
  accent: '#C2410C',
  danger: '#B91C1C',
  good: '#15803D',
  chipBg: '#EAE1CE',
  orange: '#C2410C',
  yellow: '#B45309',
  blue: '#1D4ED8',
  red: '#B91C1C',
};

const nord: Theme = {
  bg: '#2E3440',
  card: '#3B4252',
  text: '#ECEFF4',
  sub: '#A6AFBD',
  border: '#434C5E',
  accent: '#88C0D0',
  danger: '#BF616A',
  good: '#A3BE8C',
  chipBg: '#434C5E',
  orange: '#D08770',
  yellow: '#EBCB8B',
  blue: '#88C0D0',
  red: '#BF616A',
};

/** The Evolve look: pitch-black, glowing neon cyan, exact palette of src/evolve/palette. */
const neon: Theme = {
  bg: '#05060B',
  card: '#0C0E16',
  text: '#EEF2FF',
  sub: '#8A93A8',
  border: '#232838',
  accent: '#00D9FF',
  danger: '#FF5470',
  good: '#22FF88',
  chipBg: '#10131D',
  orange: '#FF9F1C',
  yellow: '#FFD23F',
  blue: '#5B8CFF',
  red: '#FF5470',
};

const PALETTES: Record<Exclude<ThemeMode, 'system'>, Theme> = {
  neon,
  light,
  dark,
  midnight,
  paper,
  nord,
};

export function resolveTheme(mode: ThemeMode, systemDark: boolean): Theme {
  if (mode === 'system') return systemDark ? dark : light;
  return PALETTES[mode];
}

export function resolveIsDark(mode: ThemeMode, systemDark: boolean): boolean {
  if (mode === 'system') return systemDark;
  return mode !== 'light' && mode !== 'paper';
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  theme: light,
  isDark: false,
});

const THEME_PREF_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === 'dark';
  const [mode, setModeState] = useState<ThemeMode>('neon');

  useEffect(() => {
    void getPref(THEME_PREF_KEY).then((stored) => {
      if (stored && THEME_MODES.some((m) => m.mode === stored)) {
        setModeState(stored as ThemeMode);
      }
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode: (next) => {
        setModeState(next);
        void setPref(THEME_PREF_KEY, next);
      },
      theme: resolveTheme(mode, systemDark),
      isDark: resolveIsDark(mode, systemDark),
    }),
    [mode, systemDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}
