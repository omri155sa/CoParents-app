const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChugActivity = sequelize.define('ChugActivity', {
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    dayOfWeek: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
      allowNull: true,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    paidBy: {
      type: DataTypes.ENUM('parent1', 'parent2', 'both'),
      defaultValue: 'parent1',
    },
    splitRatio: {
      type: DataTypes.JSONB,
      defaultValue: { parent1: 50, parent2: 50 },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  }, {
    tableName: 'chug_activities',
    timestamps: true,
    indexes: [
      { fields: ['couple_id'] },
      { fields: ['child_id'] },
    ],
  });

  return ChugActivity;
};
