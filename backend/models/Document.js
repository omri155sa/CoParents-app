const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
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
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    name: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('medical', 'educational', 'legal', 'other'),
      defaultValue: 'other',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isShared: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether both parents can view this document',
    },
  }, {
    tableName: 'documents',
    timestamps: true,
    indexes: [
      { fields: ['child_id', 'category'] },
    ],
  });

  return Document;
};
