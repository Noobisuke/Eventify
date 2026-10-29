import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, fontSize, radius } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await register(name.trim(), cleanEmail, password, role);
      Toast.show({ type: 'success', text1: 'Check your email', text2: 'We sent you a 6-digit code' });
      navigation.navigate('VerifyEmail', { email: cleanEmail });
    } catch (err) {
      if (err.code === 'INVALID_EMAIL') setErrors((prev) => ({ ...prev, email: err.message }));
      Toast.show({ type: 'error', text1: 'Registration failed', text2: err.message });
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Join and start discovering local events
        </Text>

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Jane Doe" error={errors.name} style={{ marginTop: spacing.lg }} autoCapitalize="words" />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" error={errors.email} />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry error={errors.password} />

        <Text style={[styles.label, { color: theme.colors.text }]}>I want to join as</Text>
        <View style={styles.roleRow}>
          {[
            { key: 'user', label: 'Attendee', icon: 'person-outline' },
            { key: 'organizer', label: 'Organizer', icon: 'megaphone-outline' },
          ].map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRole(r.key)}
              style={[
                styles.roleCard,
                {
                  borderColor: role === r.key ? theme.colors.primary : theme.colors.border,
                  backgroundColor: role === r.key ? theme.colors.primary + '20' : theme.colors.surface,
                },
              ]}
            >
              <Ionicons name={r.icon} size={22} color={role === r.key ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={{ color: role === r.key ? theme.colors.primary : theme.colors.text, fontWeight: '600', marginTop: 4 }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Sign Up" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.lg }} />

        <View style={styles.footer}>
          <Text style={{ color: theme.colors.textSecondary }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: '800' },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
});
