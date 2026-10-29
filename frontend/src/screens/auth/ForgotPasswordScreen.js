import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, fontSize } from '../../constants/theme';

const RESEND_SECONDS = 60;

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const [step, setStep] = useState('email'); // 'email' -> 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const sendCode = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Toast.show({ type: 'error', text1: 'Please enter a valid email' });
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setStep('reset');
      setSecondsLeft(RESEND_SECONDS);
      Toast.show({ type: 'success', text1: 'Check your email', text2: 'If it is registered, a code was sent' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Request failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit code' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase(), code, newPassword);
      Toast.show({ type: 'success', text1: 'Password updated', text2: 'You can now log in' });
      navigation.navigate('Login');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSecondsLeft(RESEND_SECONDS);
      Toast.show({ type: 'success', text1: 'New code sent if the email is registered' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Request failed', text2: err.message });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => (step === 'reset' ? setStep('email') : navigation.goBack())} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Ionicons name="lock-open-outline" size={48} color={theme.colors.primary} style={{ marginTop: spacing.xl }} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Reset password</Text>

        {step === 'email' ? (
          <>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your email and we'll send you a 6-digit code.
            </Text>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              style={{ marginTop: spacing.lg, width: '100%' }}
            />
            <Button title="Send code" onPress={sendCode} loading={loading} style={{ width: '100%', marginTop: spacing.sm }} />
          </>
        ) : (
          <>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              If {email.trim().toLowerCase()} is registered, we sent it a code. Enter it below with your new password.
            </Text>
            <Input
              label="6-digit code"
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="123456"
              keyboardType="number-pad"
              style={{ marginTop: spacing.lg, width: '100%' }}
            />
            <Input
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              style={{ width: '100%' }}
            />
            <Button title="Reset password" onPress={handleReset} loading={loading} style={{ width: '100%', marginTop: spacing.sm }} />
            <View style={styles.resendRow}>
              {secondsLeft > 0 ? (
                <Text style={{ color: theme.colors.textSecondary }}>Resend code in {secondsLeft}s</Text>
              ) : (
                <TouchableOpacity onPress={resend}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', marginTop: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', marginTop: spacing.md },
  subtitle: { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
  resendRow: { marginTop: spacing.lg },
});
