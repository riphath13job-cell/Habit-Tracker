import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { isWeb } from '../platform';
import { useTheme } from '../theme';

export type PickerProps = {
  value: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  /** 'time' (HH:MM) or 'date' (YYYY-MM-DD). */
  mode: 'time' | 'date';
  minimumDate?: Date;
  maximumDate?: Date;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Cross-platform date/time picker. On native it renders the OS picker
 * (expo/@react-native-community datetimepicker); on web it falls back to a
 * small text stepper because the native picker has no web implementation.
 */
export function PlatformDateTimePicker({
  value,
  onChange,
  mode,
  minimumDate,
  maximumDate,
}: PickerProps) {
  const theme = useTheme();

  if (!isWeb) {
    return <DateTimePicker mode={mode} value={value} onChange={onChange} />;
  }

  const shade =
    (v: Date, delta: number): Date => {
      const d = new Date(v);
      if (mode === 'time') d.setMinutes(d.getMinutes() + delta);
      else d.setDate(d.getDate() + delta);
      return d;
    };

  function commit(d: Date) {
    if (minimumDate && d < minimumDate) d = new Date(minimumDate);
    if (maximumDate && d > maximumDate) d = new Date(maximumDate);
    const event: DateTimePickerEvent = {
      type: 'set',
      nativeEvent: { timestamp: d.getTime(), utcOffset: d.getTimezoneOffset() * -1 },
    };
    onChange(event, d);
  }

  const stepUnit = mode === 'time' ? 15 : 1;
  const display =
    mode === 'time'
      ? `${pad(value.getHours())}:${pad(value.getMinutes())}`
      : toIso(value);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => commit(shade(value, -stepUnit))}
        hitSlop={8}
        style={[styles.btn, { borderColor: theme.border }]}>
        <Text style={[styles.btnText, { color: theme.sub }]}>−</Text>
      </Pressable>
      <View style={[styles.display, { backgroundColor: theme.chipBg }]}>
        <Text style={[styles.value, { color: theme.text }]}>{display}</Text>
      </View>
      <Pressable
        onPress={() => commit(shade(value, stepUnit))}
        hitSlop={8}
        style={[styles.btn, { borderColor: theme.border }]}>
        <Text style={[styles.btnText, { color: theme.sub }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  display: {
    minWidth: 90,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
