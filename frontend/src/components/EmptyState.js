import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, fontSize } from '../constants/theme';
import Button from './Button';

export default function EmptyState({ icon = 'calendar-outline', title, message, actionLabel, onAction }) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={theme.colors.textSecondary} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.md, paddingHorizontal: spacing.xl }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  message: { fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center' },
});
