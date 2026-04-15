const router = require('express').Router();
const { authenticate, requireCoupleAccess } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.get('/:coupleId/report/monthly',      authenticate, requireCoupleAccess, ctrl.getMonthlyReport);
router.get('/:coupleId/report/yearly',       authenticate, requireCoupleAccess, ctrl.getYearlyReport);
router.get('/:coupleId/report/legal-export', authenticate, requireCoupleAccess, ctrl.legalExport);

module.exports = router;
