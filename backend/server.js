require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth');
const coupleRoutes = require('./routes/couple');
const scheduleRoutes = require('./routes/schedule');
const childLogRoutes = require('./routes/childLog');
const expenseRoutes = require('./routes/expenses');
const activityRoutes = require('./routes/activities');
const messageRoutes = require('./routes/messages');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Rate limiting (global: 100 req/min per IP)
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/couple', coupleRoutes);
app.use('/api/v1/couple', scheduleRoutes);
app.use('/api/v1/child', childLogRoutes);
app.use('/api/v1/couple', expenseRoutes);
app.use('/api/v1/couple', activityRoutes);
app.use('/api/v1/couple', messageRoutes);
app.use('/api/v1/couple', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    if (process.env.NODE_ENV === 'development') {
      // sync without altering tables in dev - use migrations in prod
      await sequelize.sync({ alter: false });
      logger.info('Database synced.');
    }

    app.listen(PORT, () => {
      logger.info(`CoParent Hub server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
