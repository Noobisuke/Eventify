import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { eventService } from '../../services/eventService';
import { rsvpService } from '../../services/otherServices';
import LeafletMap from '../../components/LeafletMap';
import Button from '../../components/Button';
import { spacing, fontSize, radius } from '../../constants/theme';
import { resolveImageUrl } from '../../constants/config';

const { width } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://placehold.co/800x500/6C63FF/FFFFFF?text=Event';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { isSaved, toggleSaved } = useEvents();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [rsvpQrCode, setRsvpQrCode] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventService.getEventById(eventId);
      setEvent(res.event);

      if (isAuthenticated && user) {
        const mine = res.event.attendees?.find((a) => a.user?._id === user._id || a.user === user._id);
        if (mine) setRsvpStatus(mine.status);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load event', text2: err.message });
    } finally {
      setLoading(false);
    }
  }, [eventId, isAuthenticated, user]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleRsvp = async (status) => {
    if (!isAuthenticated) {
      Toast.show({ type: 'info', text1: 'Please log in to RSVP' });
      return;
    }
    setRsvpLoading(true);
    try {
      const res = await rsvpService.createRsvp(eventId, status);
      setRsvpStatus(status);
      setRsvpQrCode(res.rsvp.qrCode);
      Toast.show({ type: 'success', text1: `You're marked as ${status}!` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'RSVP failed', text2: err.message });
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${event.title}" on ${new Date(event.date).toLocaleDateString()} at ${event.venue}, ${event.city}!`,
      });
    } catch (err) {
      // User cancelled share sheet - no action needed
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'info', text1: 'Please log in to save events' });
      return;
    }
    try {
      await toggleSaved(eventId);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not update favorites' });
    }
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const isOwner = event.organizer?._id === user?._id;
  const canManage = isOwner || user?.role === 'admin';
  const isPast = event.isUpcoming === false;
  // Organizers can't edit finished events; admins keep access for moderation
  const canEdit = canManage && (!isPast || user?.role === 'admin');
  const eventDate = new Date(event.date);
  const saved = isSaved(event._id);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView bounces={false}>
        <View>
          <Image source={{ uri: resolveImageUrl(event.images?.[0]) || PLACEHOLDER_IMAGE }} style={styles.heroImage} />
          <SafeAreaView style={styles.heroOverlay} edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleButton}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity onPress={handleShare} style={styles.circleButton}>
                <Ionicons name="share-social-outline" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.circleButton}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? theme.colors.danger : '#FFF'} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>{event.category}</Text>
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {event.time}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>{event.venue}, {event.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {event.ticketPrice ? `₹${event.ticketPrice} per ticket` : 'Free admission'}
              {event.capacity ? ` · ${event.attendees?.filter(a => a.status === 'going').length || 0}/${event.capacity} attending` : ''}
            </Text>
          </View>

          {event.organizer && (
            <TouchableOpacity
              style={[styles.organizerRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => {}}
            >
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>{event.organizer.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{event.organizer.name}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.xs }}>Organizer</Text>
              </View>
              {canManage && (
                <TouchableOpacity onPress={() => navigation.navigate('Attendees', { eventId: event._id })}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Attendees</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About this event</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{event.description}</Text>

          {(event.contactNumber || event.website) && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact</Text>
              {event.contactNumber ? (
                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>📞 {event.contactNumber}</Text>
              ) : null}
              {event.website ? (
                <Text style={[styles.description, { color: theme.colors.primary }]}>🔗 {event.website}</Text>
              ) : null}
            </>
          )}

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location</Text>
          <View style={styles.mapContainer}>
            <LeafletMap
              center={{ latitude: event.location.coordinates[1], longitude: event.location.coordinates[0] }}
              markers={[{ id: event._id, latitude: event.location.coordinates[1], longitude: event.location.coordinates[0], title: event.title }]}
              zoom={14}
            />
          </View>

          {rsvpQrCode && (
            <View style={[styles.qrCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: spacing.sm }}>
                Your check-in QR code
              </Text>
              <QRCode value={rsvpQrCode} size={140} />
              <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.sm, textAlign: 'center' }}>
                Show this at the venue for entry
              </Text>
            </View>
          )}

          {canEdit && (
            <View style={styles.manageRow}>
              <Button
                title="Edit Event"
                variant="outline"
                onPress={() => navigation.navigate('EditEvent', { eventId: event._id })}
                style={{ flex: 1 }}
              />
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {!canManage && isPast && (
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <Button title="This event has ended" onPress={() => {}} disabled style={{ flex: 1 }} />
        </View>
      )}

      {!canManage && !isPast && (
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <Button
            title={rsvpStatus === 'going' ? "You're going ✓" : 'RSVP - Going'}
            onPress={() => handleRsvp('going')}
            loading={rsvpLoading}
            disabled={rsvpStatus === 'going'}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <Button
            title="Interested"
            variant="outline"
            onPress={() => handleRsvp('interested')}
            disabled={rsvpStatus === 'interested'}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width, height: 280, backgroundColor: '#ddd' },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  circleButton: { backgroundColor: 'rgba(0,0,0,0.4)', padding: spacing.sm, borderRadius: radius.full },
  content: { padding: spacing.md },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  infoText: { marginLeft: spacing.sm, fontSize: fontSize.sm, flex: 1 },
  organizerRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.md },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  description: { fontSize: fontSize.sm, lineHeight: 22 },
  mapContainer: { height: 200, borderRadius: radius.md, overflow: 'hidden' },
  qrCard: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg },
  manageRow: { flexDirection: 'row', marginTop: spacing.lg },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: spacing.md, borderTopWidth: 1,
  },
});