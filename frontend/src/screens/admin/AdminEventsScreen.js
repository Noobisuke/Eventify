import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/otherServices';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { spacing, fontSize, radius } from '../../constants/theme';

export default function AdminEventsScreen({ navigation }) {
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Pull a broad set of events for moderation review (sorted by most recently reported first isn't
      // available directly from the public endpoint, so we fetch newest and let admins filter visually)
      const res = await eventService.getEvents({ sort: 'newest', limit: 50 });
      setEvents(res.events);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load events' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApprove = async (event, isApproved) => {
    try {
      await userService.moderateEvent(event._id, { isApproved });
      setEvents((prev) => prev.map((e) => (e._id === event._id ? { ...e, isApproved } : e)));
      Toast.show({ type: 'success', text1: isApproved ? 'Event approved' : 'Event hidden' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Action failed' });
    }
  };

  const handleClearReports = async (event) => {
    try {
      await userService.moderateEvent(event._id, { clearReports: true });
      setEvents((prev) => prev.map((e) => (e._id === event._id ? { ...e, reportCount: 0 } : e)));
      Toast.show({ type: 'success', text1: 'Reports cleared' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Action failed' });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Manage Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No events found" />}
          renderItem={({ item }) => (
            <View style={[styles.eventCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.text, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>
                {item.city} · {item.category} {item.reportCount > 0 ? `· ${item.reportCount} reports` : ''}
              </Text>
              <View style={styles.actionRow}>
                <Button
                  title={item.isApproved ? 'Hide' : 'Approve'}
                  variant={item.isApproved ? 'danger' : 'primary'}
                  onPress={() => handleApprove(item, !item.isApproved)}
                  style={{ flex: 1, marginRight: spacing.sm, paddingVertical: spacing.sm }}
                />
                {item.reportCount > 0 && (
                  <Button
                    title="Clear Reports"
                    variant="outline"
                    onPress={() => handleClearReports(item)}
                    style={{ flex: 1, paddingVertical: spacing.sm }}
                  />
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  eventCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', marginTop: spacing.sm },
});
