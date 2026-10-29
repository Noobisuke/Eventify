import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useEvents } from '../context/EventContext';
import { CATEGORIES, radius, spacing, fontSize } from '../constants/theme';
import { resolveImageUrl } from '../constants/config';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/6C63FF/FFFFFF/png?text=Event';

function categoryColor(name, fallback) {
  const match = CATEGORIES.find((c) => c.name === name);
  return match ? match.color : fallback;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * variant: 'vertical' (default grid/list card) | 'horizontal' (compact row, used in "Nearby")
 */
export default function EventCard({ event, onPress, variant = 'vertical' }) {
  const { theme } = useTheme();
  const { isSaved, toggleSaved } = useEvents();
  const saved = isSaved(event._id);

  const imageUri = event.images && event.images.length > 0 ? resolveImageUrl(event.images[0]) : PLACEHOLDER_IMAGE;

  const handleToggleSave = async (e) => {
    e.stopPropagation?.();
    try {
      await toggleSaved(event._id);
    } catch (err) {
      // Silently ignore; context already rolled back optimistic state
    }
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.horizontalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      >
        <Image source={{ uri: imageUri }} style={styles.horizontalImage} />
        <View style={styles.horizontalContent}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            {formatDate(event.date)} · {event.city}
          </Text>
          <Text style={[styles.price, { color: event.ticketPrice ? theme.colors.text : theme.colors.success }]}>
            {event.ticketPrice ? `₹${event.ticketPrice}` : 'Free'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <TouchableOpacity onPress={handleToggleSave} style={styles.saveButton}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? theme.colors.danger : '#FFF'} />
        </TouchableOpacity>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor(event.category, theme.colors.primary) }]}>
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text numberOfLines={2} style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}> {formatDate(event.date)} · {event.time}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
          <Text numberOfLines={1} style={[styles.meta, { color: theme.colors.textSecondary }]}> {event.venue}, {event.city}</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={[styles.price, { color: event.ticketPrice ? theme.colors.text : theme.colors.success }]}>
            {event.ticketPrice ? `₹${event.ticketPrice}` : 'Free'}
          </Text>
          {event.isFeatured && (
            <View style={[styles.featuredBadge, { backgroundColor: theme.colors.warning }]}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: 160, backgroundColor: '#ddd' },
  saveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: spacing.xs,
    borderRadius: radius.full,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  categoryText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: '700' },
  content: { padding: spacing.md },
  title: { fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  meta: { fontSize: fontSize.xs },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  price: { fontSize: fontSize.sm, fontWeight: '700' },
  featuredBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  featuredText: { fontSize: fontSize.xs, fontWeight: '700', color: '#1A1B25' },

  horizontalCard: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    width: 260,
  },
  horizontalImage: { width: 90, height: 90, backgroundColor: '#ddd' },
  horizontalContent: { flex: 1, padding: spacing.sm, justifyContent: 'center' },
});