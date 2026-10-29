import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import EventCard from '../../components/EventCard';
import CategoryPill from '../../components/CategoryPill';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { CATEGORIES, spacing, fontSize, radius } from '../../constants/theme';

const SORT_OPTIONS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'trending', label: 'Trending' },
  { key: 'popular', label: 'Popular' },
  { key: 'newest', label: 'Newest' },
];

export default function SearchScreen({ route, navigation }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(route?.params?.category || null);
  const [city, setCity] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState('upcoming');
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const runSearch = useCallback(
    async (reset = true) => {
      setLoading(reset);
      try {
        const currentPage = reset ? 1 : page + 1;
        const res = await eventService.getEvents({
          search: search || undefined,
          category: category || undefined,
          city: city || undefined,
          freeOnly: freeOnly || undefined,
          sort,
          page: currentPage,
          limit: 10,
        });
        setEvents(reset ? res.events : [...events, ...res.events]);
        setPage(currentPage);
        setHasMore(currentPage < res.pages);
      } catch (err) {
        // Keep prior results on error
      } finally {
        setLoading(false);
      }
    },
    [search, category, city, freeOnly, sort, page, events]
  );

  useEffect(() => {
    runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, city, freeOnly, sort]);

  useEffect(() => {
    if (route?.params?.category) setCategory(route.params.category);
  }, [route?.params?.category]);

  const handleSearchSubmit = () => runSearch(true);

  const loadMore = () => {
    if (!loading && hasMore) runSearch(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search events, venues, cities..."
            style={{ flex: 1, marginBottom: 0 }}
          />
        </View>
        <TouchableOpacity
          onPress={() => setFiltersVisible(true)}
          style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="options-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

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
            selected={category === item.name}
            onPress={() => setCategory(category === item.name ? null : item.name)}
          />
        )}
      />

      {loading && events.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.md }}>
          <LoadingSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => navigation.navigate('HomeTab', { screen: 'EventDetail', params: { eventId: item._id } })} />
          )}
          ListEmptyComponent={
            <EmptyState icon="search-outline" title="No events found" message="Try adjusting your filters or search terms." />
          }
        />
      )}

      <Modal visible={filtersVisible} animationType="slide" transparent onRequestClose={() => setFiltersVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filters</Text>

            <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Ludhiana" autoCapitalize="words" />

            <Text style={[styles.label, { color: theme.colors.text }]}>Sort by</Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSort(opt.key)}
                  style={[
                    styles.sortPill,
                    {
                      backgroundColor: sort === opt.key ? theme.colors.primary : theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: sort === opt.key ? '#FFF' : theme.colors.text, fontWeight: '600' }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setFreeOnly((v) => !v)}>
              <Ionicons
                name={freeOnly ? 'checkbox' : 'square-outline'}
                size={22}
                color={freeOnly ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={{ color: theme.colors.text, marginLeft: spacing.sm }}>Free events only</Text>
            </TouchableOpacity>

            <Button
              title="Apply Filters"
              onPress={() => {
                setFiltersVisible(false);
                runSearch(true);
              }}
              style={{ marginTop: spacing.lg }}
            />
            <Button
              title="Close"
              variant="ghost"
              onPress={() => setFiltersVisible(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md },
  filterButton: { padding: spacing.md, borderRadius: radius.md },
  categoryList: { flexGrow: 0, flexShrink: 0 },
  categoryListContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: '100%', maxWidth: 480, padding: spacing.xl, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800', marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm, marginBottom: spacing.sm },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sortPill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
});