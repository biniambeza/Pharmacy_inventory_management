const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    batchNumber: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true, index: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  },
  { timestamps: true }
);

batchSchema.index({ medicineId: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
