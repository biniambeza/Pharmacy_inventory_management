const cron = require('node-cron');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');

const runInventoryAlerts = async () => {
  const days = Number(process.env.NEAR_EXPIRY_DAYS || 30);
  const now = new Date();
  const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const expired = await Batch.find({ quantity: { $gt: 0 }, expiryDate: { $lte: now } }).populate('medicineId', 'name');
  for (const b of expired) {
    const exists = await Alert.findOne({
      type: 'expired',
      batchId: b._id,
      resolved: false,
    });
    if (!exists) {
      await Alert.create({
        type: 'expired',
        batchId: b._id,
        medicineId: b.medicineId?._id,
        message: `Expired batch ${b.batchNumber} for ${b.medicineId?.name || 'medicine'} (qty ${b.quantity})`,
      });
    }
  }

  const near = await Batch.find({
    quantity: { $gt: 0 },
    expiryDate: { $gt: now, $lte: soon },
  }).populate('medicineId', 'name');
  for (const b of near) {
    const exists = await Alert.findOne({ type: 'near_expiry', batchId: b._id, resolved: false });
    if (!exists) {
      await Alert.create({
        type: 'near_expiry',
        batchId: b._id,
        medicineId: b.medicineId?._id,
        message: `Near expiry: ${b.medicineId?.name || 'medicine'} batch ${b.batchNumber} expires ${b.expiryDate.toISOString().slice(0, 10)}`,
      });
    }
  }

  const stocks = await Batch.aggregate([
    { $match: { quantity: { $gt: 0 }, expiryDate: { $gt: now } } },
    { $group: { _id: '$medicineId', stock: { $sum: '$quantity' } } },
  ]);
  const stockMap = new Map(stocks.map((s) => [String(s._id), s.stock]));
  const medicines = await Medicine.find({ isActive: true });
  for (const m of medicines) {
    const stock = stockMap.get(String(m._id)) || 0;
    if (stock <= m.reorderLevel) {
      const exists = await Alert.findOne({ type: 'low_stock', medicineId: m._id, resolved: false });
      if (!exists) {
        await Alert.create({
          type: 'low_stock',
          medicineId: m._id,
          message: `Low stock: ${m.name} has ${stock} (reorder at ${m.reorderLevel})`,
        });
      }
    } else {
      await Alert.updateMany({ type: 'low_stock', medicineId: m._id, resolved: false }, { resolved: true });
    }
  }
};

const startCron = () => {
  cron.schedule('0 8 * * *', () => {
    runInventoryAlerts().catch((err) => console.error('Alert cron failed:', err.message));
  });
  runInventoryAlerts().catch((err) => console.error('Initial alerts failed:', err.message));
};

module.exports = { startCron, runInventoryAlerts };
