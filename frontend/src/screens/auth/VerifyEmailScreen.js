import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import Button from '../../components/Button';
import { spacing, fontSize, radius } from '../../constants/theme';

const RESEND_SECONDS = 60;

export default function VerifyEmailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { verifyEmail } = useAuth();
  const email = route.params?.email;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // Countdown until "Resend code" is allowed again
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit code' });
      return;
    }
    setLoading(true);
    try {
      // On success AuthContext stores the session and the app switches to the main screens
      await verifyEmail(email, code);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Verification failed', text2: err.message });
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendVerification(email);
      setSecondsLeft(RESEND_SECONDS);
      setCode('');
      Toast.show({ type: 'success', text1: 'New code sent', text2: 'Check your inbox (and spam folder)' });
    } catch (err) {
      if (err.retryAfter) setSecondsLeft(err.retryAfter);
      Toast.show({ type: 'error', text1: 'Could not resend', text2: err.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name="mail-open-outline" size={40} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Verify your email</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          We sent a 6-digit code to
        </Text>
        <Text style={[styles.email, { color: theme.colors.text }]}>{email}</Text>

        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="••••••"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          style={[
            styles.codeInput,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text },
          ]}
        />

        <Button title="Verify" onPress={handleVerify} loading={loading} style={{ width: '100%' }} />

        <View style={styles.resendRow}>
          <Text style={{ color: theme.colors.textSecondary }}>Didn't get it? </Text>
          {secondsLeft > 0 ? (
            <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Resend in {secondsLeft}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {resending ? 'Sending...' : 'Resend code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          The code expires in 10 minutes. Check your spam folder if you can't find it.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', marginTop: spacing.md },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: '800', marginTop: spacing.lg },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.sm },
  email: { fontSize: fontSize.md, fontWeight: '700', marginTop: 2, marginBottom: spacing.lg },
  codeInput: {
    width: '100%',
    height: 60,
    borderWidth: 1.5,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 10,
    marginBottom: spacing.lg,
  },
  resendRow: { flexDirection: 'row', marginTop: spacing.lg },
  hint: { fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.md },
});
