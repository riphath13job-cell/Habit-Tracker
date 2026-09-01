import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { LinkCategory } from '../../types';
import { createLink, getLink, updateLink } from '../../db';
import { useTheme } from '../../theme';
import { guessCategory, LINK_CATEGORIES } from '../../links/categories';

interface AddLinkParams {
  id?: number;
}

function withScheme(url: string): string {
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
}

export function AddLinkScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, AddLinkParams>, string>>();
  const editing = route.params?.id;

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<LinkCategory>('other');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      void getLink(editing).then((link) => {
        if (link) {
          setUrl(link.url);
          setTitle(link.title);
          setNote(link.note);
          setCategory(link.category);
          setCategoryTouched(true);
          setFavorite(link.favorite === 1);
        }
      });
    }
  }, [editing]);

  function onUrlChange(text: string) {
    setUrl(text);
    if (!categoryTouched) {
      setCategory(text.trim() ? guessCategory(text) : 'other');
    }
  }

  const canSave = url.trim() !== '' && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    const input = {
      url: withScheme(url),
      title: title.trim(),
      category,
      note: note.trim(),
      favorite,
    };
    try {
      if (editing) {
        await updateLink(editing, { ...input, favorite: favorite ? 1 : 0 });
      } else {
        await createLink(input);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Couldn’t save', 'Something went wrong saving that link.');
      setSaving(false);
    }
  }

  const singleColumn = useMemo(() => LINK_CATEGORIES, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{editing ? 'Edit link' : 'Save a link'}</Text>
        <View style={styles.headerSpacer} />
        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[
            styles.saveButton,
            { backgroundColor: theme.accent },
            !canSave && { opacity: 0.4 },
          ]}>
          <Text style={styles.saveText}>{saving ? '…' : 'Save'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <Field label="URL">
            <View style={[styles.inputWrap, { backgroundColor: theme.card }]}>
              <TextInput
                value={url}
                onChangeText={onUrlChange}
                placeholder="https://example.com"
                placeholderTextColor={theme.sub}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </Field>

          <Field label="Title (optional)">
            <View style={[styles.inputWrap, { backgroundColor: theme.card }]}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Page title"
                placeholderTextColor={theme.sub}
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </Field>

          <Field label="Category">
            <View style={styles.cats}>
              {singleColumn.map((c) => {
                const active = category === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setCategory(c.id);
                      setCategoryTouched(true);
                    }}
                    style={[
                      styles.catBtn,
                      active
                        ? { backgroundColor: c.color, borderColor: c.color }
                        : { backgroundColor: theme.card, borderColor: 'transparent' },
                    ]}>
                    <Icon name={c.icon} size={15} color={active ? '#FFFFFF' : c.color} />
                    <Text style={[styles.catLabel, { color: active ? '#FFFFFF' : theme.text }]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: theme.sub }]}>
              {categoryTouched
                ? 'Category chosen by you.'
                : 'Auto-guessed from the URL — pick a different one whenever you like.'}
            </Text>
          </Field>

          <Field label="Note (optional)">
            <View style={[styles.inputWrap, styles.noteWrap, { backgroundColor: theme.card }]}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Why save this?"
                placeholderTextColor={theme.sub}
                multiline
                style={[styles.input, styles.noteInput, { color: theme.text }]}
              />
            </View>
          </Field>

          <Pressable
            onPress={() => setFavorite((f) => !f)}
            style={[styles.favRow, { backgroundColor: theme.card }]}>
            <Icon name={favorite ? 'star' : 'star-border'} size={20} color={favorite ? '#F59E0B' : theme.sub} />
            <Text style={[styles.favLabel, { color: theme.text }]}>Mark as favorite</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  headerSpacer: {
    width: 0,
  },
  saveButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.7,
    color: '#888888',
  },
  inputWrap: {
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 15,
    paddingVertical: 12,
  },
  noteWrap: {
    minHeight: 90,
  },
  noteInput: {
    minHeight: 66,
    textAlignVertical: 'top',
  },
  cats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
  },
  favLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});