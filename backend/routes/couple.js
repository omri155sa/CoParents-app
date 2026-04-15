const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireCoupleAccess } = require('../middleware/auth');
const ctrl = require('../controllers/coupleController');

const upload = multer({ dest: 'uploads/agreements/', limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/create', authenticate, ctrl.createCouple);
router.get('/:coupleId', authenticate, requireCoupleAccess, ctrl.getCouple);
router.post('/:coupleId/agreement/upload', authenticate, requireCoupleAccess, upload.single('agreement'), ctrl.uploadAgreement);
router.patch('/:coupleId/agreement/parse', authenticate, requireCoupleAccess, ctrl.parseAgreement);

module.exports = router;
