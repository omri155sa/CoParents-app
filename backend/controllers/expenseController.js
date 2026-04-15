const { Op } = require('sequelize');
const moment = require('moment');
const { Expense, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');

const addExpense = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { amount, category, description, date, splitRatio, child_id } = req.body;

    const expense = await Expense.create({
      couple_id: coupleId,
      child_id: child_id || null,
      amount,
      category,
      description,
      paidBy: req.user.id,
      date,
      splitRatio: splitRatio || { parent1: 50, parent2: 50 },
      approvalStatus: 'pending',
    });

    await notificationService.notifyOtherParent(
      req.couple,
      req.user.id,
      'expense',
      'New Expense Submitted',
      `${req.user.firstName} submitted an expense of ${amount} ILS (${category}) requiring your approval.`,
      { relatedEntityId: expense.id, relatedEntityType: 'expense' }
    );

    res.status(201).json({ success: true, expense });
  } catch (err) {
    next(err);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { status, category, from, to, page = 1, limit = 30 } = req.query;

    const where = { couple_id: coupleId };
    if (status) where.approvalStatus = status;
    if (category) where.category = category;
    if (from && to) where.date = { [Op.between]: [from, to] };

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where,
      include: [{ model: User, as: 'payer', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['date', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      success: true,
      expenses,
      pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) {
    next(err);
  }
};

const approveExpense = async (req, res, next) => {
  try {
    const { coupleId, expenseId } = req.params;

    const expense = await Expense.findOne({ where: { id: expenseId, couple_id: coupleId, approvalStatus: 'pending' } });
    if (!expense) throw new AppError('Expense not found or already resolved', 404);

    // Cannot approve your own expense
    if (expense.paidBy === req.user.id) throw new AppError('You cannot approve your own expense', 403);

    await expense.update({ approvalStatus: 'approved', approvedBy: req.user.id, approvedAt: new Date() });

    await notificationService.createNotification({
      userId: expense.paidBy,
      type: 'expense',
      title: 'Expense Approved',
      content: `Your expense of ${expense.amount} ILS has been approved.`,
      relatedEntityId: expense.id,
      relatedEntityType: 'expense',
    });

    res.json({ success: true, expense });
  } catch (err) {
    next(err);
  }
};

const rejectExpense = async (req, res, next) => {
  try {
    const { coupleId, expenseId } = req.params;
    const { reason } = req.body;

    const expense = await Expense.findOne({ where: { id: expenseId, couple_id: coupleId, approvalStatus: 'pending' } });
    if (!expense) throw new AppError('Expense not found or already resolved', 404);

    if (expense.paidBy === req.user.id) throw new AppError('You cannot reject your own expense', 403);

    await expense.update({ approvalStatus: 'rejected', approvedBy: req.user.id, approvedAt: new Date(), rejectionReason: reason });

    await notificationService.createNotification({
      userId: expense.paidBy,
      type: 'expense',
      title: 'Expense Rejected',
      content: `Your expense of ${expense.amount} ILS was rejected.${reason ? ` Reason: ${reason}` : ''}`,
      relatedEntityId: expense.id,
      relatedEntityType: 'expense',
    });

    res.json({ success: true, expense });
  } catch (err) {
    next(err);
  }
};

const getExpenseSummary = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { year, month } = req.query;

    const reportService = require('../services/reportService');
    const summary = await reportService.getMonthlyExpenseSummary(
      coupleId,
      year || moment().year(),
      month || moment().month() + 1
    );

    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { addExpense, getExpenses, approveExpense, rejectExpense, getExpenseSummary };
