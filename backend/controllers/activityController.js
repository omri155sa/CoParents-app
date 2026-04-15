const { ChugActivity, Child } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');

const addActivity = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { child_id, name, location, dayOfWeek, startTime, endTime, cost, paidBy, splitRatio, notes, contactName, contactPhone } = req.body;

    const child = await Child.findOne({ where: { id: child_id, couple_id: coupleId } });
    if (!child) throw new AppError('Child not found in this couple', 404);

    const activity = await ChugActivity.create({
      couple_id: coupleId,
      child_id,
      name,
      location,
      dayOfWeek,
      startTime,
      endTime,
      cost,
      paidBy: paidBy || 'parent1',
      splitRatio: splitRatio || { parent1: 50, parent2: 50 },
      notes,
      contactName,
      contactPhone,
    });

    await notificationService.notifyOtherParent(
      req.couple,
      req.user.id,
      'alert',
      'New Activity Added',
      `${req.user.firstName} added "${name}" for ${child.name}.`,
      { relatedEntityId: activity.id, relatedEntityType: 'activity' }
    );

    res.status(201).json({ success: true, activity });
  } catch (err) {
    next(err);
  }
};

const getActivities = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { childId, status } = req.query;

    const where = { couple_id: coupleId };
    if (childId) where.child_id = childId;
    if (status) where.status = status;

    const activities = await ChugActivity.findAll({
      where,
      include: [{ model: Child, attributes: ['id', 'name'] }],
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
    });

    res.json({ success: true, activities });
  } catch (err) {
    next(err);
  }
};

const updateActivity = async (req, res, next) => {
  try {
    const { coupleId, activityId } = req.params;

    const activity = await ChugActivity.findOne({ where: { id: activityId, couple_id: coupleId } });
    if (!activity) throw new AppError('Activity not found', 404);

    const allowed = ['name', 'location', 'dayOfWeek', 'startTime', 'endTime', 'cost', 'paidBy', 'splitRatio', 'status', 'notes', 'contactName', 'contactPhone'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    await activity.update(updates);

    res.json({ success: true, activity });
  } catch (err) {
    next(err);
  }
};

const deleteActivity = async (req, res, next) => {
  try {
    const { coupleId, activityId } = req.params;

    const activity = await ChugActivity.findOne({ where: { id: activityId, couple_id: coupleId } });
    if (!activity) throw new AppError('Activity not found', 404);

    await activity.destroy();
    res.json({ success: true, message: 'Activity deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { addActivity, getActivities, updateActivity, deleteActivity };
