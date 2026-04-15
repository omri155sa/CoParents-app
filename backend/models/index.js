const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

let sequelize;
if (config.url) {
  sequelize = new Sequelize(config.url, {
    dialect: 'postgres',
    logging: config.logging,
    pool: config.pool,
    dialectOptions: config.dialectOptions,
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: config.logging,
    pool: config.pool,
  });
}

// Import all models
const User = require('./User')(sequelize);
const Couple = require('./Couple')(sequelize);
const Child = require('./Child')(sequelize);
const CustodySchedule = require('./CustodySchedule')(sequelize);
const CustodyRights = require('./CustodyRights')(sequelize);
const ChildLog = require('./ChildLog')(sequelize);
const ChugActivity = require('./ChugActivity')(sequelize);
const Expense = require('./Expense')(sequelize);
const TaskItem = require('./TaskItem')(sequelize);
const Document = require('./Document')(sequelize);
const Message = require('./Message')(sequelize);
const Notification = require('./Notification')(sequelize);

// Define associations
// User <-> Couple
Couple.belongsTo(User, { as: 'parent1', foreignKey: 'user1_id' });
Couple.belongsTo(User, { as: 'parent2', foreignKey: 'user2_id' });
User.hasMany(Couple, { as: 'couplesAsParent1', foreignKey: 'user1_id' });
User.hasMany(Couple, { as: 'couplesAsParent2', foreignKey: 'user2_id' });

// Couple <-> Child
Child.belongsTo(Couple, { foreignKey: 'couple_id' });
Couple.hasMany(Child, { foreignKey: 'couple_id' });

// Couple <-> CustodySchedule
CustodySchedule.belongsTo(Couple, { foreignKey: 'couple_id' });
CustodySchedule.belongsTo(Child, { foreignKey: 'child_id' });
CustodySchedule.belongsTo(User, { as: 'responsibleParent', foreignKey: 'parent_responsible' });
Couple.hasMany(CustodySchedule, { foreignKey: 'couple_id' });

// Couple <-> CustodyRights
CustodyRights.belongsTo(Couple, { foreignKey: 'couple_id' });
CustodyRights.belongsTo(User, { foreignKey: 'parent_id' });
Couple.hasMany(CustodyRights, { foreignKey: 'couple_id' });

// Child <-> ChildLog
ChildLog.belongsTo(Child, { foreignKey: 'child_id' });
ChildLog.belongsTo(User, { as: 'author', foreignKey: 'parent_id' });
Child.hasMany(ChildLog, { foreignKey: 'child_id' });

// Couple <-> ChugActivity
ChugActivity.belongsTo(Couple, { foreignKey: 'couple_id' });
ChugActivity.belongsTo(Child, { foreignKey: 'child_id' });
Couple.hasMany(ChugActivity, { foreignKey: 'couple_id' });

// Couple <-> Expense
Expense.belongsTo(Couple, { foreignKey: 'couple_id' });
Expense.belongsTo(User, { as: 'payer', foreignKey: 'paidBy' });
Couple.hasMany(Expense, { foreignKey: 'couple_id' });

// Couple <-> TaskItem
TaskItem.belongsTo(Couple, { foreignKey: 'couple_id' });
TaskItem.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
Couple.hasMany(TaskItem, { foreignKey: 'couple_id' });

// Child <-> Document
Document.belongsTo(Child, { foreignKey: 'child_id' });
Document.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });
Child.hasMany(Document, { foreignKey: 'child_id' });

// Couple <-> Message
Message.belongsTo(Couple, { foreignKey: 'couple_id' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderUser_id' });
Message.belongsTo(User, { as: 'recipient', foreignKey: 'recipientUser_id' });
Couple.hasMany(Message, { foreignKey: 'couple_id' });

// User <-> Notification
Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Couple,
  Child,
  CustodySchedule,
  CustodyRights,
  ChildLog,
  ChugActivity,
  Expense,
  TaskItem,
  Document,
  Message,
  Notification,
};
