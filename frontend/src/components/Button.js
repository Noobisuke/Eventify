import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, fontSize } from '../constants/theme';

/**
 * variant: 'primary' | 'outline' | 'ghost' | 'danger'
 */
export default function Button({ title, onPress, variant = 'primary', loading, disabled, style, icon }) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
      ? theme.colors.danger
      : 'transparent';

  const borderColor = variant === 'outline' ? theme.colors.primary : 'transparent';
  const textColor = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        { backgroundColor, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0, opacity: isDisabled ? 0.6 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor, marginLeft: icon ? spacing.xs : 0 }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
