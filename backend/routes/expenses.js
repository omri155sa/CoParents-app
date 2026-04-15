const router = require('express').Router();
const { authenticate, requireCoupleAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { expenseValidator } = require('../utils/validators');
const ctrl = require('../controllers/expenseController');

router.post('/:coupleId/expense',                     authenticate, requireCoupleAccess, expenseValidator, validate, ctrl.addExpense);
router.get('/:coupleId/expenses',                     authenticate, requireCoupleAccess, ctrl.getExpenses);
router.put('/:coupleId/expense/:expenseId/approve',   authenticate, requireCoupleAccess, ctrl.approveExpense);
router.put('/:coupleId/expense/:expenseId/reject',    authenticate, requireCoupleAccess, ctrl.rejectExpense);
router.get('/:coupleId/expenses/summary',             authenticate, requireCoupleAccess, ctrl.getExpenseSummary);

module.exports = router;
