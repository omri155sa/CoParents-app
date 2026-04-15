const { Op } = require('sequelize');
const moment = require('moment');
const { CustodySchedule, CustodyRights, Child, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const getSchedule = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { start, end, childId } = req.query;

    const where = { couple_id: coupleId };
    if (start && end) {
      where.startDate = { [Op.between]: [start, end] };
    }
    if (childId) where.child_id = childId;

    const schedules = await CustodySchedule.findAll({
      where,
      include: [
        { model: Child, attributes: ['id', 'name'] },
        { model: User, as: 'responsibleParent', attributes: ['id', 'firstName', 'lastName', 'avatar_url'] },
      ],
      order: [['startDate', 'ASC']],
    });

    res.json({ success: true, schedules });
  } catch (err) {
    next(err);
  }
};

const requestScheduleChange = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { child_id, startDate, endDate, reason, newParentId } = req.body;

    // Verify child belongs to this couple
    const child = await Child.findOne({ where: { id: child_id, couple_id: coupleId } });
    if (!child) throw new AppError('Child not found in this couple', 404);

    // Find the existing confirmed schedule entry for that date range
    const existing = await CustodySchedule.findOne({
      where: {
        couple_id: coupleId,
        child_id,
        startDate: { [Op.lte]: startDate },
        [Op.or]: [{ endDate: { [Op.gte]: startDate } }, { endDate: null }],
        requestStatus: 'confirmed',
      },
    });

    if (!existing) throw new AppError('No confirmed schedule found for this date range', 404);

    // Create a new pending-swap entry
    const swapRequest = await CustodySchedule.create({
      couple_id: coupleId,
      child_id,
      startDate,
      endDate: endDate || startDate,
      parent_responsible: newParentId || (
        existing.parent_responsible === req.couple.user1_id
          ? req.couple.user2_id
          : req.couple.user1_id
      ),
      scheduleType: 'custom',
      reason,
      requestStatus: 'pending_swap',
      requestedBy: req.user.id,
      originalParent: existing.parent_responsible,
    });

    await notificationService.notifyOtherParent(
      req.couple,
      req.user.id,
      'schedule',
      'Custody Swap Request',
      `${req.user.firstName} has requested a custody swap for ${moment(startDate).format('DD/MM/YYYY')}.`,
      { relatedEntityId: swapRequest.id, relatedEntityType: 'schedule' }
    );

    logger.info('Schedule swap requested', { requestId: swapRequest.id, coupleId });
    res.status(201).json({ success: true, request: swapRequest });
  } catch (err) {
    next(err);
  }
};

const approveScheduleRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await CustodySchedule.findOne({
      where: { id: requestId, couple_id: req.couple.id, requestStatus: 'pending_swap' },
    });
    if (!request) throw new AppError('Swap request not found or already resolved', 404);

    // Only the other parent (not the requester) can approve
    if (request.requestedBy === req.user.id) {
      throw new AppError('You cannot approve your own swap request', 403);
    }

    await request.update({ requestStatus: 'approved_swap' });

    await notificationService.createNotification({
      userId: request.requestedBy,
      type: 'schedule',
      title: 'Swap Request Approved',
      content: `Your custody swap request for ${moment(request.startDate).format('DD/MM/YYYY')} was approved.`,
      relatedEntityId: request.id,
      relatedEntityType: 'schedule',
    });

    // Update custody rights
    await updateCustodyRights(req.couple.id, request);

    logger.info('Schedule swap approved', { requestId });
    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

const rejectScheduleRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await CustodySchedule.findOne({
      where: { id: requestId, couple_id: req.couple.id, requestStatus: 'pending_swap' },
    });
    if (!request) throw new AppError('Swap request not found or already resolved', 404);

    if (request.requestedBy === req.user.id) {
      throw new AppError('You cannot reject your own swap request', 403);
    }

    await request.update({ requestStatus: 'rejected_swap', reason });

    await notificationService.createNotification({
      userId: request.requestedBy,
      type: 'schedule',
      title: 'Swap Request Rejected',
      content: `Your custody swap request for ${moment(request.startDate).format('DD/MM/YYYY')} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
      relatedEntityId: request.id,
      relatedEntityType: 'schedule',
    });

    logger.info('Schedule swap rejected', { requestId });
    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

const getCustodyRights = async (req, res, next) => {
  try {
    const rights = await CustodyRights.findAll({
      where: { couple_id: req.params.coupleId },
      include: [{ model: User, foreignKey: 'parent_id', attributes: ['id', 'firstName', 'lastName'] }],
    });
    res.json({ success: true, rights });
  } catch (err) {
    next(err);
  }
};

// Helper: update accumulated days after an approved swap
const updateCustodyRights = async (coupleId, swapRequest) => {
  try {
    const start = moment(swapRequest.startDate);
    const end = moment(swapRequest.endDate || swapRequest.startDate);
    const days = end.diff(start, 'days') + 1;

    // Deduct from original parent, add to new parent
    const [origRights] = await CustodyRights.findOrCreate({
      where: { couple_id: coupleId, parent_id: swapRequest.originalParent },
      defaults: { accumulatedDays: 0, usedDays: 0 },
    });
    await origRights.increment('usedDays', { by: days });

    const [newRights] = await CustodyRights.findOrCreate({
      where: { couple_id: coupleId, parent_id: swapRequest.parent_responsible },
      defaults: { accumulatedDays: 0, usedDays: 0 },
    });
    await newRights.increment('accumulatedDays', { by: days });
  } catch (err) {
    logger.warn('Failed to update custody rights', { error: err.message });
  }
};

module.exports = {
  getSchedule,
  requestScheduleChange,
  approveScheduleRequest,
  rejectScheduleRequest,
  getCustodyRights,
};
