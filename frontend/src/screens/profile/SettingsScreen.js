import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, fontSize, radius } from '../../constants/theme';

export default function SettingsScreen({ navigation }) {
  const { theme, themeMode, setMode } = useTheme();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Please fill both fields (min 6 characters)' });
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      Toast.show({ type: 'success', text1: 'Password changed successfully' });
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not change password', text2: err.message });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Dark Mode</Text>
          <Switch
            value={themeMode === 'dark' || (themeMode === 'system' && theme.mode === 'dark')}
            onValueChange={(val) => setMode(val ? 'dark' : 'light')}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
        <TouchableOpacity onPress={() => setMode('system')} style={styles.systemLink}>
          <Text style={{ color: theme.colors.primary, fontSize: fontSize.sm }}>Use system setting</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: spacing.lg }]}>ACCOUNT</Text>
        <TouchableOpacity
          onPress={() => setPasswordModalVisible(true)}
          style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: spacing.lg }]}>ABOUT</Text>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Version</Text>
          <Text style={{ color: theme.colors.textSecondary }}>1.0.0</Text>
        </View>
      </View>

      <Modal visible={passwordModalVisible} animationType="slide" transparent onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Change Password</Text>
            <Input label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <Input label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 6 characters" />
            <Button title="Update Password" onPress={handleChangePassword} loading={changingPassword} style={{ marginTop: spacing.md }} />
            <Button title="Cancel" variant="ghost" onPress={() => setPasswordModalVisible(false)} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  container: { padding: spacing.md },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', marginBottom: spacing.sm, letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  systemLink: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { padding: spacing.xl, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800', marginBottom: spacing.md },
});
