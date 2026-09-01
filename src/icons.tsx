import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TextStyle, StyleProp } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { getPref, setPref } from './db';

export type IconStyle = 'material' | 'bold' | 'minimal' | 'thin';

export interface IconStyleInfo {
  id: IconStyle;
  label: string;
  description: string;
}

export const ICON_STYLES: IconStyleInfo[] = [
  { id: 'material', label: 'Material', description: 'Filled and bold — the current look.' },
  { id: 'bold', label: 'Bold', description: 'Material Community icons — modern, rounded and filled.' },
  { id: 'minimal', label: 'Minimal', description: 'Feather — clean, uniform-width line icons.' },
  { id: 'thin', label: 'Thin', description: 'Ionicons — delicate SF-style outlines.' },
];

interface GlyphEntry {
  material: string;
  bold: string;
  minimal: string;
  thin: string;
}

export const REGISTRY = {
  add: { material: 'add', bold: 'plus', minimal: 'plus', thin: 'add' },
  'add-circle-outline': { material: 'add-circle-outline', bold: 'plus-circle-outline', minimal: 'plus-circle', thin: 'add-circle-outline' },
  air: { material: 'air', bold: 'weather-windy', minimal: 'wind', thin: 'cloudy-outline' },
  alarm: { material: 'alarm', bold: 'alarm', minimal: 'clock', thin: 'timer-outline' },
  'arrow-back': { material: 'arrow-back', bold: 'arrow-left', minimal: 'arrow-left', thin: 'arrow-back' },
  'arrow-downward': { material: 'arrow-downward', bold: 'arrow-down', minimal: 'arrow-down', thin: 'arrow-down' },
  'arrow-forward': { material: 'arrow-forward', bold: 'arrow-right', minimal: 'arrow-right', thin: 'arrow-forward' },
  'arrow-upward': { material: 'arrow-upward', bold: 'arrow-up', minimal: 'arrow-up', thin: 'arrow-up' },
  'auto-stories': { material: 'auto-stories', bold: 'book-open-page-variant', minimal: 'book-open', thin: 'book-outline' },
  'back-hand': { material: 'back-hand', bold: 'gesture-tap', minimal: 'move', thin: 'hand-right-outline' },
  'bar-chart': { material: 'bar-chart', bold: 'chart-bar', minimal: 'bar-chart-2', thin: 'stats-chart-outline' },
  bedtime: { material: 'bedtime', bold: 'weather-night', minimal: 'moon', thin: 'moon-outline' },
  bolt: { material: 'bolt', bold: 'lightning-bolt', minimal: 'zap', thin: 'flash-outline' },
  bookmark: { material: 'bookmark', bold: 'bookmark', minimal: 'bookmark', thin: 'bookmark-outline' },
  category: { material: 'category', bold: 'shape', minimal: 'grid', thin: 'apps-outline' },
  check: { material: 'check', bold: 'check', minimal: 'check', thin: 'checkmark' },
  'check-circle': { material: 'check-circle', bold: 'check-circle', minimal: 'check-circle', thin: 'checkmark-circle-outline' },
  'radio-button-unchecked': { material: 'radio-button-unchecked', bold: 'radiobox-blank', minimal: 'circle', thin: 'ellipse-outline' },
  autorenew: { material: 'autorenew', bold: 'autorenew', minimal: 'refresh-cw', thin: 'refresh' },
  'chevron-left': { material: 'chevron-left', bold: 'chevron-left', minimal: 'chevron-left', thin: 'chevron-back' },
  'chevron-right': { material: 'chevron-right', bold: 'chevron-right', minimal: 'chevron-right', thin: 'chevron-forward' },
  close: { material: 'close', bold: 'close', minimal: 'x', thin: 'close' },
  delete: { material: 'delete', bold: 'delete', minimal: 'trash-2', thin: 'trash-bin-outline' },
  'delete-forever': { material: 'delete-forever', bold: 'delete-forever', minimal: 'trash', thin: 'trash-outline' },
  'delete-outline': { material: 'delete-outline', bold: 'delete-outline', minimal: 'trash-2', thin: 'trash-outline' },
  edit: { material: 'edit', bold: 'pencil', minimal: 'edit', thin: 'create-outline' },
  'edit-note': { material: 'edit-note', bold: 'pencil-outline', minimal: 'edit-3', thin: 'pencil-outline' },
  'emoji-events': { material: 'emoji-events', bold: 'trophy-outline', minimal: 'award', thin: 'trophy-outline' },
  event: { material: 'event', bold: 'calendar-blank', minimal: 'calendar', thin: 'calendar-outline' },
  'expand-less': { material: 'expand-less', bold: 'chevron-up', minimal: 'chevron-up', thin: 'chevron-up' },
  'expand-more': { material: 'expand-more', bold: 'chevron-down', minimal: 'chevron-down', thin: 'chevron-down' },
  favorite: { material: 'favorite', bold: 'heart', minimal: 'heart', thin: 'heart-outline' },
  'fitness-center': { material: 'fitness-center', bold: 'dumbbell', minimal: 'activity', thin: 'barbell-outline' },
  flag: { material: 'flag', bold: 'flag', minimal: 'flag', thin: 'flag-outline' },
  folder: { material: 'folder', bold: 'folder', minimal: 'folder', thin: 'folder-outline' },
  'folder-open': { material: 'folder-open', bold: 'folder-open', minimal: 'folder', thin: 'folder-open' },
  history: { material: 'history', bold: 'history', minimal: 'clock', thin: 'time-outline' },
  lightbulb: { material: 'lightbulb', bold: 'lightbulb-outline', minimal: 'zap', thin: 'bulb-outline' },
  list: { material: 'list', bold: 'view-list', minimal: 'list', thin: 'list-outline' },
  'menu-book': { material: 'menu-book', bold: 'book-open-variant', minimal: 'book', thin: 'library-outline' },
  'monitor-weight': { material: 'monitor-weight', bold: 'scale-bathroom', minimal: 'target', thin: 'body-outline' },
  'nights-stay': { material: 'nights-stay', bold: 'moon-waning-crescent', minimal: 'moon', thin: 'cloudy-night-outline' },
  notes: { material: 'notes', bold: 'note-text', minimal: 'file-text', thin: 'document-text-outline' },
  notifications: { material: 'notifications', bold: 'bell-outline', minimal: 'bell', thin: 'notifications-outline' },
  photo: { material: 'photo', bold: 'image-outline', minimal: 'camera', thin: 'camera-outline' },
  'play-arrow': { material: 'play-arrow', bold: 'play', minimal: 'play', thin: 'play' },
  'play-circle-fill': { material: 'play-circle-fill', bold: 'play-circle', minimal: 'play-circle', thin: 'play-circle' },
  psychology: { material: 'psychology', bold: 'head-cog', minimal: 'cpu', thin: 'color-wand-outline' },
  refresh: { material: 'refresh', bold: 'refresh', minimal: 'refresh-cw', thin: 'refresh' },
  remove: { material: 'remove', bold: 'minus', minimal: 'minus', thin: 'remove' },
  'restart-alt': { material: 'restart-alt', bold: 'restart', minimal: 'rotate-ccw', thin: 'refresh-outline' },
  restore: { material: 'restore', bold: 'history', minimal: 'rotate-ccw', thin: 'time-outline' },
  schedule: { material: 'schedule', bold: 'clock-outline', minimal: 'clock', thin: 'time-outline' },
  search: { material: 'search', bold: 'magnify', minimal: 'search', thin: 'search-outline' },
  settings: { material: 'settings', bold: 'cog-outline', minimal: 'settings', thin: 'settings-outline' },
  'shopping-cart': { material: 'shopping-cart', bold: 'cart-outline', minimal: 'shopping-cart', thin: 'cart-outline' },
  'signal-cellular-alt': { material: 'signal-cellular-alt', bold: 'signal', minimal: 'activity', thin: 'bar-chart-outline' },
  'sports-esports': { material: 'sports-esports', bold: 'gamepad-variant', minimal: 'grid', thin: 'game-controller-outline' },
  star: { material: 'star', bold: 'star', minimal: 'star', thin: 'star' },
  'star-border': { material: 'star-border', bold: 'star-outline', minimal: 'star', thin: 'star-outline' },
  sync: { material: 'sync', bold: 'sync', minimal: 'repeat', thin: 'sync-outline' },
  today: { material: 'today', bold: 'calendar-today', minimal: 'calendar', thin: 'calendar-number-outline' },
  usage: { material: 'speed', bold: 'speedometer', minimal: 'activity', thin: 'speedometer-outline' },
  warning: { material: 'warning', bold: 'alert-outline', minimal: 'alert-triangle', thin: 'warning-outline' },
  widgets: { material: 'widgets', bold: 'view-grid', minimal: 'grid', thin: 'grid-outline' },
  school: { material: 'school', bold: 'school-outline', minimal: 'book', thin: 'school-outline' },
  'accessibility-new': { material: 'accessibility-new', bold: 'human', minimal: 'user', thin: 'accessibility-outline' },
  link: { material: 'link', bold: 'link', minimal: 'link', thin: 'link-outline' },
  movie: { material: 'movie', bold: 'movie', minimal: 'film', thin: 'film-outline' },
  article: { material: 'article', bold: 'newspaper', minimal: 'file-text', thin: 'document-text-outline' },
  'music-note': { material: 'music-note', bold: 'music-note', minimal: 'music', thin: 'musical-notes-outline' },
  people: { material: 'people', bold: 'account-group', minimal: 'users', thin: 'people-outline' },
  code: { material: 'code', bold: 'code-tags', minimal: 'code', thin: 'code-slash-outline' },
  image: { material: 'image', bold: 'image-outline', minimal: 'image', thin: 'image-outline' },
  build: { material: 'build', bold: 'hammer-wrench', minimal: 'tool', thin: 'construct-outline' },
  'open-in-new': { material: 'open-in-new', bold: 'open-in-new', minimal: 'external-link', thin: 'open-outline' },
  'content-copy': { material: 'content-copy', bold: 'content-copy', minimal: 'copy', thin: 'copy-outline' },
  chat: { material: 'chat', bold: 'chat-outline', minimal: 'message-circle', thin: 'chatbubble-ellipses-outline' },
  water: { material: 'water-drop', bold: 'water', minimal: 'droplet', thin: 'water-outline' },
  cloud: { material: 'cloud', bold: 'cloud', minimal: 'cloud', thin: 'cloud-outline' },
  storefront: { material: 'storefront', bold: 'storefront-outline', minimal: 'home', thin: 'storefront-outline' },
  download: { material: 'file-download', bold: 'download', minimal: 'download', thin: 'download-outline' },
};

export type IconName = keyof typeof REGISTRY;

export function getGlyph(style: IconStyle, name: IconName): string {
  return REGISTRY[name][style];
}

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

function IconGlyph({ name, size, color, style }: IconProps) {
  const { style: iconStyle } = useIconStyle();
  const entry = REGISTRY[name];
  if (!entry) return null;
  const glyph = entry[iconStyle];
  if (iconStyle === 'bold') {
    return <MaterialCommunityIcons name={glyph as never} size={size} color={color} style={style} />;
  }
  if (iconStyle === 'minimal') {
    return <Feather name={glyph as never} size={size} color={color} style={style} />;
  }
  if (iconStyle === 'thin') {
    return <Ionicons name={glyph as never} size={size} color={color} style={style} />;
  }
  return <MaterialIcons name={glyph as never} size={size} color={color} style={style} />;
}

export const Icon = React.memo(IconGlyph);

interface IconPreviewProps {
  style: IconStyle;
  name: IconName;
  size?: number;
  color?: string;
}

export function IconPreview({ style, name, size, color }: IconPreviewProps) {
  const entry = REGISTRY[name];
  if (!entry) return null;
  const glyph = entry[style];
  if (style === 'bold') {
    return <MaterialCommunityIcons name={glyph as never} size={size} color={color} />;
  }
  if (style === 'minimal') {
    return <Feather name={glyph as never} size={size} color={color} />;
  }
  if (style === 'thin') {
    return <Ionicons name={glyph as never} size={size} color={color} />;
  }
  return <MaterialIcons name={glyph as never} size={size} color={color} />;
}

interface IconStyleContextValue {
  style: IconStyle;
  setStyle: (style: IconStyle) => void;
}

const IconStyleContext = createContext<IconStyleContextValue>({
  style: 'material',
  setStyle: () => {},
});

const ICON_STYLE_PREF_KEY = 'icon_style';

export function IconStyleProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<IconStyle>('material');

  useEffect(() => {
    void getPref(ICON_STYLE_PREF_KEY).then((stored) => {
      if (stored && ICON_STYLES.some((s) => s.id === stored)) {
        setStyleState(stored as IconStyle);
      }
    });
  }, []);

  const value = useMemo<IconStyleContextValue>(
    () => ({
      style,
      setStyle: (next) => {
        setStyleState(next);
        void setPref(ICON_STYLE_PREF_KEY, next);
      },
    }),
    [style],
  );

  return <IconStyleContext.Provider value={value}>{children}</IconStyleContext.Provider>;
}

export function useIconStyle(): IconStyleContextValue {
  return useContext(IconStyleContext);
}

export const APP_TILE_GLYPH: Record<string, IconName> = {
    HomeApp: 'widgets',
    HabitApp: 'today',
    NotesApp: 'edit-note',
    TodoApp: 'check-circle',
    RoutinesApp: 'sync',
    FitnessApp: 'fitness-center',
    SleepApp: 'bedtime',
    LucidApp: 'psychology',
    BooksApp: 'menu-book',
    LooksmaxxingApp: 'star',
    GamesApp: 'sports-esports',
    LinksApp: 'link',
    SettingsApp: 'settings',
    AiApp: 'chat',
    WaterApp: 'water',
    EvolveApp: 'bolt',
    FocusApp: 'alarm',
    MoodApp: 'favorite',
    SpendApp: 'shopping-cart',
    SyncApp: 'cloud',
    BusinessApp: 'storefront',
  };