const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['low_stock', 'near_expiry', 'expired'], required: true },
    message: { type: String, required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

alertSchema.index({ type: 1, resolved: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
