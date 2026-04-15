import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must include a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const result = await dispatch(registerUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    }));
    if (registerUser.rejected.match(result)) {
      Alert.alert('Registration Failed', result.payload || 'Could not create account.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join CoParent Hub today</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.nameRow}>
          <Input
            label="First Name"
            value={form.firstName}
            onChangeText={set('firstName')}
            placeholder="John"
            leftIcon="person-outline"
            error={errors.firstName}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChangeText={set('lastName')}
            placeholder="Doe"
            error={errors.lastName}
            style={{ flex: 1 }}
          />
        </View>

        <Input
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
          error={errors.email}
        />

        <Input
          label="Password"
          value={form.password}
          onChangeText={set('password')}
          placeholder="Min 8 chars, uppercase, number"
          secureTextEntry
          leftIcon="lock-closed-outline"
          error={errors.password}
        />

        <Input
          label="Confirm Password"
          value={form.confirmPassword}
          onChangeText={set('confirmPassword')}
          placeholder="Repeat your password"
          secureTextEntry
          leftIcon="lock-closed-outline"
          error={errors.confirmPassword}
        />

        <View style={styles.requirements}>
          {[
            { label: 'At least 8 characters', met: form.password.length >= 8 },
            { label: 'One uppercase letter', met: /[A-Z]/.test(form.password) },
            { label: 'One number', met: /[0-9]/.test(form.password) },
          ].map((req) => (
            <View key={req.label} style={styles.reqRow}>
              <Ionicons
                name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={req.met ? colors.success : colors.textTertiary}
              />
              <Text style={[styles.reqText, req.met && styles.reqMet]}>{req.label}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          style={styles.btn}
          size="lg"
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
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
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  nameRow: { flexDirection: 'row' },
  requirements: {
    backgroundColor: colors.primaryFaded,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reqText: { ...typography.bodySmall, color: colors.textTertiary, marginLeft: 6 },
  reqMet: { color: colors.success },
  btn: { marginBottom: spacing.lg },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginPrompt: { ...typography.body, color: colors.textSecondary },
  loginLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
