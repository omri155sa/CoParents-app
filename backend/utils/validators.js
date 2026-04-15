const { body, param, query } = require('express-validator');

// ─── Auth Validators ─────────────────────────────────────────────────────────

const registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one uppercase letter and one number'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Schedule Validators ──────────────────────────────────────────────────────

const scheduleRequestValidator = [
  body('child_id').isUUID().withMessage('Invalid child ID'),
  body('startDate').isISO8601().withMessage('Invalid start date (use ISO8601)'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('reason').optional().trim().isLength({ max: 500 }),
];

// ─── Child Log Validators ─────────────────────────────────────────────────────

const childLogValidator = [
  body('logDate').isISO8601().withMessage('Invalid log date'),
  body('category')
    .isIn(['health', 'behavior', 'homework', 'event', 'other'])
    .withMessage('Invalid category'),
  body('content').notEmpty().trim().isLength({ max: 5000 }).withMessage('Content is required (max 5000 chars)'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('isUrgent').optional().isBoolean(),
];

// ─── Expense Validators ───────────────────────────────────────────────────────

const expenseValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .isIn(['activities', 'medical', 'education', 'clothes', 'food', 'other'])
    .withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Invalid date'),
  body('description').optional().trim().isLength({ max: 300 }),
];

// ─── Activity Validators ──────────────────────────────────────────────────────

const activityValidator = [
  body('child_id').isUUID().withMessage('Invalid child ID'),
  body('name').notEmpty().trim().isLength({ max: 200 }).withMessage('Activity name is required'),
  body('dayOfWeek')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  body('cost').optional().isFloat({ min: 0 }),
  body('paidBy').optional().isIn(['parent1', 'parent2', 'both']),
];

// ─── Message Validators ───────────────────────────────────────────────────────

const messageValidator = [
  body('content').notEmpty().trim().isLength({ max: 5000 }).withMessage('Message content is required'),
];

// ─── UUID Param Validator ─────────────────────────────────────────────────────

const uuidParam = (paramName) =>
  param(paramName).isUUID().withMessage(`Invalid ${paramName}`);

module.exports = {
  registerValidator,
  loginValidator,
  scheduleRequestValidator,
  childLogValidator,
  expenseValidator,
  activityValidator,
  messageValidator,
  uuidParam,
};
