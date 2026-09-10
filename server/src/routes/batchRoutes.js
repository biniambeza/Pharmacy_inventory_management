const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { batchSchema } = require('../validators/schemas');
const ctrl = require('../controllers/batchController');

const router = express.Router();
router.use(protect);

router.get('/', ctrl.listBatches);
router.post('/', authorize('admin', 'pharmacist'), validate(batchSchema), ctrl.createBatch);
router.put('/:id', authorize('admin', 'pharmacist'), ctrl.updateBatch);

module.exports = router;
