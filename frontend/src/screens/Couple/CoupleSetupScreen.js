import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { coupleAPI } from '../../services/api';
import { setCouple } from '../../store/slices/coupleSlice';
import { colors, spacing, typography, radius } from '../../theme';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function CoupleSetupScreen({ navigation }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdInvite, setCreatedInvite] = useState(null);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await coupleAPI.create({});
      const couple = res.data.couple;
      dispatch(setCouple(couple));
      // Generate invite
      const invRes = await coupleAPI.invite(couple.id);
      setCreatedInvite(invRes.data.inviteToken || 'Check your app for the invite code');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not create connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Required', 'Please enter the invite code from your co-parent.');
      return;
    }
    setLoading(true);
    try {
      const res = await coupleAPI.acceptInvite(inviteCode.trim());
      dispatch(setCouple(res.data.couple));
      Alert.alert('Connected!', 'You are now connected with your co-parent.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired invite code.');
    } finally {
      setLoading(false);
    }
  };

  if (createdInvite) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Co-parent</Text>
        </LinearGradient>
        <View style={styles.successBody}>
          <View style={styles.successIcon}>
            <Ionicons name="link" size={48} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Invite Code Created!</Text>
          <Text style={styles.successSub}>Share this code with your co-parent:</Text>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeText}>{createdInvite}</Text>
          </View>
          <Text style={styles.inviteNote}>The code expires in 24 hours</Text>
          <Button
            title="Done"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.root}>
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connect with Co-parent</Text>
          <Text style={styles.headerSub}>Link your accounts to share schedules and logs</Text>
        </LinearGradient>

        <ScrollView style={styles.body} contentContainerStyle={{ padding: spacing.lg }}>
          {!mode ? (
            <>
              <Text style={styles.chooseTitle}>How would you like to connect?</Text>
              <TouchableOpacity style={styles.modeCard} onPress={() => setMode('create')}>
                <View style={[styles.modeIcon, { backgroundColor: colors.primaryFaded }]}>
                  <Ionicons name="person-add" size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.modeTitle}>Invite Co-parent</Text>
                  <Text style={styles.modeSub}>Generate an invite code to send to your co-parent</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeCard} onPress={() => setMode('join')}>
                <View style={[styles.modeIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="enter" size={28} color={colors.success} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.modeTitle}>Join with Code</Text>
                  <Text style={styles.modeSub}>Enter the invite code you received</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </>
          ) : mode === 'create' ? (
            <View>
              <Text style={styles.chooseTitle}>Create Connection</Text>
              <Text style={styles.chooseSub}>
                Tap the button below to generate an invite code. Share it with your co-parent so they can connect with you.
              </Text>
              <Button
                title="Generate Invite Code"
                onPress={handleCreate}
                loading={loading}
                size="lg"
                style={{ marginTop: spacing.xl }}
              />
              <Button
                title="Back"
                onPress={() => setMode(null)}
                variant="ghost"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.chooseTitle}>Enter Invite Code</Text>
              <Text style={styles.chooseSub}>
                Ask your co-parent to share their invite code with you.
              </Text>
              <Input
                label="Invite Code"
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Paste invite code here"
                leftIcon="key-outline"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                title="Connect"
                onPress={handleJoin}
                loading={loading}
                size="lg"
                style={{ marginTop: spacing.sm }}
              />
              <Button
                title="Back"
                onPress={() => setMode(null)}
                variant="ghost"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}
        </ScrollView>
      </View>
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
  headerTitle: { ...typography.h2, color: colors.white },
  headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  body: { flex: 1 },
  chooseTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  chooseSub: { ...typography.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  modeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  modeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  modeSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 3 },
  // Success
  successBody: { flex: 1, alignItems: 'center', padding: spacing.xl },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  successSub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  inviteCodeBox: {
    backgroundColor: colors.primaryFaded,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 2, borderColor: colors.primary,
    borderStyle: 'dashed', width: '100%', alignItems: 'center',
  },
  inviteCodeText: { ...typography.h3, color: colors.primary, letterSpacing: 2 },
  inviteNote: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm },
});
