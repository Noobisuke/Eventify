import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, fontSize } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        Toast.show({ type: 'info', text1: 'Verify your email', text2: err.message });
        navigation.navigate('VerifyEmail', { email: email.trim().toLowerCase() });
        return;
      }
      Toast.show({ type: 'error', text1: 'Login failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Sign in to discover events near you
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          error={errors.email}
          icon={<Ionicons name="mail-outline" size={18} color={theme.colors.textSecondary} />}
          style={{ marginTop: spacing.xl }}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
          icon={<Ionicons name="lock-closed-outline" size={18} color={theme.colors.textSecondary} />}
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ color: theme.colors.primary, fontSize: fontSize.sm, fontWeight: '600' }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <Button title="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.lg }} />

        <View style={styles.footer}>
          <Text style={{ color: theme.colors.textSecondary }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  logo: { width: 56, height: 56, borderRadius: 14, alignSelf: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: '800', marginTop: spacing.md, textAlign: 'center' },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.sm, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
});
