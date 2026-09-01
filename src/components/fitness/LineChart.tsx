import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

export interface ChartPoint {
  label: string;
  value: number;
}

export function LineChart({
  points,
  color,
  height = 150,
}: {
  points: ChartPoint[];
  color: string;
  height?: number;
}) {
  const [width, setWidth] = useState(0);

  if (points.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Add at least two entries to see the trend.</Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padX = 10;
  const padY = 18;
  const span = max - min || 1;
  const w = Math.max(width - padX * 2, 1);
  const h = height - padY * 2;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * w;
    const y = padY + h - ((p.value - min) / span) * h;
    return { x, y, ...p };
  });
  const lineStr = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const last = coords[coords.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg width={width} height={height}>
        <Line x1={padX} y1={padY + h} x2={padX + w} y2={padY + h} stroke="#00000022" strokeWidth={1} />
        <Polyline
          points={lineStr}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={3} fill={color} />
        ))}
        <Circle cx={last.x} cy={last.y} r={5} fill={color} stroke="#FFFFFF" strokeWidth={2} />
      </Svg>
      <View style={styles.axisRow}>
        <Text style={styles.axisText}>{points[0].label}</Text>
        <Text style={styles.axisText}>{max === min ? '' : `min ${min}`}</Text>
        <Text style={styles.axisText}>{last.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.6,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  axisText: {
    fontSize: 10.5,
    opacity: 0.55,
  },
});
