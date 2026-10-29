import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';
import EmptyState from '../../components/EmptyState';
import { spacing, fontSize, radius } from '../../constants/theme';

const STATUS_COLORS = { going: 'success', interested: 'warning', cancelled: 'danger' };

export default function AttendeesScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { theme } = useTheme();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await eventService.getAttendees(eventId);
        setAttendees(res.attendees);
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Could not load attendees', text2: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Attendees</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={(item, idx) => item.user?._id || String(idx)}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="No attendees yet" message="Once people RSVP, they'll show up here." />
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>{item.user?.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <Text style={{ color: theme.colors.text, flex: 1, marginLeft: spacing.sm, fontWeight: '600' }}>
                {item.user?.name || 'Unknown user'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors[STATUS_COLORS[item.status]] }]}>
                <Text style={{ color: '#FFF', fontSize: fontSize.xs, fontWeight: '700' }}>{item.status}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
});
