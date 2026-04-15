import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

const MenuItem = ({ icon, label, value, onPress, rightEl, variant = 'default' }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: variant === 'danger' ? colors.errorLight : colors.primaryFaded }]}>
      <Ionicons name={icon} size={20} color={variant === 'danger' ? colors.error : colors.primary} />
    </View>
    <Text style={[styles.menuLabel, variant === 'danger' && styles.menuLabelDanger]}>{label}</Text>
    <View style={{ flex: 1 }} />
    {value && <Text style={styles.menuValue}>{value}</Text>}
    {rightEl || <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { couple } = useSelector((s) => s.couple);
  const [notifications, setNotifications] = useState(true);

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const roleLabel = { parent: 'Parent', lawyer: 'Lawyer', mediator: 'Mediator' };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Profile Header */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Avatar
          name={fullName}
          size="xl"
          color="rgba(255,255,255,0.25)"
          style={{ marginBottom: spacing.md }}
        />
        <Text style={styles.profileName}>{fullName}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.badgeRow}>
          <Badge label={roleLabel[user?.role] || 'Parent'} variant="primary" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          {user?.isEmailVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Co-parent Status */}
        <Card style={styles.coupleCard}>
          <View style={styles.coupleRow}>
            <View style={[styles.coupleIcon, { backgroundColor: couple ? colors.successLight : colors.warningLight }]}>
              <Ionicons name="people" size={22} color={couple ? colors.success : colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.coupleTitle}>Co-parent Connection</Text>
              <Text style={styles.coupleStatus}>
                {couple ? 'Connected & Active' : 'Not connected yet'}
              </Text>
            </View>
            <Badge label={couple ? 'Active' : 'Pending'} variant={couple ? 'success' : 'warning'} />
          </View>
        </Card>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card noPad style={styles.menuCard}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="shield-outline" label="Privacy & Security" onPress={() => {}} />
        </Card>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card noPad style={styles.menuCard}>
          <MenuItem
            icon="notifications-outline"
            label="Push Notifications"
            onPress={() => setNotifications(!notifications)}
            rightEl={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
          <View style={styles.divider} />
          <MenuItem icon="language-outline" label="Language" value="English" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="color-palette-outline" label="Appearance" value="System" onPress={() => {}} />
        </Card>

        {/* App Info */}
        <Text style={styles.sectionTitle}>About</Text>
        <Card noPad style={styles.menuCard}>
          <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="information-circle-outline" label="App Version" value="1.0.0" onPress={() => {}} />
        </Card>

        {/* Sign Out */}
        <Card noPad style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            variant="danger"
            rightEl={null}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  profileName: { ...typography.h2, color: colors.white, marginBottom: 4 },
  profileEmail: { ...typography.bodySmall, color: 'rgba(255,255,255,0.75)', marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.round,
  },
  verifiedText: { ...typography.caption, color: colors.white },
  body: { padding: spacing.lg },
  coupleCard: { marginBottom: spacing.lg },
  coupleRow: { flexDirection: 'row', alignItems: 'center' },
  coupleIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  coupleTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  coupleStatus: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.md,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...typography.body, color: colors.textPrimary },
  menuLabelDanger: { color: colors.error },
  menuValue: { ...typography.bodySmall, color: colors.textTertiary, marginRight: spacing.xs },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 70 },
});
