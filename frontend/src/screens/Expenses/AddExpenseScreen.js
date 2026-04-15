import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { expenseAPI } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';

const CATEGORIES = ['activities', 'medical', 'education', 'clothes', 'food', 'other'];

export default function AddExpenseScreen({ navigation }) {
  const { couple } = useSelector((s) => s.couple);
  const coupleId = couple?.id;
  const children = couple?.children || [];

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('activities');
  const [selectedChild, setSelectedChild] = useState(children[0]?.id || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) e.amount = 'Enter a valid amount';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await expenseAPI.add(coupleId, {
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        child_id: selectedChild || undefined,
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Submitted', 'Expense submitted for approval.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScreenHeader title="Add Expense" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Amount ($)"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          leftIcon="cash-outline"
          error={errors.amount}
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What was this expense for?"
          leftIcon="document-text-outline"
          error={errors.description}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipGrid}>
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

        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>For Child (optional)</Text>
            <View style={styles.chipGrid}>
              <TouchableOpacity
                style={[styles.chip, !selectedChild && styles.chipActive]}
                onPress={() => setSelectedChild(null)}
              >
                <Text style={[styles.chipText, !selectedChild && styles.chipTextActive]}>General</Text>
              </TouchableOpacity>
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
          </View>
        )}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noteText}>
            This expense will be sent to your co-parent for approval before being counted.
          </Text>
        </View>

        <Button title="Submit Expense" onPress={handleSave} loading={loading} size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.md },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.round, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryFaded },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  note: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: colors.infoLight, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg, alignItems: 'flex-start',
  },
  noteText: { ...typography.bodySmall, color: colors.info, flex: 1, lineHeight: 20 },
});
