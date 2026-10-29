import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import EventDetailScreen from '../screens/event/EventDetailScreen';
import EditEventScreen from '../screens/event/EditEventScreen';
import AttendeesScreen from '../screens/event/AttendeesScreen';

const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} />
      <Stack.Screen name="Attendees" component={AttendeesScreen} />
    </Stack.Navigator>
  );
}
