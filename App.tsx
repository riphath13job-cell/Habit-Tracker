import React from 'react';
import { useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon, IconName } from './src/icons';
import { LauncherScreen } from './src/screens/LauncherScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotesListScreen } from './src/screens/notes/NotesListScreen';
import { FavoritesScreen } from './src/screens/notes/FavoritesScreen';
import { TrashScreen } from './src/screens/notes/TrashScreen';
import { NoteEditorScreen } from './src/screens/notes/NoteEditorScreen';
import { QuickListScreen } from './src/screens/todos/QuickListScreen';
import { CollectionsScreen } from './src/screens/todos/CollectionsScreen';
import { CollectionDetailScreen } from './src/screens/todos/CollectionDetailScreen';
import { ScheduledScreen } from './src/screens/todos/ScheduledScreen';
import { RoutinesHomeScreen } from './src/screens/routines/RoutinesHomeScreen';
import { RoutineDetailScreen } from './src/screens/routines/RoutineDetailScreen';
import { TrainScreen } from './src/screens/fitness/TrainScreen';
import { ActiveWorkoutScreen } from './src/screens/fitness/ActiveWorkoutScreen';
import { HistoryScreen } from './src/screens/fitness/HistoryScreen';
import { WorkoutDetailScreen } from './src/screens/fitness/WorkoutDetailScreen';
import { BodyScreen } from './src/screens/fitness/BodyScreen';
import { MusclesScreen } from './src/screens/fitness/MusclesScreen';
import { MuscleDetailScreen } from './src/screens/fitness/MuscleDetailScreen';
import { ExerciseBookScreen } from './src/screens/fitness/ExerciseBookScreen';
import { ExerciseDetailScreen } from './src/screens/fitness/ExerciseDetailScreen';
import { BookListScreen } from './src/screens/books/BookListScreen';
import { BooksNotesScreen } from './src/screens/books/BooksNotesScreen';
import { BookNoteEditorScreen } from './src/screens/books/BookNoteEditorScreen';
import { BookDetailScreen } from './src/screens/books/BookDetailScreen';
import { StudyScreen } from './src/screens/looksmaxxing/StudyScreen';
import { MethodDetailScreen } from './src/screens/looksmaxxing/MethodDetailScreen';
import { TemplatesScreen } from './src/screens/looksmaxxing/TemplatesScreen';
import { TemplateDetailScreen } from './src/screens/looksmaxxing/TemplateDetailScreen';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { SleepScreen } from './src/screens/sleep/SleepScreen';
import { WaterScreen } from './src/screens/water/WaterScreen';
import { WaterStatsScreen } from './src/screens/water/WaterStatsScreen';
import { WaterChallengesScreen } from './src/screens/water/WaterChallengesScreen';
import { WaterSettingsScreen } from './src/screens/water/WaterSettingsScreen';
import { FocusTimerScreen } from './src/screens/focus/FocusTimerScreen';
import { FocusStatsScreen } from './src/screens/focus/FocusStatsScreen';
import { FocusSettingsScreen } from './src/screens/focus/FocusSettingsScreen';
import { MoodScreen } from './src/screens/mood/MoodScreen';
import { MoodStatsScreen } from './src/screens/mood/MoodStatsScreen';
import { SpendScreen } from './src/screens/spend/SpendScreen';
import { SpendStatsScreen } from './src/screens/spend/SpendStatsScreen';
import { BudgetSettingsScreen } from './src/screens/spend/BudgetSettingsScreen';
import { BusinessHomeScreen } from './src/screens/business/BusinessHomeScreen';
import { SalesScreen } from './src/screens/business/SalesScreen';
import { CustomersScreen } from './src/screens/business/CustomersScreen';
import { CustomerDetailScreen } from './src/screens/business/CustomerDetailScreen';
import { ProductsScreen } from './src/screens/business/ProductsScreen';
import { BusinessStatsScreen } from './src/screens/business/BusinessStatsScreen';
import { AddSaleScreen } from './src/screens/business/AddSaleScreen';
import { BusinessSettingsScreen } from './src/screens/business/BusinessSettingsScreen';
import { EvolveDashboardScreen } from './src/screens/evolve/EvolveDashboardScreen';
import { EvolvePerformScreen } from './src/screens/evolve/EvolvePerformScreen';
import { EvolveHabitsScreen } from './src/screens/evolve/EvolveHabitsScreen';
import { EvolveProfileScreen } from './src/screens/evolve/EvolveProfileScreen';
import { LearnScreen } from './src/screens/lucid/LearnScreen';
import { TechniqueDetailScreen } from './src/screens/lucid/TechniqueDetailScreen';
import { JournalScreen } from './src/screens/lucid/JournalScreen';
import { ChecksScreen } from './src/screens/lucid/ChecksScreen';
import { GamesHomeScreen } from './src/screens/games/GamesHomeScreen';
import { Game2048Screen } from './src/screens/games/Game2048Screen';
import { SnakeScreen } from './src/screens/games/SnakeScreen';
import { MinesweeperScreen } from './src/screens/games/MinesweeperScreen';
import { MemoryMatchScreen } from './src/screens/games/MemoryMatchScreen';
import { TicTacToeScreen } from './src/screens/games/TicTacToeScreen';
import { ReactionTapScreen } from './src/screens/games/ReactionTapScreen';
import { SudokuScreen } from './src/screens/games/SudokuScreen';
import { FifteenPuzzleScreen } from './src/screens/games/FifteenPuzzleScreen';
import { MastermindScreen } from './src/screens/games/MastermindScreen';
import { LinksScreen } from './src/screens/links/LinksScreen';
import { CategoriesScreen } from './src/screens/links/CategoriesScreen';
import { AddLinkScreen } from './src/screens/links/AddLinkScreen';
import { AiAssistantScreen } from './src/screens/ai/AiAssistantScreen';
import { AiConfigScreen } from './src/screens/ai/AiConfigScreen';
import { AiUsageScreen } from './src/screens/ai/AiUsageScreen';
import { SyncScreen } from './src/screens/sync/SyncScreen';
import { initSync } from './src/sync';
import { GlassTabBar } from './src/components/GlassTabBar';
import { DesktopFrame } from './src/components/DesktopFrame';
import { HubProvider } from './src/hub/HubContext';
import { navigationRef } from './src/hub/navigation';
import { ThemeProvider, resolveIsDark, useThemeSettings } from './src/theme';
import { IconStyleProvider } from './src/icons';
import { configureNotifications } from './src/notifications';

configureNotifications();
void initSync();

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const NotesTab = createBottomTabNavigator();
const NotesStack = createNativeStackNavigator();
const TodoTab = createBottomTabNavigator();
const TodoStack = createNativeStackNavigator();
const RoutineTab = createBottomTabNavigator();
const RoutineStack = createNativeStackNavigator();
const FitnessTab = createBottomTabNavigator();
const FitnessStack = createNativeStackNavigator();
const SleepTab = createBottomTabNavigator();
const SleepStack = createNativeStackNavigator();
const WaterTab = createBottomTabNavigator();
const WaterStack = createNativeStackNavigator();
const FocusTab = createBottomTabNavigator();
const FocusStack = createNativeStackNavigator();
const MoodTab = createBottomTabNavigator();
const MoodStack = createNativeStackNavigator();
const SpendTab = createBottomTabNavigator();
const SpendStack = createNativeStackNavigator();
const EvolveTab = createBottomTabNavigator();
const EvolveStack = createNativeStackNavigator();
const LucidTab = createBottomTabNavigator();
const LucidStack = createNativeStackNavigator();
const BookTab = createBottomTabNavigator();
const BookStack = createNativeStackNavigator();
const LooksmaxTab = createBottomTabNavigator();
const LooksmaxStack = createNativeStackNavigator();
const GamesStack = createNativeStackNavigator();
const LinksTab = createBottomTabNavigator();
const LinksStack = createNativeStackNavigator();
const SettingsTab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();
const BusinessTab = createBottomTabNavigator();
const BusinessStack = createNativeStackNavigator();
const AiStack = createNativeStackNavigator();
const SyncStack = createNativeStackNavigator();

function tabIcon(name: IconName, title: string): React.ComponentProps<typeof Tab.Screen>['options'] {
  return {
    title,
    tabBarIcon: ({ color, size }) => <Icon name={name} size={size} color={color} />,
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

function TodoTabs() {
  return (
    <TodoTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <TodoTab.Screen name="QuickList" component={QuickListScreen} options={tabIcon('bolt', 'Quick')} />
      <TodoTab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={tabIcon('category', 'Lists')}
      />
      <TodoTab.Screen
        name="Scheduled"
        component={ScheduledScreen}
        options={tabIcon('schedule', 'Scheduled')}
      />
    </TodoTab.Navigator>
  );
}

function TodoApp() {
  return (
    <TodoStack.Navigator screenOptions={{ headerShown: false }}>
      <TodoStack.Screen name="TodoTabs" component={TodoTabs} />
      <TodoStack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
    </TodoStack.Navigator>
  );
}

function RoutineTabs() {
  return (
    <RoutineTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <RoutineTab.Screen
        name="RoutinesHome"
        component={RoutinesHomeScreen}
        options={tabIcon('sync', 'Routines')}
      />
    </RoutineTab.Navigator>
  );
}

function RoutinesApp() {
  return (
    <RoutineStack.Navigator screenOptions={{ headerShown: false }}>
      <RoutineStack.Screen name="RoutineTabs" component={RoutineTabs} />
      <RoutineStack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
    </RoutineStack.Navigator>
  );
}

function FitnessTabs() {
  return (
    <FitnessTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <FitnessTab.Screen
        name="Train"
        component={TrainScreen}
        options={tabIcon('fitness-center', 'Train')}
      />
      <FitnessTab.Screen
        name="History"
        component={HistoryScreen}
        options={tabIcon('history', 'History')}
      />
      <FitnessTab.Screen name="Body" component={BodyScreen} options={tabIcon('monitor-weight', 'Body')} />
      <FitnessTab.Screen
        name="Muscles"
        component={MusclesScreen}
        options={tabIcon('accessibility-new', 'Muscles')}
      />
    </FitnessTab.Navigator>
  );
}

function FitnessApp() {
  return (
    <FitnessStack.Navigator screenOptions={{ headerShown: false }}>
      <FitnessStack.Screen name="FitnessTabs" component={FitnessTabs} />
      <FitnessStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <FitnessStack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <FitnessStack.Screen name="MuscleDetail" component={MuscleDetailScreen} />
      <FitnessStack.Screen name="ExerciseBook" component={ExerciseBookScreen} />
      <FitnessStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
    </FitnessStack.Navigator>
  );
}

function SleepTabs() {
  return (
    <SleepTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <SleepTab.Screen
        name="SleepHome"
        component={SleepScreen}
        options={tabIcon('bedtime', 'Sleep')}
      />
    </SleepTab.Navigator>
  );
}

function SleepApp() {
  return (
    <SleepStack.Navigator screenOptions={{ headerShown: false }}>
      <SleepStack.Screen name="SleepTabs" component={SleepTabs} />
    </SleepStack.Navigator>
  );
}

function WaterTabs() {
  return (
    <WaterTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <WaterTab.Screen name="WaterHome" component={WaterScreen} options={tabIcon('water', 'Today')} />
      <WaterTab.Screen
        name="WaterStats"
        component={WaterStatsScreen}
        options={tabIcon('bar-chart', 'Stats')}
      />
      <WaterTab.Screen
        name="WaterChallenges"
        component={WaterChallengesScreen}
        options={tabIcon('emoji-events', 'Challenges')}
      />
    </WaterTab.Navigator>
  );
}

function WaterApp() {
  return (
    <WaterStack.Navigator screenOptions={{ headerShown: false }}>
      <WaterStack.Screen name="WaterTabs" component={WaterTabs} />
      <WaterStack.Screen name="WaterSettings" component={WaterSettingsScreen} />
    </WaterStack.Navigator>
  );
}

function FocusTabs() {
  return (
    <FocusTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <FocusTab.Screen name="FocusHome" component={FocusTimerScreen} options={tabIcon('alarm', 'Timer')} />
      <FocusTab.Screen
        name="FocusStats"
        component={FocusStatsScreen}
        options={tabIcon('bar-chart', 'Stats')}
      />
    </FocusTab.Navigator>
  );
}

function FocusApp() {
  return (
    <FocusStack.Navigator screenOptions={{ headerShown: false }}>
      <FocusStack.Screen name="FocusTabs" component={FocusTabs} />
      <FocusStack.Screen name="FocusSettings" component={FocusSettingsScreen} />
    </FocusStack.Navigator>
  );
}

function MoodTabs() {
  return (
    <MoodTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <MoodTab.Screen name="MoodHome" component={MoodScreen} options={tabIcon('favorite', 'Today')} />
      <MoodTab.Screen name="MoodStats" component={MoodStatsScreen} options={tabIcon('bar-chart', 'Stats')} />
    </MoodTab.Navigator>
  );
}

function MoodApp() {
  return (
    <MoodStack.Navigator screenOptions={{ headerShown: false }}>
      <MoodStack.Screen name="MoodTabs" component={MoodTabs} />
    </MoodStack.Navigator>
  );
}

function SpendTabs() {
  return (
    <SpendTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <SpendTab.Screen name="SpendHome" component={SpendScreen} options={tabIcon('shopping-cart', 'Today')} />
      <SpendTab.Screen name="SpendStats" component={SpendStatsScreen} options={tabIcon('bar-chart', 'Stats')} />
    </SpendTab.Navigator>
  );
}

function SpendApp() {
  return (
    <SpendStack.Navigator screenOptions={{ headerShown: false }}>
      <SpendStack.Screen name="SpendTabs" component={SpendTabs} />
      <SpendStack.Screen name="BudgetSettings" component={BudgetSettingsScreen} />
    </SpendStack.Navigator>
  );
}

function EvolveTabs() {
  return (
    <EvolveTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <EvolveTab.Screen name="EvolveHome" component={EvolveDashboardScreen} options={tabIcon('bolt', 'Home')} />
      <EvolveTab.Screen
        name="EvolveHabitsTab"
        component={EvolveHabitsScreen}
        options={tabIcon('list', 'Routine')}
      />
      <EvolveTab.Screen
        name="EvolvePerformTab"
        component={EvolvePerformScreen}
        options={tabIcon('bar-chart', 'Performance')}
      />
      <EvolveTab.Screen
        name="EvolveProfileTab"
        component={EvolveProfileScreen}
        options={tabIcon('emoji-events', 'Profile')}
      />
    </EvolveTab.Navigator>
  );
}

function EvolveApp() {
  return (
    <EvolveStack.Navigator screenOptions={{ headerShown: false }}>
      <EvolveStack.Screen name="EvolveTabs" component={EvolveTabs} />
    </EvolveStack.Navigator>
  );
}

function LucidTabs() {
  return (
    <LucidTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <LucidTab.Screen name="Learn" component={LearnScreen} options={tabIcon('school', 'Learn')} />
      <LucidTab.Screen
        name="Journal"
        component={JournalScreen}
        options={tabIcon('auto-stories', 'Journal')}
      />
      <LucidTab.Screen
        name="Checks"
        component={ChecksScreen}
        options={tabIcon('notifications', 'Checks')}
      />
    </LucidTab.Navigator>
  );
}

function LucidApp() {
  return (
    <LucidStack.Navigator screenOptions={{ headerShown: false }}>
      <LucidStack.Screen name="LucidTabs" component={LucidTabs} />
      <LucidStack.Screen name="TechniqueDetail" component={TechniqueDetailScreen} />
    </LucidStack.Navigator>
  );
}

function BooksTabs() {
  return (
    <BookTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <BookTab.Screen
        name="Reading"
        component={BookListScreen}
        initialParams={{ status: 'reading', title: 'Now Reading' }}
        options={tabIcon('auto-stories', 'Reading')}
      />
      <BookTab.Screen
        name="Read"
        component={BookListScreen}
        initialParams={{ status: 'finished', title: 'Read' }}
        options={tabIcon('check-circle', 'Read')}
      />
      <BookTab.Screen
        name="Wishlist"
        component={BookListScreen}
        initialParams={{ status: 'wishlist', title: 'Want to Read' }}
        options={tabIcon('favorite', 'Want')}
      />
      <BookTab.Screen
        name="Notes"
        component={BooksNotesScreen}
        options={tabIcon('edit-note', 'Notes')}
      />
    </BookTab.Navigator>
  );
}

function BooksApp() {
  return (
    <BookStack.Navigator screenOptions={{ headerShown: false }}>
      <BookStack.Screen name="BooksTabs" component={BooksTabs} />
      <BookStack.Screen name="BookDetail" component={BookDetailScreen} />
      <BookStack.Screen name="BookNoteEditor" component={BookNoteEditorScreen} />
    </BookStack.Navigator>
  );
}

function LooksmaxTabs() {
  return (
    <LooksmaxTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <LooksmaxTab.Screen name="Study" component={StudyScreen} options={tabIcon('school', 'Study')} />
      <LooksmaxTab.Screen
        name="Templates"
        component={TemplatesScreen}
        options={tabIcon('widgets', 'Templates')}
      />
    </LooksmaxTab.Navigator>
  );
}

function LooksmaxxingApp() {
  return (
    <LooksmaxStack.Navigator screenOptions={{ headerShown: false }}>
      <LooksmaxStack.Screen name="LooksmaxTabs" component={LooksmaxTabs} />
      <LooksmaxStack.Screen name="MethodDetail" component={MethodDetailScreen} />
      <LooksmaxStack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
    </LooksmaxStack.Navigator>
  );
}

function GamesApp() {
  return (
    <GamesStack.Navigator screenOptions={{ headerShown: false }}>
      <GamesStack.Screen name="GamesHome" component={GamesHomeScreen} />
      <GamesStack.Screen name="Game2048" component={Game2048Screen} />
      <GamesStack.Screen name="Snake" component={SnakeScreen} />
      <GamesStack.Screen name="Minesweeper" component={MinesweeperScreen} />
      <GamesStack.Screen name="MemoryMatch" component={MemoryMatchScreen} />
      <GamesStack.Screen name="TicTacToe" component={TicTacToeScreen} />
      <GamesStack.Screen name="ReactionTap" component={ReactionTapScreen} />
      <GamesStack.Screen name="Sudoku" component={SudokuScreen} />
      <GamesStack.Screen name="FifteenPuzzle" component={FifteenPuzzleScreen} />
      <GamesStack.Screen name="Mastermind" component={MastermindScreen} />
    </GamesStack.Navigator>
  );
}

function LinksTabs() {
  return (
    <LinksTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <LinksTab.Screen
        name="All"
        component={LinksScreen}
        initialParams={{ favoriteOnly: false, title: 'Links' }}
        options={tabIcon('link', 'All')}
      />
      <LinksTab.Screen
        name="Favorites"
        component={LinksScreen}
        initialParams={{ favoriteOnly: true, title: 'Favorites' }}
        options={tabIcon('star', 'Favorites')}
      />
      <LinksTab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={tabIcon('widgets', 'Categories')}
      />
    </LinksTab.Navigator>
  );
}

function LinksApp() {
  return (
    <LinksStack.Navigator screenOptions={{ headerShown: false }}>
      <LinksStack.Screen name="LinksTabs" component={LinksTabs} />
      <LinksStack.Screen name="AddLink" component={AddLinkScreen} />
      <LinksStack.Screen name="LinksCategory" component={LinksScreen} />
    </LinksStack.Navigator>
  );
}

function SettingsTabs() {
  return (
    <SettingsTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <SettingsTab.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={tabIcon('settings', 'Settings')}
      />
    </SettingsTab.Navigator>
  );
}

function SettingsApp() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsTabs" component={SettingsTabs} />
    </SettingsStack.Navigator>
  );
}

function BusinessTabs() {
  return (
    <BusinessTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}>
      <BusinessTab.Screen
        name="BusinessHome"
        component={BusinessHomeScreen}
        options={tabIcon('bar-chart', 'Home')}
      />
      <BusinessTab.Screen name="Sales" component={SalesScreen} options={tabIcon('shopping-cart', 'Sales')} />
      <BusinessTab.Screen
        name="Customers"
        component={CustomersScreen}
        options={tabIcon('people', 'Customers')}
      />
    </BusinessTab.Navigator>
  );
}

function BusinessApp() {
  return (
    <BusinessStack.Navigator screenOptions={{ headerShown: false }}>
      <BusinessStack.Screen name="BusinessTabs" component={BusinessTabs} />
      <BusinessStack.Screen name="BusinessCustomerDetail" component={CustomerDetailScreen} />
      <BusinessStack.Screen name="BusinessProducts" component={ProductsScreen} />
      <BusinessStack.Screen name="BusinessStats" component={BusinessStatsScreen} />
      <BusinessStack.Screen name="BusinessAddSale" component={AddSaleScreen} />
      <BusinessStack.Screen name="BusinessSettings" component={BusinessSettingsScreen} />
    </BusinessStack.Navigator>
  );
}

function AiApp() {
  return (
    <AiStack.Navigator screenOptions={{ headerShown: false }}>
      <AiStack.Screen name="AiChat" component={AiAssistantScreen} />
      <AiStack.Screen name="AiConfig" component={AiConfigScreen} />
      <AiStack.Screen name="AiUsage" component={AiUsageScreen} />
    </AiStack.Navigator>
  );
}

function SyncApp() {
  return (
    <SyncStack.Navigator screenOptions={{ headerShown: false }}>
      <SyncStack.Screen name="SyncHome" component={SyncScreen} />
    </SyncStack.Navigator>
  );
}

function Root() {
  const { isDark } = useThemeSettings();
  const { width } = useWindowDimensions();
  // Desktop opens straight into the Home dashboard; phones open on the launcher.
  const initialRoute = width > 640 ? 'HomeApp' : 'Launcher';
  return (
    <DesktopFrame>
      <NavigationContainer ref={navigationRef} theme={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootStack.Navigator initialRouteName={initialRoute as never} screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Launcher" component={LauncherScreen} />
        <RootStack.Screen name="HomeApp" component={HomeScreen} />
        <RootStack.Screen name="HabitApp" component={HabitTabs} />
        <RootStack.Screen name="NotesApp" component={NotesApp} />
        <RootStack.Screen name="TodoApp" component={TodoApp} />
        <RootStack.Screen name="RoutinesApp" component={RoutinesApp} />
        <RootStack.Screen name="FitnessApp" component={FitnessApp} />
        <RootStack.Screen name="SleepApp" component={SleepApp} />
        <RootStack.Screen name="WaterApp" component={WaterApp} />
        <RootStack.Screen name="FocusApp" component={FocusApp} />
        <RootStack.Screen name="MoodApp" component={MoodApp} />
        <RootStack.Screen name="SpendApp" component={SpendApp} />
        <RootStack.Screen name="BusinessApp" component={BusinessApp} />
        <RootStack.Screen name="EvolveApp" component={EvolveApp} />
        <RootStack.Screen name="LucidApp" component={LucidApp} />
        <RootStack.Screen name="BooksApp" component={BooksApp} />
        <RootStack.Screen name="LooksmaxxingApp" component={LooksmaxxingApp} />
        <RootStack.Screen name="GamesApp" component={GamesApp} />
        <RootStack.Screen name="LinksApp" component={LinksApp} />
        <RootStack.Screen name="SettingsApp" component={SettingsApp} />
        <RootStack.Screen name="AiApp" component={AiApp} />
        <RootStack.Screen name="SyncApp" component={SyncApp} />
      </RootStack.Navigator>
      </NavigationContainer>
    </DesktopFrame>
  );
}

export default function App() {
  return (
    <IconStyleProvider>
      <ThemeProvider>
        <HubProvider>
          <Root />
        </HubProvider>
      </ThemeProvider>
    </IconStyleProvider>
  );
}
