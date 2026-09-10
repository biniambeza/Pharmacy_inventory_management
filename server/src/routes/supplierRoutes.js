const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { supplierSchema } = require('../validators/schemas');
const ctrl = require('../controllers/supplierController');

const router = express.Router();
router.use(protect);

router.get('/', ctrl.listSuppliers);
router.post('/', authorize('admin', 'pharmacist'), validate(supplierSchema), ctrl.createSupplier);
router.put('/:id', authorize('admin', 'pharmacist'), validate(supplierSchema), ctrl.updateSupplier);

module.exports = router;
