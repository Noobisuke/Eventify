import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../hooks/useLocation';
import { geocodingService } from '../services/geocodingService';
import LeafletMap from './LeafletMap';
import Input from './Input';
import Button from './Button';
import { spacing, fontSize, radius } from '../constants/theme';

/**
 * Full-screen modal that lets the organizer set the event's location by:
 *  - searching for an address (autocomplete via OSM Nominatim), or
 *  - tapping/dragging a pin directly on the map
 * Defaults the initial map view to the device's current location, but
 * the chosen event location is entirely independent of it.
 *
 * onConfirm({ latitude, longitude, address }) is called when the user saves.
 */
export default function LocationPickerModal({ visible, onClose, onConfirm, initialLocation }) {
  const { theme } = useTheme();
  const { coords: deviceCoords } = useLocation(visible); // only requests when modal opens

  const [pin, setPin] = useState(initialLocation || null);
  const [mapCenter, setMapCenter] = useState(initialLocation || deviceCoords || { latitude: 30.901, longitude: 75.8573 });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(initialLocation?.address || '');
  const searchTimeout = useRef(null);

  const handleSearchChange = (text) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await geocodingService.searchAddress(text);
        setResults(found);
      } catch (e) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const selectResult = (item) => {
    const loc = { latitude: item.latitude, longitude: item.longitude };
    setPin(loc);
    setMapCenter(loc);
    setResolvedAddress(item.label);
    setResults([]);
    setQuery(item.label);
  };

  const handleMapPick = useCallback(async (loc) => {
    setPin(loc);
    try {
      const address = await geocodingService.reverseGeocode(loc.latitude, loc.longitude);
      setResolvedAddress(address);
      setQuery(address);
    } catch (e) {
      setResolvedAddress('');
    }
  }, []);

  const useCurrentLocation = () => {
    if (!deviceCoords) return;
    setPin(deviceCoords);
    setMapCenter(deviceCoords);
    handleMapPick(deviceCoords);
  };

  const handleConfirm = () => {
    if (!pin) return;
    onConfirm({ ...pin, address: resolvedAddress });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Set Event Location</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchWrapper}>
          <Input
            value={query}
            onChangeText={handleSearchChange}
            placeholder="Search for an address, venue, or city..."
            icon={<Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />}
            style={{ marginBottom: 0 }}
          />
          {searching && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.searchSpinner} />}

          {results.length > 0 && (
            <View style={[styles.resultsList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <FlatList
                data={results}
                keyExtractor={(item, idx) => `${item.latitude}-${item.longitude}-${idx}`}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultRow} onPress={() => selectResult(item)}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                    <Text numberOfLines={2} style={{ color: theme.colors.text, marginLeft: spacing.sm, flex: 1, fontSize: fontSize.sm }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <LeafletMap
            center={mapCenter}
            pickable
            pickedLocation={pin}
            onLocationPick={handleMapPick}
            zoom={14}
          />
        </View>

        <TouchableOpacity
          onPress={useCurrentLocation}
          style={[styles.currentLocationButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Ionicons name="locate-outline" size={16} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary, marginLeft: spacing.xs, fontWeight: '600', fontSize: fontSize.sm }}>
            Use my current location
          </Text>
        </TouchableOpacity>

        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          {resolvedAddress ? (
            <Text numberOfLines={2} style={{ color: theme.colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.sm }}>
              📍 {resolvedAddress}
            </Text>
          ) : (
            <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.sm }}>
              Search an address above or tap the map to drop a pin.
            </Text>
          )}
          <Button title="Confirm Location" onPress={handleConfirm} disabled={!pin} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  searchWrapper: { paddingHorizontal: spacing.md, position: 'relative', zIndex: 10 },
  searchSpinner: { position: 'absolute', right: spacing.lg + spacing.md, top: spacing.md },
  resultsList: {
    position: 'absolute', top: 54, left: spacing.md, right: spacing.md,
    borderRadius: radius.md, borderWidth: 1, maxHeight: 220, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  currentLocationButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    position: 'absolute', bottom: 120, alignSelf: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4,
  },
  footer: { padding: spacing.md, borderTopWidth: 1 },
});
