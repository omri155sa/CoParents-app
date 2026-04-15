import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { expenseAPI } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

const STATUSES = ['all', 'pending', 'approved', 'rejected'];

const categoryIcon = {
  activities: 'football',
  medical: 'medkit',
  education: 'school',
  clothes: 'shirt',
  food: 'restaurant',
  other: 'cube',
};

export default function ExpensesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((s) => s.auth);
  const { couple } = useSelector((s) => s.couple);
  const coupleId = couple?.id;

  const [activeStatus, setActiveStatus] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!coupleId) return;
    try {
      setLoading(true);
      const params = activeStatus !== 'all' ? { approvalStatus: activeStatus } : {};
      const [expRes, sumRes] = await Promise.all([
        expenseAPI.list(coupleId, params),
        expenseAPI.summary(coupleId, {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        }),
      ]);
      setExpenses(expRes.data.expenses || []);
      setSummary(sumRes.data.summary || null);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [coupleId, activeStatus]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleApprove = async (expenseId) => {
    try {
      await expenseAPI.approve(coupleId, expenseId);
      fetchExpenses();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not approve expense.');
    }
  };

  const handleReject = async (expenseId) => {
    Alert.prompt('Reject Expense', 'Enter a reason (optional):', async (reason) => {
      try {
        await expenseAPI.reject(coupleId, expenseId, reason || '');
        fetchExpenses();
      } catch (err) {
        Alert.alert('Error', err.response?.data?.message || 'Could not reject expense.');
      }
    });
  };

  const statusVariant = { pending: 'warning', approved: 'success', rejected: 'error' };

  const renderExpense = ({ item }) => {
    const canApprove = item.approvalStatus === 'pending' && item.paidBy !== user?.id;
    return (
      <Card style={styles.expCard}>
        <View style={styles.expRow}>
          <View style={[styles.catIcon, { backgroundColor: colors.primaryFaded }]}>
            <Ionicons name={categoryIcon[item.category] || 'cube'} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.expDesc}>{item.description || item.category}</Text>
            <Text style={styles.expDate}>
              {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.expAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
            <Badge label={item.approvalStatus} variant={statusVariant[item.approvalStatus] || 'neutral'} />
          </View>
        </View>

        {item.rejectionReason && (
          <Text style={styles.rejectReason}>Reason: {item.rejectionReason}</Text>
        )}

        {canApprove && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item.id)}
            >
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleReject(item.id)}
            >
              <Ionicons name="close" size={16} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  const pendingCount = expenses.filter((e) => e.approvalStatus === 'pending').length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Expenses</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>${(summary.total || 0).toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>This Month</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>${(summary.myShare || 0).toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>My Share</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, pendingCount > 0 && { color: colors.warning }]}>
                {pendingCount}
              </Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, activeStatus === s && styles.filterChipActive]}
            onPress={() => setActiveStatus(s)}
          >
            <Text style={[styles.filterText, activeStatus === s && styles.filterTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {!coupleId ? (
        <EmptyState icon="people-outline" title="No co-parent connected" />
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No expenses found"
              subtitle="Track shared expenses for your children."
              actionLabel="Add Expense"
              onAction={() => navigation.navigate('AddExpense')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.white },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { ...typography.h3, color: colors.white },
  summaryLabel: { ...typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: spacing.sm },
  filterRow: {
    flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.round, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.label, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  expCard: { marginBottom: spacing.sm },
  expRow: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expDesc: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  expDate: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  expAmount: { ...typography.h4, color: colors.textPrimary, marginBottom: 4 },
  rejectReason: { ...typography.caption, color: colors.error, fontStyle: 'italic', marginTop: spacing.sm },
  actionRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1.5,
  },
  approveBtn: { borderColor: colors.success, backgroundColor: colors.successLight },
  rejectBtn: { borderColor: colors.error, backgroundColor: colors.errorLight },
  actionText: { ...typography.label },
});
