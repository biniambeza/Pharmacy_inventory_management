const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const { AppError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const { attachStock } = require('../utils/stock');
const { writeAudit } = require('../utils/audit');

exports.listMedicines = asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { genericName: new RegExp(q, 'i') },
      { manufacturer: new RegExp(q, 'i') },
    ];
  }
  const medicines = await Medicine.find(filter).sort({ name: 1 });
  res.json({ success: true, data: await attachStock(medicines) });
});

exports.getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new AppError('Medicine not found', 404);
  const withStock = await attachStock(medicine);
  const batches = await Batch.find({ medicineId: medicine._id }).populate('supplierId', 'name').sort({ expiryDate: 1 });
  res.json({ success: true, data: { ...withStock, batches } });
});

exports.createMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);
  await writeAudit({
    userId: req.user._id,
    action: 'medicine.create',
    entity: 'Medicine',
    entityId: medicine._id,
    after: req.body,
  });
  res.status(201).json({ success: true, data: await attachStock(medicine) });
});

exports.updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new AppError('Medicine not found', 404);
  const before = medicine.toObject();
  const priceChanged = req.body.price != null && req.body.price !== medicine.price;
  Object.assign(medicine, req.body);
  await medicine.save();
  await writeAudit({
    userId: req.user._id,
    action: priceChanged ? 'medicine.price_change' : 'medicine.update',
    entity: 'Medicine',
    entityId: medicine._id,
    before: { price: before.price, name: before.name },
    after: { price: medicine.price, name: medicine.name },
  });
  res.json({ success: true, data: await attachStock(medicine) });
});

exports.deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new AppError('Medicine not found', 404);
  medicine.isActive = false;
  await medicine.save();
  await writeAudit({
    userId: req.user._id,
    action: 'medicine.deactivate',
    entity: 'Medicine',
    entityId: medicine._id,
  });
  res.json({ success: true, message: 'Medicine deactivated' });
});
