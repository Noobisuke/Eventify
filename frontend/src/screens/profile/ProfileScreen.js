import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { spacing, fontSize, radius } from '../../constants/theme';

function MenuItem({ icon, label, onPress, theme, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <Ionicons name={icon} size={20} color={danger ? theme.colors.danger : theme.colors.primary} />
      <Text style={[styles.menuLabel, { color: danger ? theme.colors.danger : theme.colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase()}</Text>
            )}
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>{user?.name}</Text>
          <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: fontSize.xs, textTransform: 'capitalize' }}>
              {user?.role}
            </Text>
          </View>
          {user?.bio ? <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>{user.bio}</Text> : null}

          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            style={[styles.editButton, { borderColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>MY ACTIVITY</Text>
        <MenuItem icon="heart-outline" label="Saved Events" onPress={() => navigation.navigate('SavedEvents')} theme={theme} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} theme={theme} />

        {(user?.role === 'organizer' || user?.role === 'admin') && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>ORGANIZER</Text>
            <MenuItem icon="calendar-outline" label="My Events" onPress={() => navigation.navigate('MyEvents')} theme={theme} />
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>ADMIN</Text>
            <MenuItem icon="stats-chart-outline" label="Dashboard & Analytics" onPress={() => navigation.navigate('AdminDashboard')} theme={theme} />
            <MenuItem icon="people-outline" label="Manage Users" onPress={() => navigation.navigate('AdminUsers')} theme={theme} />
            <MenuItem icon="flag-outline" label="Manage Events" onPress={() => navigation.navigate('AdminEvents')} theme={theme} />
          </>
        )}

        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>SETTINGS</Text>
        <MenuItem icon="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} theme={theme} />
        <MenuItem icon="log-out-outline" label="Log Out" onPress={logout} theme={theme} danger />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 84, height: 84 },
  avatarInitial: { color: '#FFF', fontSize: fontSize.xxl, fontWeight: '800' },
  name: { fontSize: fontSize.xl, fontWeight: '800', marginTop: spacing.sm },
  email: { fontSize: fontSize.sm, marginTop: 2 },
  roleBadge: { marginTop: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  bio: { fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
  editButton: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm, letterSpacing: 0.5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  menuLabel: { flex: 1, marginLeft: spacing.sm, fontSize: fontSize.md, fontWeight: '600' },
});
