import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.logoWrap}>
        <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.title}>Eventify</Text>
      <Text style={styles.subtitle}>Discover what's happening near you</Text>
      <ActivityIndicator color="#FFFFFF" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 72, height: 72, borderRadius: 16 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 16 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
});