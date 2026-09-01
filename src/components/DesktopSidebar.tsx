import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
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
import * as Haptics from 'expo-haptics';
import { Icon, APP_TILE_GLYPH } from '../icons';
import { resolveAppsOrder } from '../hub/apps';
import { useHub } from '../hub/HubContext';
import { switchToApp } from '../hub/navigation';
import { useTheme } from '../theme';

const EXPANDED_WIDTH = 244;
const DESKTOP_BREAKPOINT = 640;
const TILE = 40;

/**
 * Desktop "apps" side panel: a persistent left rail listing every mini-app so
 * you can jump anywhere without going back to the launcher. Can be collapsed.
 */
export function DesktopSidebar({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const { appsOrder } = useHub();
  const apps = resolveAppsOrder(appsOrder);
  const panelWidth = useRef(new Animated.Value(EXPANDED_WIDTH)).current;

  useEffect(() => {
    Animated.timing(panelWidth, {
      toValue: visible ? EXPANDED_WIDTH : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [visible, panelWidth]);

  if (width <= DESKTOP_BREAKPOINT) return null;

  return (
    <Animated.View style={[styles.outer, { width: panelWidth, overflow: 'hidden' }]}>
      <View style={[styles.panel, { width: EXPANDED_WIDTH, backgroundColor: theme.bg }]}>
        <BlurView
          intensity={dark ? 32 : 48}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            dark
              ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.00)']
              : ['rgba(255, 255, 255, 0.36)', 'rgba(255, 255, 255, 0.00)']
          }
          locations={[0, 0.7]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.border} pointerEvents="none" />

        <View style={styles.headerRow}>
          <Image source={require('../../assets/icon.png')} style={styles.brandIcon} />
          <Text style={[styles.title, { color: theme.text }]}>Apps</Text>
          <Pressable onPress={onToggle} hitSlop={8} style={styles.collapseBtn}>
            <Icon name="chevron-left" size={20} color={theme.sub} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}>
          {apps.map((app) => {
            const radius = Math.round(TILE * 0.3);
            return (
              <Pressable
                key={app.key}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  switchToApp(app.key);
                }}>
                <LinearGradient
                  colors={app.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.icon, { width: TILE, height: TILE, borderRadius: radius }]}>
                  <Icon name={APP_TILE_GLYPH[app.key]} size={Math.round(TILE * 0.5)} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {app.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    height: '100%',
  },
  panel: {
    height: '100%',
    paddingTop: 18,
    paddingBottom: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(128, 128, 160, 0.14)',
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  collapseBtn: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
