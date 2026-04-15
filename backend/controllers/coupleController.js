const crypto = require('crypto');
const { Couple, User, Child } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const createCouple = async (req, res, next) => {
  try {
    const { inviteEmail } = req.body;
    const user1 = req.user;

    // Check invitee exists
    const user2 = await User.findOne({ where: { email: inviteEmail } });
    if (!user2) throw new AppError('No user found with that email', 404);
    if (user2.id === user1.id) throw new AppError('Cannot create a couple with yourself', 400);

    // Check duplicate
    const { Op } = require('sequelize');
    const existing = await Couple.findOne({
      where: {
        [Op.or]: [
          { user1_id: user1.id, user2_id: user2.id },
          { user1_id: user2.id, user2_id: user1.id },
        ],
      },
    });
    if (existing) throw new AppError('A couple relationship already exists between these users', 409);

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const couple = await Couple.create({
      user1_id: user1.id,
      user2_id: user2.id,
      inviteToken,
      inviteTokenExpires: new Date(Date.now() + 48 * 3600000), // 48 hours
    });

    await notificationService.createNotification({
      userId: user2.id,
      type: 'alert',
      title: 'Co-parent invitation',
      content: `${user1.firstName} ${user1.lastName} has connected with you on CoParent Hub.`,
      relatedEntityId: couple.id,
      relatedEntityType: 'couple',
    });

    logger.info('Couple created', { coupleId: couple.id });
    res.status(201).json({ success: true, couple });
  } catch (err) {
    next(err);
  }
};

const getCouple = async (req, res, next) => {
  try {
    const couple = await Couple.findByPk(req.params.coupleId, {
      include: [
        { model: User, as: 'parent1', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar_url'] },
        { model: User, as: 'parent2', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar_url'] },
        { model: Child },
      ],
    });
    if (!couple) throw new AppError('Couple not found', 404);

    res.json({ success: true, couple });
  } catch (err) {
    next(err);
  }
};

const uploadAgreement = async (req, res, next) => {
  try {
    // In production this would upload req.file to S3 and store the URL
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!fileUrl) throw new AppError('No file uploaded', 400);

    await req.couple.update({
      agreementFileUrl: fileUrl,
      agreementUploadedAt: new Date(),
      agreementStatus: 'pending',
    });

    res.json({ success: true, message: 'Agreement uploaded', fileUrl });
  } catch (err) {
    next(err);
  }
};

const parseAgreement = async (req, res, next) => {
  try {
    // Placeholder for AI-assisted agreement parsing (Google Cloud Vision / Claude API)
    const { parsedData } = req.body;
    await req.couple.update({
      divorceAgreement_json: parsedData,
      agreementStatus: 'approved',
    });

    await notificationService.notifyBothParents(
      req.couple,
      'alert',
      'Agreement Updated',
      'The divorce agreement has been parsed and is now active.',
      { relatedEntityId: req.couple.id, relatedEntityType: 'couple' }
    );

    res.json({ success: true, message: 'Agreement parsed and saved' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCouple, getCouple, uploadAgreement, parseAgreement };
