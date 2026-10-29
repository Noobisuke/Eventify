import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LocationPickerModal from '../../components/LocationPickerModal';
import { CATEGORIES, spacing, fontSize, radius } from '../../constants/theme';
import { appendImage } from '../../utils/uploadHelpers';

export default function CreateEventScreen({ navigation }) {
  const { theme } = useTheme();

  const [form, setForm] = useState({
    title: '', description: '', category: 'Music', date: '', time: '',
    venue: '', address: '', city: '', ticketPrice: '', capacity: '',
    contactNumber: '', website: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [eventLocation, setEventLocation] = useState(null); // { latitude, longitude, address }
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission is required' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const removeImage = (uri) => setImages((prev) => prev.filter((img) => img.uri !== uri));

  const validate = () => {
    const e = {};
    ['title', 'description', 'date', 'time', 'venue', 'address', 'city'].forEach((field) => {
      if (!form[field]?.trim()) e[field] = 'Required';
    });
    if (!eventLocation) e.location = 'Please set the event location on the map';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Toast.show({ type: 'error', text1: eventLocation ? 'Please fill in all required fields' : 'Please set the event location' });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append('latitude', String(eventLocation.latitude));
      formData.append('longitude', String(eventLocation.longitude));

      for (let idx = 0; idx < images.length; idx += 1) {
        await appendImage(formData, 'images', images[idx], idx);
      }

      await eventService.createEvent(formData);
      Toast.show({ type: 'success', text1: 'Event created successfully!' });
      navigation.navigate('HomeTab');
      setForm({ title: '', description: '', category: 'Music', date: '', time: '', venue: '', address: '', city: '', ticketPrice: '', capacity: '', contactNumber: '', website: '' });
      setImages([]);
      setEventLocation(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not create event', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Create Event</Text>

          <Text style={[styles.label, { color: theme.colors.text }]}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {images.map((img) => (
              <View key={img.uri} style={{ marginRight: spacing.sm }}>
                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => removeImage(img.uri)} style={styles.removeImageButton}>
                  <Ionicons name="close" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={pickImage}
              style={[styles.addImageButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            >
              <Ionicons name="camera-outline" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>

          <Input label="Event Title" value={form.title} onChangeText={(v) => setField('title', v)} placeholder="e.g. Open Mic Night" error={errors.title} />
          <Input label="Description" value={form.description} onChangeText={(v) => setField('description', v)} placeholder="Tell people what to expect..." multiline numberOfLines={4} error={errors.description} />

          <Text style={[styles.label, { color: theme.colors.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                onPress={() => setField('category', cat.name)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: form.category === cat.name ? cat.color : theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <MaterialCommunityIcons name={cat.icon} size={14} color={form.category === cat.name ? '#FFF' : theme.colors.text} />
                <Text style={{ color: form.category === cat.name ? '#FFF' : theme.colors.text, marginLeft: 4, fontWeight: '600', fontSize: fontSize.xs }}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.row}>
            <Input label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(v) => setField('date', v)} placeholder="2026-08-15" error={errors.date} style={{ flex: 1, marginRight: spacing.sm }} />
            <Input label="Time" value={form.time} onChangeText={(v) => setField('time', v)} placeholder="18:30" error={errors.time} style={{ flex: 1 }} />
          </View>

          <Input label="Venue" value={form.venue} onChangeText={(v) => setField('venue', v)} placeholder="e.g. Blue Note Cafe" error={errors.venue} />
          <Input label="Address" value={form.address} onChangeText={(v) => setField('address', v)} placeholder="Street address" error={errors.address} />
          <Input label="City" value={form.city} onChangeText={(v) => setField('city', v)} placeholder="e.g. Ludhiana" error={errors.city} autoCapitalize="words" />

          <Text style={[styles.label, { color: theme.colors.text }]}>Event Location on Map</Text>
          <TouchableOpacity
            onPress={() => setLocationPickerVisible(true)}
            style={[
              styles.locationButton,
              { borderColor: errors.location ? theme.colors.danger : theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            <Ionicons name="location-outline" size={20} color={eventLocation ? theme.colors.primary : theme.colors.textSecondary} />
            <Text
              numberOfLines={2}
              style={{ color: eventLocation ? theme.colors.text : theme.colors.textSecondary, marginLeft: spacing.sm, flex: 1, fontSize: fontSize.sm }}
            >
              {eventLocation ? eventLocation.address || `${eventLocation.latitude.toFixed(5)}, ${eventLocation.longitude.toFixed(5)}` : 'Tap to search or pin the event location'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          {errors.location && <Text style={{ color: theme.colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs }}>{errors.location}</Text>}

          <View style={styles.row}>
            <Input label="Ticket Price (₹, optional)" value={form.ticketPrice} onChangeText={(v) => setField('ticketPrice', v)} placeholder="0 for free" keyboardType="numeric" style={{ flex: 1, marginRight: spacing.sm }} />
            <Input label="Capacity (optional)" value={form.capacity} onChangeText={(v) => setField('capacity', v)} placeholder="Unlimited" keyboardType="numeric" style={{ flex: 1 }} />
          </View>

          <Input label="Contact Number" value={form.contactNumber} onChangeText={(v) => setField('contactNumber', v)} placeholder="Optional" keyboardType="phone-pad" />
          <Input label="Website" value={form.website} onChangeText={(v) => setField('website', v)} placeholder="Optional" />

          <Button title="Publish Event" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.md }} />
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
  container: { padding: spacing.md },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  row: { flexDirection: 'row' },
  imagePreview: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: '#ddd' },
  removeImageButton: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF476F', borderRadius: radius.full, padding: 4 },
  addImageButton: { width: 80, height: 80, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, marginRight: spacing.sm },
  locationButton: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, marginBottom: spacing.md },
});