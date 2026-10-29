import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { favoriteService } from '../../services/otherServices';
import EventCard from '../../components/EventCard';
import EmptyState from '../../components/EmptyState';
import { spacing, fontSize } from '../../constants/theme';

export default function SavedEventsScreen({ navigation }) {
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await favoriteService.getFavorites();
      setEvents(res.events);
    } catch (err) {
      // Keep prior list on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh whenever screen regains focus (e.g. after unsaving an event elsewhere)
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Saved Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={
            <EmptyState icon="heart-outline" title="No saved events" message="Tap the heart icon on any event to save it here." />
          }
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { eventId: item._id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
});
