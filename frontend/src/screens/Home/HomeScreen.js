import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { scheduleAPI, expenseAPI, reportAPI } from '../../services/api';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((s) => s.auth);
  const { couple } = useSelector((s) => s.couple);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState(0);

  const firstName = user?.firstName || 'Parent';
  const coupleId = couple?.id;

  const load = useCallback(async () => {
    if (!coupleId) return;
    try {
      const [schedRes, expRes] = await Promise.all([
        scheduleAPI.get(coupleId, {
          startDate: new Date().toISOString().split('T')[0],
          limit: 3,
        }),
        expenseAPI.list(coupleId, { approvalStatus: 'pending', limit: 5 }),
      ]);
      setUpcomingSchedule(schedRes.data.schedules?.slice(0, 3) || []);
      setPendingExpenses(expRes.data.expenses?.length || 0);
    } catch (_) {}
  }, [coupleId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { icon: 'calendar-outline', label: 'Schedule', color: colors.primary, tab: 'CalendarTab' },
    { icon: 'journal-outline', label: 'Child Log', color: '#7B61FF', tab: 'ChildLogTab' },
    { icon: 'card-outline', label: 'Expenses', color: colors.warning, tab: 'ExpensesTab' },
    { icon: 'chatbubbles-outline', label: 'Messages', color: colors.success, tab: 'MessagesTab' },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <Avatar name={`${user?.firstName} ${user?.lastName}`} size="md" color="rgba(255,255,255,0.3)" />
        </View>

        {couple ? (
          <View style={styles.coupleChip}>
            <Ionicons name="people" size={14} color={colors.white} />
            <Text style={styles.coupleChipText}>Connected with co-parent</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.setupBanner}
            onPress={() => navigation.navigate('CoupleSetup')}
          >
            <Ionicons name="link-outline" size={18} color={colors.primary} />
            <Text style={styles.setupBannerText}>Connect with your co-parent →</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickCard}
              onPress={() => navigation.navigate(a.tab)}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color + '22' }]}>
                <Ionicons name={a.icon} size={26} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Alerts */}
        {pendingExpenses > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('ExpensesTab')}>
            <Card style={styles.alertCard}>
              <View style={styles.alertRow}>
                <View style={[styles.alertDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.alertText}>
                  {pendingExpenses} expense{pendingExpenses > 1 ? 's' : ''} waiting for approval
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Upcoming Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CalendarTab')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {upcomingSchedule.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <View style={{ alignItems: 'center', padding: spacing.md }}>
              <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No upcoming schedule</Text>
              <Text style={styles.emptySubText}>
                {coupleId ? 'Add events to your custody calendar' : 'Connect with your co-parent first'}
              </Text>
            </View>
          </Card>
        ) : (
          upcomingSchedule.map((s) => (
            <Card key={s.id} style={styles.scheduleCard}>
              <View style={styles.scheduleRow}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{new Date(s.startDate).getDate()}</Text>
                  <Text style={styles.dateMon}>{new Date(s.startDate).toLocaleString('en', { month: 'short' })}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.scheduleTitle}>Custody Day</Text>
                  <Text style={styles.scheduleDetail}>{s.reason || 'Regular schedule'}</Text>
                </View>
                <Badge label={s.requestStatus || 'confirmed'} variant={s.requestStatus === 'confirmed' ? 'success' : 'warning'} />
              </View>
            </Card>
          ))
        )}

        {/* Summary Cards */}
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: colors.primaryFaded }]} noPad>
            <View style={{ padding: spacing.md }}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
              <Text style={styles.statNum}>—</Text>
              <Text style={styles.statLabel}>Custody Days</Text>
            </View>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: colors.warningLight }]} noPad>
            <View style={{ padding: spacing.md }}>
              <Ionicons name="card" size={24} color={colors.warning} />
              <Text style={styles.statNum}>—</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  greeting: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)' },
  userName: { ...typography.h2, color: colors.white },
  coupleChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.round,
    gap: 4,
  },
  coupleChipText: { ...typography.caption, color: colors.white },
  setupBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  setupBannerText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  body: { padding: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.sm },
  seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  quickCard: {
    flex: 1, minWidth: '40%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickLabel: { ...typography.label, color: colors.textSecondary },
  alertCard: { marginBottom: spacing.md, backgroundColor: colors.warningLight },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1, fontWeight: '500' },
  emptyCard: { marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, fontWeight: '500' },
  emptySubText: { ...typography.bodySmall, color: colors.textTertiary, marginTop: 4, textAlign: 'center' },
  scheduleCard: { marginBottom: spacing.sm },
  scheduleRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: {
    width: 48, height: 52,
    backgroundColor: colors.primaryFaded,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { ...typography.h3, color: colors.primary, lineHeight: 22 },
  dateMon: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  scheduleTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  scheduleDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, shadowOpacity: 0, elevation: 0 },
  statNum: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
