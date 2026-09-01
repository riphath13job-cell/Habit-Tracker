import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../icons';
import { useTheme } from '../../theme';

/** 1-5 star rating. Pass onPress (via onChange) to make it editable. */
export function RatingStars({
  value,
  size = 18,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          disabled={!onChange}
          onPress={() => onChange?.(star === value ? 0 : star)}
          hitSlop={5}
          style={!onChange ? styles.static : undefined}>
          <Icon
            name={star <= value ? 'star' : 'star-border'}
            size={size}
            color={star <= value ? '#F59E0B' : theme.sub}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  static: {
    opacity: 1,
  },
});