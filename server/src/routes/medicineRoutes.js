const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { medicineSchema } = require('../validators/schemas');
const ctrl = require('../controllers/medicineController');

const router = express.Router();
router.use(protect);

router.get('/', ctrl.listMedicines);
router.get('/:id', ctrl.getMedicine);
router.post('/', authorize('admin', 'pharmacist'), validate(medicineSchema), ctrl.createMedicine);
router.put('/:id', authorize('admin', 'pharmacist'), validate(medicineSchema), ctrl.updateMedicine);
router.delete('/:id', authorize('admin', 'pharmacist'), ctrl.deleteMedicine);

module.exports = router;
