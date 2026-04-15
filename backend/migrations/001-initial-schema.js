'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable uuid-ossp extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // ── users ──────────────────────────────────────────────────────────────────
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20) },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      firstName: { type: Sequelize.STRING(100) },
      lastName: { type: Sequelize.STRING(100) },
      dateOfBirth: { type: Sequelize.DATEONLY },
      role: { type: Sequelize.ENUM('parent', 'lawyer', 'mediator'), defaultValue: 'parent' },
      avatar_url: { type: Sequelize.STRING(500) },
      isEmailVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      isPhoneVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      refreshToken: { type: Sequelize.TEXT },
      passwordResetToken: { type: Sequelize.STRING(255) },
      passwordResetExpires: { type: Sequelize.DATE },
      fcmToken: { type: Sequelize.STRING(500) },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ── couples ────────────────────────────────────────────────────────────────
    await queryInterface.createTable('couples', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      user1_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      user2_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      divorceAgreement_json: { type: Sequelize.JSONB },
      agreementStatus: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      agreementUploadedAt: { type: Sequelize.DATE },
      agreementFileUrl: { type: Sequelize.STRING(500) },
      inviteToken: { type: Sequelize.STRING(255) },
      inviteTokenExpires: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ── children ───────────────────────────────────────────────────────────────
    await queryInterface.createTable('children', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      couple_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'couples', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(100), allowNull: false },
      dateOfBirth: { type: Sequelize.DATEONLY, allowNull: false },
      gender: { type: Sequelize.ENUM('M', 'F', 'Other') },
      allergies_encrypted: { type: Sequelize.TEXT },
      medicalConditions_encrypted: { type: Sequelize.TEXT },
      avatar_url: { type: Sequelize.STRING(500) },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ── custody_schedules ──────────────────────────────────────────────────────
    await queryInterface.createTable('custody_schedules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      couple_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'couples', key: 'id' }, onDelete: 'CASCADE' },
      child_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'children', key: 'id' }, onDelete: 'CASCADE' },
      startDate: { type: Sequelize.DATEONLY, allowNull: false },
      endDate: { type: Sequelize.DATEONLY },
      parent_responsible: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      scheduleType: { type: Sequelize.ENUM('default', 'holiday', 'custom'), defaultValue: 'default' },
      reason: { type: Sequelize.TEXT },
      requestStatus: { type: Sequelize.ENUM('confirmed', 'pending_swap', 'approved_swap', 'rejected_swap'), defaultValue: 'confirmed' },
      requestedBy: { type: Sequelize.UUID },
      originalParent: { type: Sequelize.UUID },
      notes: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('custody_schedules', ['couple_id', 'startDate']);

    // ── custody_rights ─────────────────────────────────────────────────────────
    await queryInterface.createTable('custody_rights', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      couple_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'couples', key: 'id' }, onDelete: 'CASCADE' },
      parent_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      accumulatedDays: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      usedDays: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      lastUpdated: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      history: { type: Sequelize.JSONB, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('custody_rights', ['couple_id', 'parent_id'], { unique: true });

    // ── child_logs ─────────────────────────────────────────────────────────────
    await queryInterface.createTable('child_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      child_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'children', key: 'id' }, onDelete: 'CASCADE' },
      parent_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      logDate: { type: Sequelize.DATEONLY, allowNull: false },
      category: { type: Sequelize.ENUM('health', 'behavior', 'homework', 'event', 'other'), allowNull: false },
      title: { type: Sequelize.STRING(200) },
      content: { type: Sequelize.TEXT, allowNull: false },
      isUrgent: { type: Sequelize.BOOLEAN, defaultValue: false },
      attachments: { type: Sequelize.JSONB, defaultValue: [] },
      isReadByOtherParent: { type: Sequelize.BOOLEAN, defaultValue: false },
      readAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('child_logs', ['child_id', 'logDate']);

    // ── chug_activities ────────────────────────────────────────────────────────
    await queryInterface.createTable('chug_activities', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      couple_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'couples', key: 'id' }, onDelete: 'CASCADE' },
      child_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'children', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(200), allowNull: false },
      location: { type: Sequelize.STRING(300) },
      dayOfWeek: { type: Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') },
      startTime: { type: Sequelize.TIME },
      endTime: { type: Sequelize.TIME },
      cost: { type: Sequelize.DECIMAL(10, 2) },
      paidBy: { type: Sequelize.ENUM('parent1', 'parent2', 'both'), defaultValue: 'parent1' },
      splitRatio: { type: Sequelize.JSONB, defaultValue: { parent1: 50, parent2: 50 } },
      status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
      notes: { type: Sequelize.TEXT },
      contactName: { type: Sequelize.STRING(200) },
      contactPhone: { type: Sequelize.STRING(20) },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ── expenses ───────────────────────────────────────────────────────────────
    await queryInterface.createTable('expenses', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      couple_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'couples', key: 'id' }, onDelete: 'CASCADE' },
      child_id: { type: Sequelize.UUID, references: { model: 'children', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      description: { type: Sequelize.STRING(300) },
      category: { type: Sequelize.ENUM('activities', 'medical', 'education', 'clothes', 'food', 'other'), allowNull: false },
      paidBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      approvalStatus: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      approvedBy: { type: Sequelize.UUID },
      approvedAt: { type: Sequelize.DATE },
      rejectionReason: { type: Sequelize.TEXT },
      splitRatio: { type: Sequelize.JSONB, defaultValue: { parent1: 50, parent2: 50 } },
      receiptUrl: { type: Sequelize.STRING(500) },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('expenses', ['couple_id', 'date']);

    // ── tasks ──────────────────────────────────────────────────────────────────
    await queryInterface.createTable('tasks', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      couple_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'couples', key: 'id' }, onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING(300), allowNull: false },
      description: { type: Sequelize.TEXT },
      dueDate: { type: Sequelize.DATEONLY },
      assignedTo: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      createdBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      status: { type: Sequelize.ENUM('pending', 'in_progress', 'completed'), defaultValue: 'pending' },
      recurring: { type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'yearly') },
      completedAt: { type: Sequelize.DATE },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ── documents ──────────────────────────────────────────────────────────────
    await queryInterface.createTable('documents', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      child_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'children', key: 'id' }, onDelete: 'CASCADE' },
      uploadedBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      name: { type: Sequelize.STRING(300), allowNull: false },
      fileUrl: { type: Sequelize.STRING(500), allowNull: false },
      fileSize: { type: Sequelize.INTEGER },
      mimeType: { type: Sequelize.STRING(100) },
      category: { type: Sequelize.ENUM('medical', 'educational', 'legal', 'other'), defaultValue: 'other' },
      description: { type: Sequelize.TEXT },
      isShared: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ── messages ───────────────────────────────────────────────────────────────
    await queryInterface.createTable('messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      couple_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'couples', key: 'id' }, onDelete: 'CASCADE' },
      senderUser_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      recipientUser_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      content: { type: Sequelize.TEXT, allowNull: false },
      toneFlag: { type: Sequelize.ENUM('neutral', 'warning', 'positive'), defaultValue: 'neutral' },
      readAt: { type: Sequelize.DATE },
      attachments: { type: Sequelize.JSONB, defaultValue: [] },
      isSystemMessage: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('messages', ['couple_id', 'createdAt']);

    // ── notifications ──────────────────────────────────────────────────────────
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('schedule', 'log', 'expense', 'message', 'alert', 'task'), defaultValue: 'alert' },
      title: { type: Sequelize.STRING(200) },
      content: { type: Sequelize.TEXT, allowNull: false },
      relatedEntityId: { type: Sequelize.UUID },
      relatedEntityType: { type: Sequelize.STRING(50) },
      isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
      readAt: { type: Sequelize.DATE },
      sentViaPush: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'isRead']);
  },

  async down(queryInterface) {
    const tables = [
      'notifications', 'messages', 'documents', 'tasks',
      'expenses', 'chug_activities', 'child_logs',
      'custody_rights', 'custody_schedules', 'children', 'couples', 'users',
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table, { cascade: true });
    }
  },
};
