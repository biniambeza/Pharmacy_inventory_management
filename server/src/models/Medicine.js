const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true, default: 'tablet' },
    price: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0, default: 10 },
    requiresPrescription: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });
medicineSchema.index({ name: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
