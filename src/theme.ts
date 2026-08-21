import { useColorScheme } from 'react-native';

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
}

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
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
