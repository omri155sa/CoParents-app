const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
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
    senderUser_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    recipientUser_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    toneFlag: {
      type: DataTypes.ENUM('neutral', 'warning', 'positive'),
      defaultValue: 'neutral',
      comment: 'AI-analyzed tone of the message',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of {url, name, type} objects',
    },
    isSystemMessage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'True for automated notifications/system messages',
    },
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['couple_id', 'createdAt'] },
      { fields: ['senderUser_id'] },
      { fields: ['recipientUser_id', 'readAt'] },
    ],
  });

  return Message;
};
