const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
