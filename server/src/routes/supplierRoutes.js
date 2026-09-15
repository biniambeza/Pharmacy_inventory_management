const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { supplierSchema } = require('../validators/schemas');
const ctrl = require('../controllers/supplierController');

const router = express.Router();
router.use(protect);

router.get('/', ctrl.listSuppliers);
router.post('/', authorize('admin'), validate(supplierSchema), ctrl.createSupplier);
router.put('/:id', authorize('admin'), validate(supplierSchema), ctrl.updateSupplier);
router.delete('/:id', authorize('admin'), ctrl.deleteSupplier);

module.exports = router;
