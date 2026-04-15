const router = require('express').Router();
const { authenticate, requireCoupleAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { scheduleRequestValidator } = require('../utils/validators');
const ctrl = require('../controllers/scheduleController');

router.get('/:coupleId/schedule',                                   authenticate, requireCoupleAccess, ctrl.getSchedule);
router.post('/:coupleId/schedule/request',                          authenticate, requireCoupleAccess, scheduleRequestValidator, validate, ctrl.requestScheduleChange);
router.put('/:coupleId/schedule/request/:requestId/approve',        authenticate, requireCoupleAccess, ctrl.approveScheduleRequest);
router.put('/:coupleId/schedule/request/:requestId/reject',         authenticate, requireCoupleAccess, ctrl.rejectScheduleRequest);
router.get('/:coupleId/custody-rights',                             authenticate, requireCoupleAccess, ctrl.getCustodyRights);

module.exports = router;
