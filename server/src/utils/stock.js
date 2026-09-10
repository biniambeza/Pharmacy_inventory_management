const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const { AppError } = require('./errors');

const stockOf = async (medicineId) => {
  const [agg] = await Batch.aggregate([
    { $match: { medicineId: new (require('mongoose').Types.ObjectId)(String(medicineId)), quantity: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  return agg?.total || 0;
};

const attachStock = async (medicines) => {
  const list = Array.isArray(medicines) ? medicines : [medicines];
  const ids = list.map((m) => m._id);
  const stocks = await Batch.aggregate([
    { $match: { medicineId: { $in: ids }, quantity: { $gt: 0 } } },
    { $group: { _id: '$medicineId', stock: { $sum: '$quantity' } } },
  ]);
  const map = new Map(stocks.map((s) => [String(s._id), s.stock]));
  const result = list.map((m) => {
    const obj = m.toObject ? m.toObject() : { ...m };
    obj.stock = map.get(String(m._id)) || 0;
    return obj;
  });
  return Array.isArray(medicines) ? result : result[0];
};

/**
 * FEFO: allocate from earliest-expiring, non-expired batches with remaining qty.
 */
const allocateFEFO = async (medicineId, qtyNeeded) => {
  if (qtyNeeded <= 0) {
    throw new AppError('Quantity must be greater than 0');
  }
  const now = new Date();
  const batches = await Batch.find({
    medicineId,
    quantity: { $gt: 0 },
    expiryDate: { $gt: now },
  }).sort({ expiryDate: 1 });

  let remaining = qtyNeeded;
  const allocations = [];
  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    allocations.push({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      qty: take,
      expiryDate: batch.expiryDate,
      purchasePrice: batch.purchasePrice,
    });
    remaining -= take;
  }

  if (remaining > 0) {
    const med = await Medicine.findById(medicineId);
    throw new AppError(
      `Insufficient sellable stock for ${med?.name || 'medicine'} (need ${qtyNeeded}, short ${remaining})`,
      400
    );
  }
  return allocations;
};

const deductAllocations = async (allocations) => {
  for (const a of allocations) {
    const updated = await Batch.findOneAndUpdate(
      { _id: a.batchId, quantity: { $gte: a.qty } },
      { $inc: { quantity: -a.qty } },
      { new: true }
    );
    if (!updated) {
      throw new AppError('Stock changed during checkout. Please retry.', 409);
    }
  }
};

module.exports = { stockOf, attachStock, allocateFEFO, deductAllocations };
