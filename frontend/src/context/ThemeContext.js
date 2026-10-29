import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../constants/theme';
import { STORAGE_KEYS } from '../constants/config';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeMode] = useState('system'); // 'system' | 'light' | 'dark'
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (stored) setThemeMode(stored);
      setIsReady(true);
    })();
  }, []);

  const resolvedMode = themeMode === 'system' ? systemScheme || 'light' : themeMode;
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  const setMode = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
  };

  const toggleTheme = () => setMode(resolvedMode === 'dark' ? 'light' : 'dark');

  if (!isReady) return null; // brief flash avoidance; Splash screen covers this in practice

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
