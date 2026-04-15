const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustodySchedule = sequelize.define('CustodySchedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    couple_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'couples', key: 'id' },
      onDelete: 'CASCADE',
    },
    child_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'children', key: 'id' },
      onDelete: 'CASCADE',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    parent_responsible: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    scheduleType: {
      type: DataTypes.ENUM('default', 'holiday', 'custom'),
      defaultValue: 'default',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // For swap requests
    requestStatus: {
      type: DataTypes.ENUM('confirmed', 'pending_swap', 'approved_swap', 'rejected_swap'),
      defaultValue: 'confirmed',
    },
    requestedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    originalParent: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Original responsible parent before swap request',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'custody_schedules',
    timestamps: true,
    indexes: [
      { fields: ['couple_id', 'startDate'] },
      { fields: ['child_id', 'startDate'] },
    ],
  });

  return CustodySchedule;
};
