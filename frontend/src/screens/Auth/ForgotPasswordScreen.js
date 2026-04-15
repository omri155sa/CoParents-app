import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <Text style={styles.headerSub}>We'll send you a reset link</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {sent ? (
          <View style={styles.sentContainer}>
            <View style={styles.sentIcon}>
              <Ionicons name="mail-open" size={56} color={colors.success} />
            </View>
            <Text style={styles.sentTitle}>Check your inbox</Text>
            <Text style={styles.sentBody}>
              We sent a password reset link to {email}. Check your spam folder if you don't see it.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={{ marginTop: spacing.xl }}
            />
          </View>
        ) : (
          <>
            <Text style={styles.desc}>
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </Text>
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={error}
            />
            <Button
              title="Send Reset Link"
              onPress={handleSend}
              loading={loading}
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  backBtn: { marginBottom: spacing.md },
  headerTitle: { ...typography.h1, color: colors.white },
  headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  desc: { ...typography.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  sentContainer: { alignItems: 'center', paddingTop: spacing.xl },
  sentIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.successLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  sentTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  sentBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
