import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, fontSize } from '../constants/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  icon,
  keyboardType,
  autoCapitalize = 'none',
  multiline,
  numberOfLines,
  style,
}) {
  const { theme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = !!secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
          multiline && { alignItems: 'flex-start', paddingVertical: spacing.sm },
        ]}
      >
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[styles.input, { color: theme.colors.text }, multiline && { height: 20 * (numberOfLines || 4) }]}
        />
        {isPasswordField && (
          <TouchableOpacity onPress={() => setIsPasswordVisible((v) => !v)}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.xs },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  iconWrapper: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: fontSize.md, paddingVertical: spacing.md },
  error: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
