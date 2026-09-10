const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: { type: [poItemSchema], required: true, validate: (v) => v.length > 0 },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'partial', 'received', 'cancelled'],
      default: 'ordered',
    },
    orderDate: { type: Date, default: Date.now },
    receivedAt: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
