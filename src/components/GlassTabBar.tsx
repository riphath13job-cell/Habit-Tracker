import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';

const BAR_HEIGHT = 62;
const PILL_HEIGHT = 38;

/**
 * Floating "liquid glass" bottom tab bar with an animated pill that slides
 * between tabs. Fakes the iOS 26 Liquid Glass look with blur + sheen gradient
 * (the native glass APIs need a newer SDK than the App Store Expo Go supports).
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const tabCount = state.routes.length;
  const tabWidth = barWidth / tabCount;

  useEffect(() => {
    if (barWidth === 0) return;
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      stiffness: 320,
      damping: 26,
      mass: 0.9,
    }).start();
  }, [state.index, tabWidth, barWidth, translateX]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: insets.bottom + 10 }]}>
      <View
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            height: BAR_HEIGHT,
            backgroundColor: dark ? 'rgba(20, 24, 33, 0.42)' : 'rgba(255, 255, 255, 0.42)',
            borderColor: dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.60)',
          },
        ]}>
        <BlurView
          intensity={dark ? 42 : 58}
          tint={dark ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />
        {/* specular highlight along the top edge — the "liquid" part of the glass */}
        <LinearGradient
          colors={
            dark
              ? ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.00)']
              : ['rgba(255, 255, 255, 0.50)', 'rgba(255, 255, 255, 0.00)']
          }
          locations={[0, 0.6]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />

        {barWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                width: Math.max(tabWidth - 14, 0),
                transform: [{ translateX }],
                backgroundColor: dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.70)',
                borderColor: dark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          />
        ) : null}

        <View style={styles.row}>
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const { options } = descriptors[route.key];
            const icon = options.tabBarIcon;
            const label = options.title ?? route.name;
            const color = focused ? theme.accent : theme.sub;
            return (
              <Pressable
                key={route.key}
                style={styles.tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!event.defaultPrevented) navigation.navigate(route.name);
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                android_ripple={{ borderless: true, radius: 26, color: theme.chipBg }}>
                {icon ? icon({ color, size: 22, focused }) : null}
                <Text style={[styles.label, { color }, focused && styles.labelFocused]} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  bar: {
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  pill: {
    position: 'absolute',
    left: 7,
    top: (BAR_HEIGHT - PILL_HEIGHT) / 2,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  labelFocused: {
    fontWeight: '800',
  },
});
