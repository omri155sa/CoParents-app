const router = require('express').Router();
const { authenticate, requireCoupleAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { activityValidator } = require('../utils/validators');
const ctrl = require('../controllers/activityController');

router.post('/:coupleId/activity',                  authenticate, requireCoupleAccess, activityValidator, validate, ctrl.addActivity);
router.get('/:coupleId/activities',                 authenticate, requireCoupleAccess, ctrl.getActivities);
router.patch('/:coupleId/activity/:activityId',     authenticate, requireCoupleAccess, ctrl.updateActivity);
router.delete('/:coupleId/activity/:activityId',    authenticate, requireCoupleAccess, ctrl.deleteActivity);

module.exports = router;
