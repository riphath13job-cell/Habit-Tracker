import { ViewStyle, StyleSheet } from 'react-native';

/** Fixed neon-on-black palette for the Evolve mini-app, independent of user theme. */
export const EVO = {
  bg: '#05060B',
  card: '#0C0E16',
  cardAlt: '#10131D',
  border: '#232838',
  text: '#EEF2FF',
  sub: '#8A93A8',
  accent: '#00D9FF',
  green: '#22FF88',
  orange: '#FF9F1C',
  yellow: '#FFD23F',
  red: '#FF5470',
  blue: '#5B8CFF',
  white: '#FFFFFF',
};

export const EVO_SPHERE_COLORS: Record<string, string> = {
  body: EVO.green,
  intellect: EVO.accent,
  career: EVO.orange,
  life: EVO.yellow,
};

/** Neon glow via a colourized shadow. Android gets elevation as a soft proxy. */
export function neon(color: string, radius: number): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: 0.5,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  };
}

export const EVO_GAP = 14;

export const EVO_STYLES = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: EVO.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    color: EVO.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sub: {
    color: EVO.sub,
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: EVO.card,
    borderColor: EVO.border,
    borderWidth: 1,
    borderRadius: 18,
  },
  section: {
    color: EVO.sub,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: EVO_GAP,
  },
});