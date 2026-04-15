const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { childLogValidator } = require('../utils/validators');
const ctrl = require('../controllers/childLogController');

router.post('/:childId/log',             authenticate, childLogValidator, validate, ctrl.addLog);
router.get('/:childId/logs',             authenticate, ctrl.getLogs);
router.put('/:childId/log/:logId',       authenticate, childLogValidator, validate, ctrl.updateLog);
router.get('/:childId/logs/summary',     authenticate, ctrl.getSummary);

module.exports = router;
