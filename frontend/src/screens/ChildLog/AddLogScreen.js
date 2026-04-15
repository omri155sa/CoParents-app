import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { childLogAPI } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';

const CATEGORIES = ['health', 'behavior', 'homework', 'event', 'other'];

export default function AddLogScreen({ navigation }) {
  const { couple } = useSelector((s) => s.couple);
  const children = couple?.children || [];

  const [selectedChild, setSelectedChild] = useState(children[0]?.id || null);
  const [category, setCategory] = useState('health');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!selectedChild) e.child = 'Please select a child';
    if (!content.trim()) e.content = 'Log content is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await childLogAPI.addLog(selectedChild, {
        category,
        title: title.trim(),
        content: content.trim(),
        isUrgent,
        logDate: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Saved', 'Log entry added successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save log entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScreenHeader title="New Log Entry" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Child Selector */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Child</Text>
            <View style={styles.chipRow}>
              {children.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selectedChild === c.id && styles.chipActive]}
                  onPress={() => setSelectedChild(c.id)}
                >
                  <Text style={[styles.chipText, selectedChild === c.id && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.child && <Text style={styles.errorText}>{errors.child}</Text>}
          </View>
        )}

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Title (optional)"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Fever at school"
          leftIcon="text-outline"
        />

        <Input
          label="Description"
          value={content}
          onChangeText={setContent}
          placeholder="Describe what happened..."
          multiline
          numberOfLines={5}
          error={errors.content}
        />

        {/* Urgent Toggle */}
        <View style={styles.urgentRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.urgentLabel}>Mark as Urgent</Text>
            <Text style={styles.urgentSub}>Co-parent will be notified immediately</Text>
          </View>
          <Switch
            value={isUrgent}
            onValueChange={setIsUrgent}
            trackColor={{ false: colors.border, true: colors.error }}
            thumbColor={colors.white}
          />
        </View>

        <Button
          title="Save Log Entry"
          onPress={handleSave}
          loading={loading}
          size="lg"
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.md },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.round, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryFaded },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  urgentRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  urgentLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  urgentSub: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  errorText: { ...typography.caption, color: colors.error, marginTop: 4 },
});
