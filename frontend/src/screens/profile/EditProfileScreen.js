import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, fontSize, radius } from '../../constants/theme';

export default function EditProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission is required' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      // NOTE: For production, upload this to Cloudinary via a dedicated endpoint
      // and store the returned URL. Kept simple here as a local URI preview.
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { user: updated } = await authService.updateProfile({ name, bio, avatar });
      await updateUser(updated);
      Toast.show({ type: 'success', text1: 'Profile updated' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{name?.[0]?.toUpperCase()}</Text>
            )}
          </View>
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="camera" size={14} color={theme.colors.text} />
          </View>
        </TouchableOpacity>

        <Input label="Full Name" value={name} onChangeText={setName} style={{ marginTop: spacing.xl, width: '100%' }} />
        <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell us about yourself" multiline numberOfLines={4} style={{ width: '100%' }} />

        <Button title="Save Changes" onPress={handleSave} loading={loading} style={{ width: '100%', marginTop: spacing.md }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  container: { padding: spacing.xl, alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 96, height: 96 },
  avatarInitial: { color: '#FFF', fontSize: fontSize.xxl, fontWeight: '800' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, padding: spacing.sm, borderRadius: radius.full, borderWidth: 1 },
});