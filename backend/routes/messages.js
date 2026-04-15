const router = require('express').Router();
const { authenticate, requireCoupleAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { messageValidator } = require('../utils/validators');
const ctrl = require('../controllers/messageController');

router.post('/:coupleId/message',            authenticate, requireCoupleAccess, messageValidator, validate, ctrl.sendMessage);
router.get('/:coupleId/messages',            authenticate, requireCoupleAccess, ctrl.getMessages);
router.put('/message/:messageId/read',       authenticate, ctrl.markMessageRead);

module.exports = router;
