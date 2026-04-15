import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { childLogAPI } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

const CATEGORIES = ['all', 'health', 'behavior', 'homework', 'event', 'other'];

const categoryIcon = {
  health: 'medkit',
  behavior: 'happy',
  homework: 'book',
  event: 'star',
  other: 'ellipsis-horizontal',
};

const categoryVariant = {
  health: 'error',
  behavior: 'warning',
  homework: 'info',
  event: 'primary',
  other: 'neutral',
};

export default function ChildLogScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { couple } = useSelector((s) => s.couple);
  const [activeCategory, setActiveCategory] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // In a real app, you'd pick which child. Using first child for demo.
  const children = couple?.children || [];
  const firstChild = children[0];

  const fetchLogs = useCallback(async () => {
    if (!firstChild?.id) return;
    try {
      setLoading(true);
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      const res = await childLogAPI.getLogs(firstChild.id, params);
      setLogs(res.data.logs || []);
    } catch (_) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [firstChild?.id, activeCategory]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const renderLog = ({ item }) => (
    <Card style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: colors[categoryVariant[item.category] === 'error' ? 'errorLight' : categoryVariant[item.category] === 'warning' ? 'warningLight' : 'infoLight'] || colors.primaryFaded }]}>
          <Ionicons
            name={categoryIcon[item.category] || 'document-text'}
            size={18}
            color={colors[categoryVariant[item.category] === 'error' ? 'error' : categoryVariant[item.category] === 'warning' ? 'warning' : 'info'] || colors.primary}
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.logMeta}>
            <Badge label={item.category} variant={categoryVariant[item.category] || 'neutral'} />
            {item.isUrgent && <Badge label="URGENT" variant="error" />}
          </View>
          <Text style={styles.logDate}>
            {new Date(item.logDate).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        {!item.isReadByOtherParent && (
          <View style={styles.unreadDot} />
        )}
      </View>
      {item.title && <Text style={styles.logTitle}>{item.title}</Text>}
      <Text style={styles.logContent} numberOfLines={3}>{item.content}</Text>
      {item.attachments?.length > 0 && (
        <View style={styles.attachRow}>
          <Ionicons name="attach" size={14} color={colors.textTertiary} />
          <Text style={styles.attachText}>{item.attachments.length} attachment{item.attachments.length > 1 ? 's' : ''}</Text>
        </View>
      )}
    </Card>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Child Log</Text>
        {firstChild && <Text style={styles.headerSub}>{firstChild.name}</Text>}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddLog')}
        >
          <Ionicons name="add" size={22} color={colors.white} />
          <Text style={styles.addBtnText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.filterWrap}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Logs List */}
      {!couple ? (
        <EmptyState
          icon="people-outline"
          title="No co-parent connected"
          subtitle="Connect with your co-parent to share child logs."
        />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="journal-outline"
              title="No log entries yet"
              subtitle="Record health, behavior, homework and other important moments."
              actionLabel="Add First Entry"
              onAction={() => navigation.navigate('AddLog')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.white, flex: 1 },
  headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginRight: spacing.md },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.round,
  },
  addBtnText: { ...typography.label, color: colors.white },
  filterWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.round, marginRight: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.label, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  logCard: { marginBottom: spacing.sm },
  logHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  categoryIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  logMeta: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  logDate: { ...typography.caption, color: colors.textTertiary, marginTop: 4 },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary, marginTop: 4,
  },
  logTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  logContent: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  attachText: { ...typography.caption, color: colors.textTertiary },
});
