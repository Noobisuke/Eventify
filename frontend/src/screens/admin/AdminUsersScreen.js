import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/otherServices';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import { spacing, fontSize, radius } from '../../constants/theme';

export default function AdminUsersScreen({ navigation }) {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      const res = await userService.getAllUsers({ search: searchTerm || undefined });
      setUsers(res.users);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load users' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggleStatus = async (user) => {
    try {
      const res = await userService.toggleUserStatus(user._id);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? res.user : u)));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not update user' });
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      const res = await userService.updateUserRole(user._id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? res.user : u)));
      Toast.show({ type: 'success', text1: `Role updated to ${newRole}` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not update role' });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.md }}>
        <Input value={search} onChangeText={setSearch} placeholder="Search by name or email" />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md }}
          onEndReached={() => {}}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" />}
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.xs }}>{item.email}</Text>
                <View style={styles.roleRow}>
                  {['user', 'organizer', 'admin'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => handleRoleChange(item, r)}
                      style={[
                        styles.roleChip,
                        { backgroundColor: item.role === r ? theme.colors.primary : theme.colors.background, borderColor: theme.colors.border },
                      ]}
                    >
                      <Text style={{ color: item.role === r ? '#FFF' : theme.colors.text, fontSize: fontSize.xs, fontWeight: '600' }}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleToggleStatus(item)} style={styles.statusToggle}>
                <Ionicons
                  name={item.isActive ? 'checkmark-circle' : 'close-circle'}
                  size={26}
                  color={item.isActive ? theme.colors.success : theme.colors.danger}
                />
              </TouchableOpacity>
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
  userCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  roleChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  statusToggle: { marginLeft: spacing.sm },
});
