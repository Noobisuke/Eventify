import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, fontSize } from '../constants/theme';

export default function CategoryPill({ category, selected, onPress }) {
  const { theme } = useTheme();
  const bg = selected ? category.color : theme.colors.surface;
  const textColor = selected ? '#FFFFFF' : theme.colors.text;
  // Icon always carries the category's own color so it stays recognizable
  // even in the unselected state; only the whole pill fills with color
  // once selected.
  const iconColor = selected ? '#FFFFFF' : category.color;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderColor: selected ? bg : theme.colors.border,
        },
        selected && { ...styles.pillSelectedShadow, shadowColor: category.color },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : `${category.color}1A` }]}>
        <MaterialCommunityIcons name={category.icon} size={14} color={iconColor} />
      </View>
      <Text style={[styles.text, { color: textColor }]}>{category.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  pillSelectedShadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { marginLeft: spacing.xs, fontSize: fontSize.sm, fontWeight: '600' },
});