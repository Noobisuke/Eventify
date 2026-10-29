import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach JWT to every outgoing request if present
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize error responses and handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token invalid/expired - clear local session.
      // Screens listen for this via AuthContext's checkAuthState on app resume,
      // but we also proactively clear here to prevent stale-token loops.
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject({
      message,
      status: error.response?.status,
      code: error.response?.data?.code,
      retryAfter: error.response?.data?.retryAfter,
      raw: error,
    });
  }
);

export default api;
