import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/otherServices';
import { spacing, fontSize, radius } from '../../constants/theme';

function StatCard({ label, value, icon, color, theme }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAnalytics();
      setAnalytics(res.analytics);
    } catch (err) {
      // Silent - dashboard just stays empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading || !analytics ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          <View style={styles.statsGrid}>
            <StatCard label="Users" value={analytics.totalUsers} icon="people-outline" color={theme.colors.primary} theme={theme} />
            <StatCard label="Organizers" value={analytics.totalOrganizers} icon="megaphone-outline" color={theme.colors.secondary} theme={theme} />
            <StatCard label="Events" value={analytics.totalEvents} icon="calendar-outline" color={theme.colors.success} theme={theme} />
            <StatCard label="RSVPs" value={analytics.totalRsvps} icon="checkmark-circle-outline" color={theme.colors.warning} theme={theme} />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Categories</Text>
          {analytics.topCategories.map((cat) => (
            <View key={cat._id} style={[styles.listRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{cat._id}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>{cat.count} events</Text>
            </View>
          ))}

          {analytics.reportedEvents.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Reported Events</Text>
              {analytics.reportedEvents.map((ev) => (
                <View key={ev._id} style={[styles.listRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>{ev.title}</Text>
                  <View style={[styles.reportBadge, { backgroundColor: theme.colors.danger }]}>
                    <Text style={{ color: '#FFF', fontSize: fontSize.xs, fontWeight: '700' }}>{ev.reportCount} reports</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { width: '47%', padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  statIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.sm },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  reportBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
});
