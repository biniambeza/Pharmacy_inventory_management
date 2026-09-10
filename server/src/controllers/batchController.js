const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const { AppError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../utils/audit');

exports.listBatches = asyncHandler(async (req, res) => {
  const { medicineId, status } = req.query;
  const filter = {};
  if (medicineId) filter.medicineId = medicineId;
  const now = new Date();
  if (status === 'expired') filter.expiryDate = { $lte: now };
  if (status === 'active') {
    filter.expiryDate = { $gt: now };
    filter.quantity = { $gt: 0 };
  }
  const batches = await Batch.find(filter)
    .populate('medicineId', 'name genericName unit price')
    .populate('supplierId', 'name')
    .sort({ expiryDate: 1 });
  res.json({ success: true, data: batches });
});

exports.createBatch = asyncHandler(async (req, res) => {
  const med = await Medicine.findById(req.body.medicineId);
  if (!med) throw new AppError('Medicine not found', 404);
  const batch = await Batch.create(req.body);
  await writeAudit({
    userId: req.user._id,
    action: 'batch.create',
    entity: 'Batch',
    entityId: batch._id,
    after: { medicineId: batch.medicineId, quantity: batch.quantity, batchNumber: batch.batchNumber },
  });
  res.status(201).json({ success: true, data: batch });
});

exports.updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) throw new AppError('Batch not found', 404);
  const beforeQty = batch.quantity;
  const allowed = ['quantity', 'expiryDate', 'purchasePrice', 'batchNumber'];
  for (const k of allowed) {
    if (req.body[k] != null) batch[k] = req.body[k];
  }
  await batch.save();
  await writeAudit({
    userId: req.user._id,
    action: 'batch.update',
    entity: 'Batch',
    entityId: batch._id,
    before: { quantity: beforeQty },
    after: { quantity: batch.quantity },
  });
  res.json({ success: true, data: batch });
});
