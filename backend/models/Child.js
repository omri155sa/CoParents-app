const { DataTypes } = require('sequelize');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize) => {
  const Child = sequelize.define('Child', {
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('M', 'F', 'Other'),
      allowNull: true,
    },
    // Sensitive medical data - stored encrypted
    allergies_encrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'AES-256 encrypted allergies data',
    },
    medicalConditions_encrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'AES-256 encrypted medical conditions data',
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  }, {
    tableName: 'children',
    timestamps: true,
  });

  // Virtual setters/getters for encrypted fields
  Child.prototype.setAllergies = function (value) {
    this.allergies_encrypted = value ? encrypt(value) : null;
  };

  Child.prototype.getAllergies = function () {
    return this.allergies_encrypted ? decrypt(this.allergies_encrypted) : null;
  };

  Child.prototype.setMedicalConditions = function (value) {
    this.medicalConditions_encrypted = value ? encrypt(value) : null;
  };

  Child.prototype.getMedicalConditions = function () {
    return this.medicalConditions_encrypted ? decrypt(this.medicalConditions_encrypted) : null;
  };

  return Child;
};
