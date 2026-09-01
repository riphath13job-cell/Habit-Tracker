import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Icon } from '../icons';
import { useTheme } from '../theme';
import { DesktopSidebar } from './DesktopSidebar';

const PHONE_BREAKPOINT = 640;

/**
 * Desktop-friendly frame. On narrow (phone) widths it renders children at full
 * width, exactly as before. On wide (desktop) widths it shows a persistent
 * apps side panel on the left (toggleable) and centers the app in a generous
 * column so content reads comfortably rather than stretching edge-to-edge.
 */
export function DesktopFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const isDesktop = width > PHONE_BREAKPOINT;

  if (!isDesktop) {
    return <View style={styles.root}>{children}</View>;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.row}>
        <DesktopSidebar visible={sidebarVisible} onToggle={() => setSidebarVisible((v) => !v)} />
        <View style={[styles.canvasHost, { backgroundColor: theme.bg }]}>
          <View style={[styles.canvas, { backgroundColor: theme.bg }]}>{children}</View>
        </View>
      </View>
      {!sidebarVisible ? (
        <Pressable
          style={styles.expandBtn}
          onPress={() => setSidebarVisible(true)}
          hitSlop={8}>
          <Icon name="folder" size={20} color="#FFFFFF" />
          <Text style={styles.expandText}>Apps</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  canvasHost: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  canvas: {
    flex: 1,
    width: '100%',
    maxWidth: 1180,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  expandBtn: {
    position: 'absolute',
    top: 18,
    left: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 24, 33, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  expandText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
