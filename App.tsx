import React from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { TodayScreen } from './src/screens/TodayScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { configureNotifications } from './src/notifications';

configureNotifications();

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: IconName): React.ComponentProps<typeof Tab.Screen>['options'] {
  return {
    tabBarIcon: ({ color, size }) => <MaterialIcons name={name} size={size} color={color} />,
  };
}

export default function App() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return (
    <NavigationContainer theme={dark ? DarkTheme : DefaultTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}>
        <Tab.Screen name="Today" component={TodayScreen} options={tabIcon('today')} />
        <Tab.Screen name="Habits" component={HabitsScreen} options={tabIcon('list')} />
        <Tab.Screen name="Stats" component={StatsScreen} options={tabIcon('bar-chart')} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={tabIcon('settings')} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
