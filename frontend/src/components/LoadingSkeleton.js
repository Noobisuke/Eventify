import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing } from '../constants/theme';

/**
 * Simple pulsing skeleton placeholder shown while event lists load,
 * so the UI never shows a blank screen or an abrupt spinner-then-content jump.
 */
export default function LoadingSkeleton({ count = 3 }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[styles.card, { backgroundColor: theme.colors.skeleton, opacity }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
});
