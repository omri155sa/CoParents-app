const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator } = require('../utils/validators');
const ctrl = require('../controllers/authController');

router.post('/register', authLimiter, registerValidator, validate, ctrl.register);
router.post('/login',    authLimiter, loginValidator,    validate, ctrl.login);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout',   authenticate, ctrl.logout);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, ctrl.resetPassword);
router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
