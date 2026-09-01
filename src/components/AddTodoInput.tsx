import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '../icons';
import { useTheme } from '../theme';

export function AddTodoInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Add a task…',
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.sub}
        style={[styles.input, { color: theme.text }]}
        maxLength={200}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
      />
      <Pressable onPress={onSubmit} style={[styles.add, { backgroundColor: theme.accent }]}>
        <Icon name="add" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 20,
    paddingLeft: 14,
    paddingRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  add: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
