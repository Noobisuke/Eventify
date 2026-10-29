import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/otherServices';
import EmptyState from '../../components/EmptyState';
import { spacing, fontSize, radius } from '../../constants/theme';

const TYPE_ICONS = {
  event_reminder: 'alarm-outline',
  new_nearby_event: 'location-outline',
  rsvp_confirmation: 'checkmark-circle-outline',
  event_updated: 'refresh-outline',
  event_cancelled: 'close-circle-outline',
  general: 'notifications-outline',
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      // Keep prior list
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePress = async (item) => {
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item._id);
        setNotifications((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
      } catch (e) {}
    }
    if (item.relatedEvent) {
      navigation.navigate('EventDetail', { eventId: item.relatedEvent });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: fontSize.sm }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="No notifications" message="You're all caught up!" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handlePress(item)}
              style={[
                styles.notificationRow,
                {
                  backgroundColor: item.isRead ? theme.colors.card : theme.colors.primary + '10',
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons name={TYPE_ICONS[item.type] || 'notifications-outline'} size={22} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 }}>{item.message}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.xs, marginTop: 4 }}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  notificationRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  title: { fontWeight: '700', fontSize: fontSize.sm },
  dot: { width: 8, height: 8, borderRadius: radius.full, marginTop: 4 },
});
