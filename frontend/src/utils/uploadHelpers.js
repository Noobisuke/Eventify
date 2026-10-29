import { Platform } from 'react-native';

/**
 * Adds a picked image to a FormData for upload.
 * - Phones (Expo Go): React Native accepts a { uri, name, type } object.
 * - Browser: that object would be sent as "[object Object]", so the image has to be
 *   fetched and attached as a real Blob/File instead.
 */
export async function appendImage(formData, field, img, idx) {
  const name = `image_${idx}.jpg`;
  if (Platform.OS === 'web') {
    const blob = await (await fetch(img.uri)).blob();
    formData.append(field, blob, name);
  } else {
    formData.append(field, { uri: img.uri, name, type: 'image/jpeg' });
  }
}
