const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Couple = sequelize.define('Couple', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user1_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    user2_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    divorceAgreement_json: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Parsed divorce agreement data',
    },
    agreementStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    agreementUploadedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    agreementFileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    inviteToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Token sent to second parent to join the couple',
    },
    inviteTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'couples',
    timestamps: true,
  });

  return Couple;
};
