const mongoose = require('mongoose');

const rxItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    dosage: { type: String, trim: true },
    quantity: { type: Number, min: 1 },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true },
    doctorName: { type: String, required: true, trim: true },
    medicines: { type: [rxItemSchema], default: [] },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    linkedSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
