import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { scheduleAPI } from '../../services/api';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

const today = new Date().toISOString().split('T')[0];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((s) => s.auth);
  const { couple } = useSelector((s) => s.couple);
  const coupleId = couple?.id;

  const [selectedDate, setSelectedDate] = useState(today);
  const [markedDates, setMarkedDates] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [daySchedules, setDaySchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [swapReason, setSwapReason] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  const isParent1 = couple?.user1_id === user?.id;

  const fetchSchedule = useCallback(async () => {
    if (!coupleId) return;
    try {
      setLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];
      const res = await scheduleAPI.get(coupleId, { startDate: firstDay, endDate: lastDay });
      const data = res.data.schedules || [];
      setSchedules(data);
      buildMarkedDates(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [coupleId, user?.id]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);
  useEffect(() => {
    const day = schedules.filter((s) => s.startDate === selectedDate);
    setDaySchedules(day);
  }, [selectedDate, schedules]);

  const buildMarkedDates = (data) => {
    const marks = {};
    data.forEach((s) => {
      const isMe = s.parent_responsible === user?.id;
      marks[s.startDate] = {
        marked: true,
        dotColor: isMe ? colors.primary : colors.parent2,
        selected: s.startDate === selectedDate,
        selectedColor: isMe ? colors.primary : colors.parent2,
      };
    });
    setMarkedDates(marks);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    const newMarks = { ...markedDates };
    Object.keys(newMarks).forEach((d) => {
      newMarks[d] = { ...newMarks[d], selected: false };
    });
    newMarks[day.dateString] = {
      ...(newMarks[day.dateString] || {}),
      selected: true,
      selectedColor: colors.primary,
    };
    setMarkedDates(newMarks);
  };

  const handleRequestSwap = async () => {
    if (!selectedScheduleId || !swapReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for the swap request.');
      return;
    }
    try {
      await scheduleAPI.requestChange(coupleId, {
        scheduleId: selectedScheduleId,
        reason: swapReason,
      });
      Alert.alert('Success', 'Swap request sent to your co-parent.');
      setShowModal(false);
      setSwapReason('');
      fetchSchedule();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not send swap request.');
    }
  };

  const handleApprove = async (scheduleId) => {
    try {
      await scheduleAPI.approveSwap(coupleId, scheduleId);
      Alert.alert('Approved', 'Swap request approved.');
      fetchSchedule();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not approve.');
    }
  };

  const statusBadge = (status) => {
    const map = {
      confirmed: 'success',
      pending_swap: 'warning',
      approved_swap: 'info',
      rejected_swap: 'error',
    };
    return map[status] || 'neutral';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Custody Calendar</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Your days</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.parent2 }]} />
            <Text style={styles.legendText}>Co-parent days</Text>
          </View>
        </View>
      </View>

      {/* Calendar */}
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.white,
          calendarBackground: colors.white,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.white,
          todayTextColor: colors.primary,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.textTertiary,
          dotColor: colors.primary,
          arrowColor: colors.primary,
          monthTextColor: colors.textPrimary,
          indicatorColor: colors.primary,
          textDayFontWeight: '400',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
      />

      {/* Day Detail */}
      <ScrollView
        style={styles.daySection}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.daySectionHeader}>
          <Text style={styles.dayTitle}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </Text>
          {coupleId && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setSelectedScheduleId(null);
                setShowModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {!coupleId ? (
          <EmptyState
            icon="people-outline"
            title="No co-parent connected"
            subtitle="Connect with your co-parent to see and manage the custody schedule."
          />
        ) : daySchedules.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No entries for this day"
            subtitle="Tap + to add a custody schedule entry."
          />
        ) : (
          daySchedules.map((s) => (
            <Card key={s.id} style={styles.scheduleCard}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
                    <Badge label={s.scheduleType} variant="primary" />
                    <Badge label={s.requestStatus} variant={statusBadge(s.requestStatus)} />
                  </View>
                  <Text style={styles.cardName}>
                    {s.parent_responsible === user?.id ? 'Your day' : "Co-parent's day"}
                  </Text>
                  {s.reason && <Text style={styles.cardReason}>{s.reason}</Text>}
                  {s.notes && <Text style={styles.cardNotes}>{s.notes}</Text>}
                </View>
              </View>
              {s.requestStatus === 'pending_swap' && s.requestedBy !== user?.id && (
                <View style={styles.actionRow}>
                  <Button
                    title="Approve Swap"
                    onPress={() => handleApprove(s.id)}
                    variant="success"
                    size="sm"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title="Decline"
                    onPress={() => {}}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                </View>
              )}
              {s.requestStatus === 'confirmed' && s.parent_responsible === user?.id && (
                <Button
                  title="Request Swap"
                  onPress={() => { setSelectedScheduleId(s.id); setShowModal(true); }}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: spacing.sm }}
                />
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Swap Request Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedScheduleId ? 'Request Day Swap' : 'Add Schedule Entry'}
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason (e.g. work travel, family event...)"
              value={swapReason}
              onChangeText={setSwapReason}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowModal(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Send Request" onPress={handleRequestSwap} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h3, color: colors.white, marginBottom: spacing.sm },
  legend: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  calendar: { borderBottomWidth: 1, borderBottomColor: colors.border },
  daySection: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  daySectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  dayTitle: { ...typography.h4, color: colors.textPrimary },
  addBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scheduleCard: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  cardReason: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  cardNotes: { ...typography.caption, color: colors.textTertiary, marginTop: 2, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', marginTop: spacing.md },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg },
  reasonInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, ...typography.body, color: colors.textPrimary,
    minHeight: 90, textAlignVertical: 'top', marginBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md },
});
