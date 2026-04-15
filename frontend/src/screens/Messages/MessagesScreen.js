import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { messageAPI } from '../../services/api';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';

const TONE_META = {
  neutral: { color: colors.textTertiary, icon: 'remove', label: 'Neutral' },
  positive: { color: colors.success, icon: 'happy', label: 'Positive' },
  warning: { color: colors.warning, icon: 'alert-circle', label: 'Tense' },
};

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const { user } = useSelector((s) => s.auth);
  const { couple } = useSelector((s) => s.couple);
  const coupleId = couple?.id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const coParentId = user?.id === couple?.user1_id ? couple?.user2_id : couple?.user1_id;
  const coParentName = coParentId === couple?.user2_id
    ? `${couple?.user2?.firstName || ''} ${couple?.user2?.lastName || ''}`.trim()
    : `${couple?.user1?.firstName || ''} ${couple?.user1?.lastName || ''}`.trim();

  const fetchMessages = useCallback(async () => {
    if (!coupleId) return;
    try {
      const res = await messageAPI.list(coupleId, { limit: 50 });
      const msgs = res.data.messages || [];
      setMessages(msgs.reverse());
    } catch (_) {}
  }, [coupleId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !coupleId) return;
    setSending(true);
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: text,
      senderUser_id: user?.id,
      createdAt: new Date().toISOString(),
      toneFlag: 'neutral',
      _pending: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    try {
      const res = await messageAPI.send(coupleId, text);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...res.data.message, _pending: false } : m))
      );
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      Alert.alert('Error', 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.senderUser_id === user?.id;
    const tone = TONE_META[item.toneFlag] || TONE_META.neutral;
    const prev = messages[index - 1];
    const showAvatar = !isMe && (!prev || prev.senderUser_id !== item.senderUser_id);
    const showTime =
      !messages[index + 1] ||
      messages[index + 1].senderUser_id !== item.senderUser_id ||
      new Date(messages[index + 1]?.createdAt) - new Date(item.createdAt) > 300000;

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.avatarWrap}>
            {showAvatar ? (
              <Avatar name={coParentName || 'C'} size="sm" color={colors.parent2} />
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>
        )}
        <View style={{ maxWidth: '75%' }}>
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleThem,
              item._pending && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
              {item.content}
            </Text>
          </View>
          {showTime && (
            <View style={[styles.metaRow, isMe && { justifyContent: 'flex-end' }]}>
              {item.toneFlag && item.toneFlag !== 'neutral' && (
                <View style={[styles.tonePill, { backgroundColor: tone.color + '20' }]}>
                  <Ionicons name={tone.icon} size={12} color={tone.color} />
                  <Text style={[styles.toneText, { color: tone.color }]}>{tone.label}</Text>
                </View>
              )}
              <Text style={styles.timeText}>
                {new Date(item.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar name={coParentName || 'Co-parent'} size="md" color={colors.parent2} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.headerName}>{coParentName || 'Co-parent'}</Text>
          <Text style={styles.headerStatus}>
            {coupleId ? 'Connected' : 'Not connected'}
          </Text>
        </View>
        <View style={styles.toneIndicator}>
          <Ionicons name="analytics-outline" size={18} color={colors.primary} />
          <Text style={styles.toneIndicatorText}>Tone Analysis</Text>
        </View>
      </View>

      {/* Tone Info */}
      <View style={styles.toneBar}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.info} />
        <Text style={styles.toneBarText}>
          Messages are analyzed for tone to promote healthy communication
        </Text>
      </View>

      {/* Messages */}
      {!coupleId ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="people-outline"
            title="No co-parent connected"
            subtitle="Connect with your co-parent to start messaging."
          />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.msgList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              subtitle="Start a respectful conversation with your co-parent."
            />
          }
        />
      )}

      {/* Input */}
      {coupleId && (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.sm,
  },
  headerName: { ...typography.h4, color: colors.textPrimary },
  headerStatus: { ...typography.caption, color: colors.success, marginTop: 2 },
  toneIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryFaded,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.round,
  },
  toneIndicatorText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  toneBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  toneBarText: { ...typography.caption, color: colors.info, flex: 1 },
  msgList: { padding: spacing.md, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatarWrap: { marginRight: spacing.sm, alignSelf: 'flex-end' },
  bubble: {
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: 20, maxWidth: '100%',
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 6,
    ...shadow.sm,
  },
  bubbleText: { ...typography.body, lineHeight: 22 },
  bubbleTextMe: { color: colors.white },
  bubbleTextThem: { color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  timeText: { ...typography.caption, color: colors.textTertiary },
  tonePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.round,
  },
  toneText: { ...typography.caption, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 120,
    marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.textTertiary },
});
