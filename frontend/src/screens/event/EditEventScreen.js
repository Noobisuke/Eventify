import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LocationPickerModal from '../../components/LocationPickerModal';
import { resolveImageUrl } from '../../constants/config';
import { appendImage } from '../../utils/uploadHelpers';
import { spacing, fontSize, radius } from '../../constants/theme';

export default function EditEventScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { theme } = useTheme();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [eventLocation, setEventLocation] = useState(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  // existingImages: raw paths as stored in the DB (needed to tell the backend which to remove)
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  // newImages: freshly picked local files, same shape as CreateEventScreen
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { event } = await eventService.getEventById(eventId);
        setForm({
          title: event.title,
          description: event.description,
          venue: event.venue,
          address: event.address,
          city: event.city,
          ticketPrice: String(event.ticketPrice || 0),
          capacity: event.capacity ? String(event.capacity) : '',
          contactNumber: event.contactNumber || '',
          website: event.website || '',
        });
        setExistingImages(event.images || []);
        if (event.location?.coordinates) {
          setEventLocation({
            latitude: event.location.coordinates[1],
            longitude: event.location.coordinates[0],
            address: `${event.venue}, ${event.address}`,
          });
        }
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Could not load event' });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission is required' });
      return;
    }
    const remainingSlots = 5 - (existingImages.length + newImages.length);
    if (remainingSlots <= 0) {
      Toast.show({ type: 'error', text1: 'Maximum 5 photos per event' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });
    if (!result.canceled) {
      setNewImages((prev) => [...prev, ...result.assets].slice(0, remainingSlots + prev.length));
    }
  };

  const removeExistingImage = (path) => {
    setExistingImages((prev) => prev.filter((img) => img !== path));
    setRemovedImages((prev) => [...prev, path]);
  };

  const removeNewImage = (uri) => setNewImages((prev) => prev.filter((img) => img.uri !== uri));

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (eventLocation) {
        formData.append('latitude', String(eventLocation.latitude));
        formData.append('longitude', String(eventLocation.longitude));
      }
      if (removedImages.length > 0) {
        formData.append('removeImages', JSON.stringify(removedImages));
      }
      for (let idx = 0; idx < newImages.length; idx += 1) {
        await appendImage(formData, 'images', newImages[idx], idx);
      }
      await eventService.updateEvent(eventId, formData);
      Toast.show({ type: 'success', text1: 'Event updated' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eventService.deleteEvent(eventId);
      Toast.show({ type: 'success', text1: 'Event deleted' });
      navigation.popToTop();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not delete event', text2: err.message });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !form) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Event</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {existingImages.map((path) => (
              <View key={path} style={{ marginRight: spacing.sm }}>
                <Image source={{ uri: resolveImageUrl(path) }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => removeExistingImage(path)} style={styles.removeImageButton}>
                  <Ionicons name="close" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {newImages.map((img) => (
              <View key={img.uri} style={{ marginRight: spacing.sm }}>
                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => removeNewImage(img.uri)} style={styles.removeImageButton}>
                  <Ionicons name="close" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {existingImages.length + newImages.length < 5 && (
              <TouchableOpacity
                onPress={pickImage}
                style={[styles.addImageButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              >
                <Ionicons name="camera-outline" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </ScrollView>

          <Input label="Event Title" value={form.title} onChangeText={(v) => setField('title', v)} />
          <Input label="Description" value={form.description} onChangeText={(v) => setField('description', v)} multiline numberOfLines={4} />
          <Input label="Venue" value={form.venue} onChangeText={(v) => setField('venue', v)} />
          <Input label="Address" value={form.address} onChangeText={(v) => setField('address', v)} />
          <Input label="City" value={form.city} onChangeText={(v) => setField('city', v)} />

          <Text style={[styles.label, { color: theme.colors.text }]}>Event Location on Map</Text>
          <TouchableOpacity
            onPress={() => setLocationPickerVisible(true)}
            style={[styles.locationButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
            <Text
              numberOfLines={2}
              style={{ color: theme.colors.text, marginLeft: spacing.sm, flex: 1, fontSize: fontSize.sm }}
            >
              {eventLocation ? eventLocation.address || `${eventLocation.latitude.toFixed(5)}, ${eventLocation.longitude.toFixed(5)}` : 'Tap to set location'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.row}>
            <Input label="Ticket Price (₹)" value={form.ticketPrice} onChangeText={(v) => setField('ticketPrice', v)} keyboardType="numeric" style={{ flex: 1, marginRight: spacing.sm }} />
            <Input label="Capacity" value={form.capacity} onChangeText={(v) => setField('capacity', v)} keyboardType="numeric" style={{ flex: 1 }} />
          </View>
          <Input label="Contact Number" value={form.contactNumber} onChangeText={(v) => setField('contactNumber', v)} keyboardType="phone-pad" />
          <Input label="Website" value={form.website} onChangeText={(v) => setField('website', v)} />

          <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: spacing.md }} />
          <Button title="Delete Event" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onConfirm={(loc) => setEventLocation(loc)}
        initialLocation={eventLocation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  container: { padding: spacing.md },
  row: { flexDirection: 'row' },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  imagePreview: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: '#ddd' },
  removeImageButton: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF476F', borderRadius: radius.full, padding: 4 },
  addImageButton: { width: 80, height: 80, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  locationButton: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, marginBottom: spacing.md },
});
