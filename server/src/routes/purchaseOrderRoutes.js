const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { purchaseOrderSchema, receivePOSchema } = require('../validators/schemas');
const ctrl = require('../controllers/supplierController');

const router = express.Router();
router.use(protect, authorize('admin', 'pharmacist'));

router.get('/', ctrl.listPOs);
router.get('/:id', ctrl.getPO);
router.post('/', validate(purchaseOrderSchema), ctrl.createPO);
router.post('/:id/receive', validate(receivePOSchema), ctrl.receivePO);

module.exports = router;
