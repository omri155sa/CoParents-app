const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChildLog = sequelize.define('ChildLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    child_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'children', key: 'id' },
      onDelete: 'CASCADE',
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    logDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('health', 'behavior', 'homework', 'event', 'other'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isUrgent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of {url, name, type} objects',
    },
    isReadByOtherParent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'child_logs',
    timestamps: true,
    indexes: [
      { fields: ['child_id', 'logDate'] },
      { fields: ['parent_id'] },
      { fields: ['isUrgent'] },
    ],
  });

  return ChildLog;
};
