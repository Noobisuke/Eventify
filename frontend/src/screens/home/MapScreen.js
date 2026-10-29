import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLocation } from '../../hooks/useLocation';
import { eventService } from '../../services/eventService';
import LeafletMap from '../../components/LeafletMap';
import EventCard from '../../components/EventCard';
import { spacing, fontSize, radius } from '../../constants/theme';

export default function MapScreen({ navigation }) {
  const { theme } = useTheme();
  const { coords, isLoading: locationLoading, requestLocation, permissionDenied } = useLocation();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const loadNearbyEvents = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await eventService.getEvents({
        lat: coords.latitude,
        lng: coords.longitude,
        distance: 30000,
        limit: 50,
      });
      setEvents(res.events);
    } catch (err) {
      // Surface the failure instead of silently looking like "0 events nearby" -
      // a bad geo query and a genuinely empty area should not look identical.
      console.warn('Failed to load nearby events:', err.message);
      setLoadError(err.response?.data?.message || err.message || 'Could not load nearby events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    loadNearbyEvents();
  }, [loadNearbyEvents]);

  const markers = events
    .filter((e) => e.location?.coordinates)
    .map((e) => ({
      id: e._id,
      latitude: e.location.coordinates[1],
      longitude: e.location.coordinates[0],
      title: e.title,
    }));

  const handleMarkerPress = (eventId) => {
    const event = events.find((e) => e._id === eventId);
    setSelectedEvent(event || null);
  };

  if (locationLoading || !coords) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={{ color: theme.colors.textSecondary, marginTop: spacing.md }}>Locating you...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LeafletMap center={coords} markers={markers} onMarkerPress={handleMarkerPress} />

      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <Text style={[styles.title, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}>
          {loading ? 'Loading nearby events...' : loadError ? `⚠️ ${loadError}` : `${events.length} events nearby`}
        </Text>
      </SafeAreaView>

      <TouchableOpacity
        style={[styles.locateButton, { backgroundColor: theme.colors.surface }]}
        onPress={requestLocation}
      >
        <Ionicons name="locate" size={22} color={theme.colors.primary} />
      </TouchableOpacity>

      {permissionDenied && (
        <View style={[styles.permissionBanner, { backgroundColor: theme.colors.warning }]}>
          <Text style={{ fontSize: fontSize.xs, color: '#1A1B25' }}>
            Location permission denied. Showing default area.
          </Text>
        </View>
      )}

      {selectedEvent && (
        <View style={styles.previewCard}>
          <EventCard
            event={selectedEvent}
            variant="horizontal"
            onPress={() => navigation.navigate('EventDetail', { eventId: selectedEvent._id })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  title: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    fontSize: fontSize.sm,
    fontWeight: '700',
    overflow: 'hidden',
  },
  locateButton: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    right: spacing.md,
    padding: spacing.md,
    borderRadius: radius.full,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  permissionBanner: { position: 'absolute', bottom: spacing.xl * 2, left: spacing.md, right: 70, padding: spacing.sm, borderRadius: radius.md },
  previewCard: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
});