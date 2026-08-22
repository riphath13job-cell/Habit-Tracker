import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { APPS, AppTileButton } from './apps';
import { switchToApp } from './navigation';
import { useTheme } from '../theme';

interface HubContextValue {
  folderOpen: boolean;
  openFolder: () => void;
  closeFolder: () => void;
}

const HubContext = createContext<HubContextValue>({
  folderOpen: false,
  openFolder: () => {},
  closeFolder: () => {},
});

export function useHub(): HubContextValue {
  return useContext(HubContext);
}

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [folderOpen, setFolderOpen] = useState(false);
  const value = useRef({ openFolder: () => setFolderOpen(true), closeFolder: () => setFolderOpen(false) });
  return (
    <HubContext.Provider value={{ folderOpen, ...value.current }}>
      {children}
      <FolderOverlay visible={folderOpen} onClose={() => setFolderOpen(false)} />
    </HubContext.Provider>
  );
}

/** iOS-style folder: a big liquid-glass square with rounded edges holding the app tiles. */
function FolderOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, stiffness: 260, damping: 22 }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

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
              <Text style={[styles.title, { color: theme.text }]}>My Apps</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color={theme.sub} />
              </Pressable>
            </View>

            <View style={styles.grid}>
              {APPS.map((app) => (
                <AppTileButton
                  key={app.key}
                  app={app}
                  size={78}
                  onPress={() => {
                    onClose();
                    switchToApp(app.key);
                  }}
                />
              ))}
            </View>
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
    padding: 22,
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
    marginBottom: 22,
    paddingLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 22,
    paddingVertical: 12,
    paddingBottom: 20,
  },
});
