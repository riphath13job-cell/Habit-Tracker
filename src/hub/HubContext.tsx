import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../icons';
import { AppTileButton, resolveAppsOrder } from './apps';
import { switchToApp, type AppKey } from './navigation';
import { useTheme } from '../theme';
import { getPref, setPref } from '../db';

const APPS_ORDER_KEY = 'apps_order';

interface HubContextValue {
  folderOpen: boolean;
  openFolder: () => void;
  closeFolder: () => void;
  /** Persisted app order (AppKey list), null until loaded. */
  appsOrder: string[] | null;
  /** Reorders and persists the folder / launcher apps. */
  setAppsOrder: (next: string[]) => void;
}

const HubContext = createContext<HubContextValue>({
  folderOpen: false,
  openFolder: () => {},
  closeFolder: () => {},
  appsOrder: null,
  setAppsOrder: () => {},
});

export function useHub(): HubContextValue {
  return useContext(HubContext);
}

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [folderOpen, setFolderOpen] = useState(false);
  const [appsOrder, setAppsOrderState] = useState<string[] | null>(null);

  useEffect(() => {
    void getPref(APPS_ORDER_KEY).then((stored) => {
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setAppsOrderState(parsed);
      } catch {
        /* ignore corrupt value */
      }
    });
  }, []);

  const value = useRef({
    openFolder: () => setFolderOpen(true),
    closeFolder: () => setFolderOpen(false),
  });

  const setAppsOrder = useCallback((next: string[]) => {
    setAppsOrderState(next);
    void setPref(APPS_ORDER_KEY, JSON.stringify(next));
  }, []);

  const contextValue = useMemo<HubContextValue>(
    () => ({ folderOpen, ...value.current, appsOrder, setAppsOrder }),
    [folderOpen, appsOrder, setAppsOrder],
  );

  return (
    <HubContext.Provider value={contextValue}>
      {children}
      <FolderOverlay visible={folderOpen} onClose={() => setFolderOpen(false)} />
    </HubContext.Provider>
  );
}

/** iOS-style folder: a big liquid-glass square with rounded edges holding the app tiles. */
function FolderOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const { height: winH } = useWindowDimensions();
  const maxFolderHeight = Math.min(540, winH - 150);
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const { appsOrder, setAppsOrder } = useHub();
  const rows = useMemo(() => resolveAppsOrder(appsOrder), [appsOrder]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, stiffness: 260, damping: 22 }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
      setEditing(false);
      setSelected(null);
      wiggle.setValue(0);
    }
  }, [visible, scale, opacity, wiggle]);

  useEffect(() => {
    if (!editing) {
      wiggle.stopAnimation();
      wiggle.setValue(0);
      setSelected(null);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [editing, wiggle]);

  function handleTilePress(key: AppKey) {
    if (!editing) {
      onClose();
      switchToApp(key);
      return;
    }
    if (!selected) {
      setSelected(key);
      return;
    }
    if (selected === key) {
      setSelected(null);
      return;
    }
    const a = rows.findIndex((r) => r.key === selected);
    const b = rows.findIndex((r) => r.key === key);
    if (a !== -1 && b !== -1) {
      const next = rows.slice();
      [next[a], next[b]] = [next[b], next[a]];
      setAppsOrder(next.map((r) => r.key));
    }
    setSelected(null);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView
          intensity={dark ? 25 : 35}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Pressable style={styles.center} onPress={() => {}}>
          <Animated.View
            style={[
              styles.folder,
              {
                transform: [{ scale }],
                opacity,
                maxHeight: maxFolderHeight,
                backgroundColor: dark ? 'rgba(14, 18, 26, 0.30)' : 'rgba(255, 255, 255, 0.20)',
                borderColor: dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.65)',
              },
            ]}>
            <BlurView
              intensity={dark ? 42 : 62}
              tint={dark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 40 }]}
            />
            <LinearGradient
              colors={
                dark
                  ? ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.00)']
                  : ['rgba(255, 255, 255, 0.42)', 'rgba(255, 255, 255, 0.00)']
              }
              locations={[0, 0.6]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { borderRadius: 40 }]}
            />

            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.text }]}>
                {editing ? 'Edit Apps' : 'My Apps'}
              </Text>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => setEditing((e) => !e)}
                  hitSlop={8}
                  style={[
                    styles.editBtn,
                    editing && { backgroundColor: theme.accent },
                  ]}>
                  <Text style={[styles.editBtnText, { color: editing ? '#101018' : theme.accent }]}>
                    {editing ? 'Done' : 'Edit'}
                  </Text>
                </Pressable>
                <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                  <Icon name="close" size={22} color={theme.sub} />
                </Pressable>
              </View>
            </View>

            {editing ? (
              <Text style={[styles.hint, { color: theme.sub }]}>Tap two apps to swap them</Text>
            ) : null}

            <ScrollView
              style={styles.gridScroll}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}>
              {rows.map((app, index) => {
                const isSelected = selected === app.key;
                const rotate = wiggle.interpolate({
                  inputRange: [0, 1],
                  outputRange: index % 2 === 0 ? ['-2.2deg', '2.2deg'] : ['2.2deg', '-2.2deg'],
                });
                return (
                  <Animated.View
                    key={app.key}
                    style={[
                      styles.tileWrap,
                      editing && { transform: [{ rotate }] },
                      isSelected && styles.tileWrapSelected,
                    ]}>
                    <AppTileButton
                      app={app}
                      size={64}
                      onPress={() => handleTilePress(app.key)}
                    />
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folder: {
    width: '88%',
    maxWidth: 430,
    borderRadius: 40,
    borderWidth: 1,
    padding: 20,
    paddingTop: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  editBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  hint: {
    fontSize: 12.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  tileWrap: {
    width: 130,
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 2,
  },
  tileWrapSelected: {
    borderRadius: 22,
    borderColor: '#FF9F1C',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 159, 28, 0.10)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  gridScroll: {
    flexShrink: 1,
    flexGrow: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 8,
    paddingBottom: 12,
  },
});
