import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { useLocation } from '../../hooks/useLocation';
import { eventService } from '../../services/eventService';
import EventCard from '../../components/EventCard';
import CategoryPill from '../../components/CategoryPill';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { CATEGORIES, spacing, fontSize, radius } from '../../constants/theme';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { refreshSavedEvents } = useEvents();
  const { coords } = useLocation();

  const [sections, setSections] = useState({ featured: [], trending: [], upcoming: [], nearby: [], recent: [] });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHome = useCallback(async () => {
    try {
      const [featuredRes, trendingRes, upcomingRes, recentRes] = await Promise.all([
        eventService.getEvents({ sort: 'newest', limit: 5 }), // proxy for featured pool
        eventService.getEvents({ sort: 'trending', limit: 5 }),
        eventService.getEvents({ sort: 'upcoming', limit: 5 }),
        eventService.getEvents({ sort: 'newest', limit: 5 }),
      ]);

      let nearby = [];
      if (coords) {
        const nearbyRes = await eventService.getEvents({
          lat: coords.latitude,
          lng: coords.longitude,
          distance: 20000,
          limit: 5,
        });
        nearby = nearbyRes.events;
      }

      setSections({
        featured: featuredRes.events.filter((e) => e.isFeatured),
        trending: trendingRes.events,
        upcoming: upcomingRes.events,
        nearby,
        recent: recentRes.events,
      });
      refreshSavedEvents();
    } catch (err) {
      // Sections stay empty; EmptyState components below handle the UI
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, refreshSavedEvents]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHome();
  };

  const goToEvent = (event) => navigation.navigate('EventDetail', { eventId: event._id });

  const goToSearchWithCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    navigation.navigate('SearchTab', { category: categoryName });
  };

  const renderSection = (title, data, variant = 'vertical') => {
    if (!data || data.length === 0) return null;
    return (
      <View style={{ marginBottom: spacing.lg }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
        </View>
        {variant === 'horizontal' ? (
          <FlatList
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingHorizontal: spacing.md }}
            renderItem={({ item }) => (
              <View style={{ marginRight: spacing.sm }}>
                <EventCard event={item} variant="horizontal" onPress={() => goToEvent(item)} />
              </View>
            )}
          />
        ) : (
          <View style={{ paddingHorizontal: spacing.md }}>
            {data.map((item) => (
              <EventCard key={item._id} event={item} onPress={() => goToEvent(item)} />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {user ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Welcome'}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Discover Events</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('ProfileTab', { screen: 'Notifications' })}>
          <Ionicons name="notifications-outline" size={26} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => navigation.getParent()?.navigate('SearchTab')}
      >
        <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
        <Text style={{ color: theme.colors.textSecondary, marginLeft: spacing.sm }}>Search events, venues, cities...</Text>
      </TouchableOpacity>

      <Text style={[styles.categoryLabel, { color: theme.colors.textSecondary }]}>Browse by category</Text>
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.name}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryListContent}
        renderItem={({ item }) => (
          <CategoryPill
            category={item}
            selected={selectedCategory === item.name}
            onPress={() => goToSearchWithCategory(item.name)}
          />
        )}
      />

      {loading ? (
        <ScrollView style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
          <LoadingSkeleton count={3} />
        </ScrollView>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
        >
          {renderSection('⭐ Featured Events', sections.featured, 'horizontal')}
          {renderSection('🔥 Trending', sections.trending, 'horizontal')}
          {renderSection('📍 Nearby You', sections.nearby, 'horizontal')}
          {renderSection('🕒 Upcoming', sections.upcoming)}
          {renderSection('🆕 Recently Added', sections.recent)}

          {sections.featured.length === 0 &&
            sections.trending.length === 0 &&
            sections.upcoming.length === 0 &&
            sections.nearby.length === 0 && (
              <EmptyState
                icon="calendar-outline"
                title="No events yet"
                message="Be the first to discover or create a local event."
              />
            )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  greeting: { fontSize: fontSize.sm },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  // A horizontal FlatList grows/shrinks like any ScrollView, so next to the vertical feed it was
  // being squeezed to a few pixels and clipping the pills. flexGrow: 0 sizes it to its content.
  categoryList: { flexGrow: 0, flexShrink: 0 },
  categoryListContent: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700' },
});
