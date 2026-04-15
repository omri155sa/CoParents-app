const { Op } = require('sequelize');
const { ChildLog, Child, User, Couple } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/** Verify the requesting user is a parent of the child's couple. */
const verifyChildAccess = async (childId, userId) => {
  const child = await Child.findByPk(childId, {
    include: [{ model: Couple }],
  });
  if (!child) throw new AppError('Child not found', 404);

  const couple = child.Couple;
  if (couple.user1_id !== userId && couple.user2_id !== userId) {
    throw new AppError('Access denied', 403);
  }
  return { child, couple };
};

const addLog = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { logDate, category, title, content, isUrgent, attachments } = req.body;

    const { child, couple } = await verifyChildAccess(childId, req.user.id);

    const log = await ChildLog.create({
      child_id: childId,
      parent_id: req.user.id,
      logDate,
      category,
      title,
      content,
      isUrgent: isUrgent || false,
      attachments: attachments || [],
    });

    // Notify the other parent
    const notifTitle = isUrgent ? `URGENT: New log for ${child.name}` : `New log for ${child.name}`;
    const notifContent = `${req.user.firstName} added a [${category}] entry: ${title || content.substring(0, 60)}`;

    await notificationService.notifyOtherParent(
      couple,
      req.user.id,
      'log',
      notifTitle,
      notifContent,
      { relatedEntityId: log.id, relatedEntityType: 'childLog' }
    );

    logger.info('Child log created', { logId: log.id, childId, isUrgent });
    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { category, from, to, urgent, page = 1, limit = 20 } = req.query;

    await verifyChildAccess(childId, req.user.id);

    const where = { child_id: childId };
    if (category) where.category = category;
    if (urgent === 'true') where.isUrgent = true;
    if (from && to) where.logDate = { [Op.between]: [from, to] };

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: logs } = await ChildLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'avatar_url'] }],
      order: [['logDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    // Mark logs written by the other parent as read
    await ChildLog.update(
      { isReadByOtherParent: true, readAt: new Date() },
      { where: { child_id: childId, parent_id: { [Op.ne]: req.user.id }, isReadByOtherParent: false } }
    );

    res.json({
      success: true,
      logs,
      pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) {
    next(err);
  }
};

const updateLog = async (req, res, next) => {
  try {
    const { childId, logId } = req.params;

    await verifyChildAccess(childId, req.user.id);

    const log = await ChildLog.findOne({ where: { id: logId, child_id: childId } });
    if (!log) throw new AppError('Log entry not found', 404);

    // Only the author can edit
    if (log.parent_id !== req.user.id) throw new AppError('Only the author can edit this log', 403);

    const { logDate, category, title, content, isUrgent, attachments } = req.body;
    await log.update({ logDate, category, title, content, isUrgent, attachments });

    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const { childId } = req.params;
    await verifyChildAccess(childId, req.user.id);

    const { sequelize } = require('../models');
    const [categoryCounts] = await sequelize.query(
      `SELECT category, COUNT(*) as count FROM child_logs WHERE child_id = :childId GROUP BY category`,
      { replacements: { childId }, type: sequelize.QueryTypes.SELECT }
    );

    const urgentCount = await ChildLog.count({ where: { child_id: childId, isUrgent: true } });
    const totalCount = await ChildLog.count({ where: { child_id: childId } });

    const recentUrgent = await ChildLog.findAll({
      where: { child_id: childId, isUrgent: true },
      order: [['logDate', 'DESC']],
      limit: 5,
    });

    res.json({ success: true, summary: { totalCount, urgentCount, categoryCounts, recentUrgent } });
  } catch (err) {
    next(err);
  }
};

module.exports = { addLog, getLogs, updateLog, getSummary };
