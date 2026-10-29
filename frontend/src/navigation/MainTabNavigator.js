import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import HomeStackNavigator from './HomeStackNavigator';
import SearchScreen from '../screens/home/SearchScreen';
import MapScreen from '../screens/home/MapScreen';
import CreateEventScreen from '../screens/event/CreateEventScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

const ICONS = {
  HomeTab: 'home',
  SearchTab: 'search',
  MapTab: 'map',
  CreateTab: 'add-circle',
  ProfileTab: 'person',
};

export default function MainTabNavigator() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const canCreateEvents = user?.role === 'organizer' || user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={`${ICONS[route.name]}${focused ? '' : '-outline'}`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="MapTab" component={MapScreen} options={{ title: 'Map' }} />
      {canCreateEvents && (
        <Tab.Screen name="CreateTab" component={CreateEventScreen} options={{ title: 'Create' }} />
      )}
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
