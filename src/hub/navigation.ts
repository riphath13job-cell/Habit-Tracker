import { createNavigationContainerRef } from '@react-navigation/native';

export type AppKey =
  | 'HomeApp'
  | 'HabitApp'
  | 'NotesApp'
  | 'TodoApp'
  | 'RoutinesApp'
  | 'FitnessApp'
  | 'SleepApp'
  | 'LucidApp'
  | 'BooksApp'
  | 'LooksmaxxingApp'
  | 'GamesApp'
  | 'LinksApp'
  | 'SettingsApp'
  | 'AiApp'
  | 'WaterApp'
  | 'EvolveApp'
  | 'FocusApp'
  | 'MoodApp'
  | 'SpendApp'
  | 'BusinessApp'
  | 'SyncApp';

export const navigationRef = createNavigationContainerRef<{
  Launcher: undefined;
  HomeApp: undefined;
  HabitApp: undefined;
  NotesApp: undefined;
  TodoApp: undefined;
  RoutinesApp: undefined;
  FitnessApp: undefined;
  SleepApp: undefined;
  LucidApp: undefined;
  BooksApp: undefined;
  LooksmaxxingApp: undefined;
  GamesApp: undefined;
  LinksApp: undefined;
  SettingsApp: undefined;
  AiApp: undefined;
  WaterApp: undefined;
  EvolveApp: undefined;
  FocusApp: undefined;
  MoodApp: undefined;
  SpendApp: undefined;
  BusinessApp: undefined;
  SyncApp: undefined;
}>();

/** Switch to a mini-app so that swiping back always lands on the launcher. */
export function switchToApp(key: AppKey) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 1,
      routes: [{ name: 'Launcher' }, { name: key }],
    });
  }
}
