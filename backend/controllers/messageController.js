const { Message, User, Notification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const { Op } = require('sequelize');

/**
 * Simple heuristic tone analysis.
 * Returns 'warning' if the message contains aggressive patterns, 'positive' for positive ones.
 */
const analyzeTone = (content) => {
  const lower = content.toLowerCase();
  const warningPatterns = /\b(never|always|hate|stupid|idiot|useless|terrible|worst|liar|lying)\b/;
  const positivePatterns = /\b(thank|thanks|appreciate|great|wonderful|happy|agree|love|good job)\b/;
  if (warningPatterns.test(lower)) return 'warning';
  if (positivePatterns.test(lower)) return 'positive';
  return 'neutral';
};

const sendMessage = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { content, attachments } = req.body;

    const recipientId =
      req.couple.user1_id === req.user.id ? req.couple.user2_id : req.couple.user1_id;

    const toneFlag = analyzeTone(content);

    const message = await Message.create({
      couple_id: coupleId,
      senderUser_id: req.user.id,
      recipientUser_id: recipientId,
      content,
      toneFlag,
      attachments: attachments || [],
    });

    // Push notification for the recipient
    await notificationService.createNotification({
      userId: recipientId,
      type: 'message',
      title: `New message from ${req.user.firstName}`,
      content: content.substring(0, 80) + (content.length > 80 ? '...' : ''),
      relatedEntityId: message.id,
      relatedEntityType: 'message',
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { before, limit = 30 } = req.query;

    const where = { couple_id: coupleId };
    if (before) where.createdAt = { [Op.lt]: new Date(before) };

    const messages = await Message.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar_url'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
    });

    // Mark received messages as read
    await Message.update(
      { readAt: new Date() },
      {
        where: {
          couple_id: coupleId,
          recipientUser_id: req.user.id,
          readAt: null,
        },
      }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

const markMessageRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      where: { id: messageId, recipientUser_id: req.user.id },
    });
    if (!message) throw new AppError('Message not found', 404);

    await message.update({ readAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getMessages, markMessageRead };
