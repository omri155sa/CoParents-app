const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Couple } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.JWT_EXPIRATION, 10) || 3600,
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRATION, 10) || 604800,
  });

const register = async ({ email, password, firstName, lastName, phone, role }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create({
    email,
    password_hash: password, // hashed by beforeCreate hook
    firstName,
    lastName,
    phone,
    role: role || 'parent',
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await user.update({ refreshToken });

  logger.info('New user registered', { userId: user.id, email });

  return { user: user.toSafeJSON(), accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await user.validatePassword(password);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await user.update({ refreshToken });

  logger.info('User logged in', { userId: user.id });

  return { user: user.toSafeJSON(), accessToken, refreshToken };
};

const refreshTokens = async (token) => {
  if (!token) throw new AppError('Refresh token required', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findByPk(decoded.id);
  if (!user || user.refreshToken !== token) {
    throw new AppError('Refresh token revoked', 401);
  }

  const accessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);
  await user.update({ refreshToken: newRefreshToken });

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.update({ refreshToken: null }, { where: { id: userId } });
  logger.info('User logged out', { userId });
};

const generatePasswordResetToken = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return; // Silently succeed to prevent email enumeration

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await user.update({ passwordResetToken: token, passwordResetExpires: expires });
  logger.info('Password reset token generated', { userId: user.id });

  return { token, user };
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    where: { passwordResetToken: token },
  });

  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    throw new AppError('Password reset token is invalid or has expired', 400);
  }

  await user.update({
    password_hash: newPassword, // rehashed by beforeUpdate hook
    passwordResetToken: null,
    passwordResetExpires: null,
    refreshToken: null,
  });

  logger.info('Password reset successfully', { userId: user.id });
};

module.exports = { register, login, refreshTokens, logout, generatePasswordResetToken, resetPassword };
