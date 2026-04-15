const jwt = require('jsonwebtoken');
const { User, Couple } = require('../models');
const logger = require('../utils/logger');

/**
 * Verify JWT access token and attach user to request.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'] },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    logger.warn('Invalid token attempt', { error: error.message });
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Verify that the authenticated user belongs to the given couple.
 * Attaches req.couple to the request.
 */
const requireCoupleAccess = async (req, res, next) => {
  const { coupleId } = req.params;

  try {
    const couple = await Couple.findByPk(coupleId);
    if (!couple) {
      return res.status(404).json({ success: false, message: 'Couple not found' });
    }

    const userId = req.user.id;
    if (couple.user1_id !== userId && couple.user2_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    req.couple = couple;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict access to specific roles.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access restricted to: ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = { authenticate, requireCoupleAccess, requireRole };
