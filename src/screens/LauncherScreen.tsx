import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { APPS, AppTileButton } from '../hub/apps';
import { useTheme } from '../theme';

/** Home-screen-style launcher: the hub of the little app collection. */
export function LauncherScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={styles.brandIcon} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>My Apps</Text>
            <Text style={[styles.subtitle, { color: theme.sub }]}>Your personal mini-apps</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {APPS.map((app) => (
            <AppTileButton
              key={app.key}
              app={app}
              size={82}
              onPress={() => navigation.navigate(app.key)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
    marginTop: 12,
  },
  brandIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
  },
});
