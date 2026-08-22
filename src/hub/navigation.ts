import { createNavigationContainerRef } from '@react-navigation/native';

export type AppKey = 'HabitApp' | 'NotesApp';

export const navigationRef = createNavigationContainerRef<{
  Launcher: undefined;
  HabitApp: undefined;
  NotesApp: undefined;
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
