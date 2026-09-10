const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { saleSchema } = require('../validators/schemas');
const ctrl = require('../controllers/saleController');

const router = express.Router();
router.use(protect);

router.get('/', ctrl.listSales);
router.get('/:id', ctrl.getSale);
router.get('/:id/invoice', ctrl.invoicePdf);
router.post('/', authorize('admin', 'pharmacist', 'cashier'), validate(saleSchema), ctrl.createSale);
router.post('/:id/approve', authorize('admin', 'pharmacist'), ctrl.approveSale);

module.exports = router;
