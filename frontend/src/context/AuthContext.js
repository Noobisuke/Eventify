import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while restoring session on app boot

  // Restore session from AsyncStorage on app start
  const bootstrapAuth = useCallback(async () => {
    try {
      const [token, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        // Refresh from server in background to catch role/profile changes
        try {
          const { user: freshUser } = await authService.getMe();
          setUser(freshUser);
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));
        } catch (e) {
          // If token expired, interceptor already cleared storage; reflect that here
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const login = async (email, password) => {
    const { token, user: loggedInUser } = await authService.login({ email, password });
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  // Creates the account and emails a code. The user is NOT logged in yet -
  // that happens in verifyEmail once they enter the code.
  const register = async (name, email, password, role) => {
    return authService.register({ name, email, password, role });
  };

  const verifyEmail = async (email, otp) => {
    const { token, user: verifiedUser } = await authService.verifyEmail(email, otp);
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(verifiedUser));
    setUser(verifiedUser);
    return verifiedUser;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  };

  const updateUser = async (updatedFields) => {
    const merged = { ...user, ...updatedFields };
    setUser(merged);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    verifyEmail,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
