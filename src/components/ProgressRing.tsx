import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export function ProgressRing({
  size,
  stroke,
  progress,
  label,
  sub,
  color,
  trackColor,
  textColor,
}: {
  size: number;
  stroke: number;
  progress: number;
  label: string;
  sub?: string;
  color: string;
  trackColor: string;
  textColor: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference * clamped} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.label, { color: textColor, fontSize: Math.round(size / 5) }]}>
        {label}
      </Text>
      {sub ? <Text style={[styles.sub, { color: textColor }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
  sub: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});
