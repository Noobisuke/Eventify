import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Base API URL, resolved in this order:
 *  1. app.json `extra.apiUrl` if you set it (use this for a deployed/production server)
 *  2. Auto-detected: Expo already knows your computer's current LAN IP (it's the
 *     address the phone used to load the app), so we reuse it for the backend on
 *     port 5000. No more editing the IP every time it changes.
 *  3. Hard-coded fallback below (e.g. Android emulator -> host machine).
 */
const BACKEND_PORT = 5000;

const getDevHost = () => {
  // Browser: the page's own hostname (localhost, or your LAN IP if opened from another device)
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.hostname;
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  // Tunnel mode gives a public *.exp.direct host that isn't your backend - ignore it
  if (!host || host.includes('exp.direct')) return null;
  return host;
};

const devHost = getDevHost();
const explicitUrl = Constants.expoConfig?.extra?.apiUrl;

export const API_URL =
  explicitUrl || (devHost ? `http://${devHost}:${BACKEND_PORT}/api` : `http://10.0.2.2:${BACKEND_PORT}/api`);

export const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already a full Cloudinary URL
  return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const STORAGE_KEYS = {
  TOKEN: 'local_events_token',
  USER: 'local_events_user',
  THEME: 'local_events_theme',
};

export const DEFAULT_REGION = {
  // Fallback map region if location permission is denied (Ludhiana, India)
  latitude: 30.901,
  longitude: 75.8573,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};
