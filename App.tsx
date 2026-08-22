import React from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { LauncherScreen } from './src/screens/LauncherScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotesListScreen } from './src/screens/notes/NotesListScreen';
import { FavoritesScreen } from './src/screens/notes/FavoritesScreen';
import { TrashScreen } from './src/screens/notes/TrashScreen';
import { NoteEditorScreen } from './src/screens/notes/NoteEditorScreen';
import { GlassTabBar } from './src/components/GlassTabBar';
import { HubProvider } from './src/hub/HubContext';
import { navigationRef } from './src/hub/navigation';
import { configureNotifications } from './src/notifications';

configureNotifications();

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const NotesTab = createBottomTabNavigator();
const NotesStack = createNativeStackNavigator();

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: IconName, title: string): React.ComponentProps<typeof Tab.Screen>['options'] {
  return {
    title,
    tabBarIcon: ({ color, size }) => <MaterialIcons name={name} size={size} color={color} />,
  };
}

function HabitTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <Tab.Screen name="Today" component={TodayScreen} options={tabIcon('today', 'Today')} />
      <Tab.Screen name="Habits" component={HabitsScreen} options={tabIcon('list', 'Habits')} />
      <Tab.Screen name="Stats" component={StatsScreen} options={tabIcon('bar-chart', 'Stats')} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={tabIcon('settings', 'Settings')} />
    </Tab.Navigator>
  );
}

function NotesTabs() {
  return (
    <NotesTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <NotesTab.Screen
        name="NotesList"
        component={NotesListScreen}
        options={tabIcon('notes', 'Notes')}
      />
      <NotesTab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={tabIcon('star', 'Favorites')}
      />
      <NotesTab.Screen name="Trash" component={TrashScreen} options={tabIcon('delete', 'Trash')} />
    </NotesTab.Navigator>
  );
}

function NotesApp() {
  return (
    <NotesStack.Navigator screenOptions={{ headerShown: false }}>
      <NotesStack.Screen name="NotesTabs" component={NotesTabs} />
      <NotesStack.Screen name="NoteEditor" component={NoteEditorScreen} />
    </NotesStack.Navigator>
  );
}

export default function App() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return (
    <HubProvider>
      <NavigationContainer ref={navigationRef} theme={dark ? DarkTheme : DefaultTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Launcher" component={LauncherScreen} />
          <RootStack.Screen name="HabitApp" component={HabitTabs} />
          <RootStack.Screen name="NotesApp" component={NotesApp} />
        </RootStack.Navigator>
      </NavigationContainer>
    </HubProvider>
  );
}
