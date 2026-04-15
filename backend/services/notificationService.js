const { Notification, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Create an in-app notification and optionally send a push notification.
 */
const createNotification = async ({
  userId,
  type,
  title,
  content,
  relatedEntityId = null,
  relatedEntityType = null,
  sendPush = true,
}) => {
  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    content,
    relatedEntityId,
    relatedEntityType,
  });

  if (sendPush) {
    await sendPushNotification(userId, title, content, { relatedEntityId, relatedEntityType });
    await notification.update({ sentViaPush: true });
  }

  return notification;
};

/**
 * Send a Firebase push notification to a user's registered device.
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findByPk(userId, { attributes: ['id', 'fcmToken'] });
    if (!user?.fcmToken) return;

    // Only attempt if firebase-admin is configured
    if (!process.env.FIREBASE_PROJECT_ID) {
      logger.debug('Firebase not configured, skipping push notification');
      return;
    }

    const admin = require('firebase-admin');

    // Lazy-initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }

    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v ? String(v) : ''])
      ),
    });

    logger.debug('Push notification sent', { userId });
  } catch (error) {
    // Push failures are non-fatal
    logger.warn('Push notification failed', { userId, error: error.message });
  }
};

/**
 * Notify both parents of a couple about an event.
 */
const notifyBothParents = async (couple, type, title, content, options = {}) => {
  await Promise.all([
    createNotification({ userId: couple.user1_id, type, title, content, ...options }),
    createNotification({ userId: couple.user2_id, type, title, content, ...options }),
  ]);
};

/**
 * Notify the other parent (not the one who triggered the action).
 */
const notifyOtherParent = async (couple, actingUserId, type, title, content, options = {}) => {
  const otherUserId =
    couple.user1_id === actingUserId ? couple.user2_id : couple.user1_id;

  await createNotification({ userId: otherUserId, type, title, content, ...options });
};

/**
 * Mark notifications as read.
 */
const markAsRead = async (userId, notificationIds) => {
  await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id: notificationIds, user_id: userId } }
  );
};

/**
 * Get unread notification count for a user.
 */
const getUnreadCount = async (userId) =>
  Notification.count({ where: { user_id: userId, isRead: false } });

module.exports = {
  createNotification,
  notifyBothParents,
  notifyOtherParent,
  markAsRead,
  getUnreadCount,
};
