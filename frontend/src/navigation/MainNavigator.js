import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import ChildLogScreen from '../screens/ChildLog/ChildLogScreen';
import AddLogScreen from '../screens/ChildLog/AddLogScreen';
import ExpensesScreen from '../screens/Expenses/ExpensesScreen';
import AddExpenseScreen from '../screens/Expenses/AddExpenseScreen';
import MessagesScreen from '../screens/Messages/MessagesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CoupleSetupScreen from '../screens/Couple/CoupleSetupScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CalStack = createNativeStackNavigator();
const LogStack = createNativeStackNavigator();
const ExpStack = createNativeStackNavigator();

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="CoupleSetup" component={CoupleSetupScreen} />
    </HomeStack.Navigator>
  );
}

function CalendarStackNav() {
  return (
    <CalStack.Navigator screenOptions={{ headerShown: false }}>
      <CalStack.Screen name="CalendarScreen" component={CalendarScreen} />
    </CalStack.Navigator>
  );
}

function ChildLogStackNav() {
  return (
    <LogStack.Navigator screenOptions={{ headerShown: false }}>
      <LogStack.Screen name="ChildLogScreen" component={ChildLogScreen} />
      <LogStack.Screen name="AddLog" component={AddLogScreen} />
    </LogStack.Navigator>
  );
}

function ExpensesStackNav() {
  return (
    <ExpStack.Navigator screenOptions={{ headerShown: false }}>
      <ExpStack.Screen name="ExpensesScreen" component={ExpensesScreen} />
      <ExpStack.Screen name="AddExpense" component={AddExpenseScreen} />
    </ExpStack.Navigator>
  );
}

const tabConfig = [
  { name: 'HomeTab', component: HomeStackNav, label: 'Home', icon: 'home' },
  { name: 'CalendarTab', component: CalendarStackNav, label: 'Calendar', icon: 'calendar' },
  { name: 'ChildLogTab', component: ChildLogStackNav, label: 'Child Log', icon: 'journal' },
  { name: 'ExpensesTab', component: ExpensesStackNav, label: 'Expenses', icon: 'card' },
  { name: 'MessagesTab', component: MessagesScreen, label: 'Messages', icon: 'chatbubbles' },
  { name: 'ProfileTab', component: ProfileScreen, label: 'Profile', icon: 'person' },
];

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused, size }) => {
          const cfg = tabConfig.find((t) => t.name === route.name);
          const iconName = focused ? cfg.icon : `${cfg.icon}-outline`;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      {tabConfig.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ tabBarLabel: t.label }} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 85 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...shadow.md,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
});
