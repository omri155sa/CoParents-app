const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustodyRights = sequelize.define('CustodyRights', {
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
    parent_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    accumulatedDays: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    usedDays: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    history: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of {date, action, days, reason} objects for audit log',
    },
  }, {
    tableName: 'custody_rights',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['couple_id', 'parent_id'] },
    ],
  });

  CustodyRights.prototype.availableDays = function () {
    return parseFloat(this.accumulatedDays) - parseFloat(this.usedDays);
  };

  return CustodyRights;
};
