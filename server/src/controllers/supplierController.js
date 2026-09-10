const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const { AppError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../utils/audit');

exports.listSuppliers = asyncHandler(async (req, res) => {
  const data = await Supplier.find().sort({ name: 1 });
  res.json({ success: true, data });
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) throw new AppError('Supplier not found', 404);
  res.json({ success: true, data: supplier });
});

exports.listPOs = asyncHandler(async (req, res) => {
  const data = await PurchaseOrder.find()
    .populate('supplierId', 'name contact')
    .populate('items.medicineId', 'name unit')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data });
});

exports.getPO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id)
    .populate('supplierId')
    .populate('items.medicineId', 'name unit price')
    .populate('createdBy', 'name');
  if (!po) throw new AppError('Purchase order not found', 404);
  res.json({ success: true, data: po });
});

exports.createPO = asyncHandler(async (req, res) => {
  for (const item of req.body.items) {
    const exists = await Medicine.exists({ _id: item.medicineId });
    if (!exists) throw new AppError(`Medicine not found: ${item.medicineId}`, 400);
  }
  const po = await PurchaseOrder.create({
    ...req.body,
    status: 'ordered',
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: po });
});

exports.receivePO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) throw new AppError('Purchase order not found', 404);
  if (po.status === 'cancelled' || po.status === 'received') {
    throw new AppError(`Cannot receive PO in status ${po.status}`, 400);
  }

  for (const rec of req.body.items) {
    const line = po.items.find((i) => String(i.medicineId) === String(rec.medicineId));
    if (!line) throw new AppError(`Medicine ${rec.medicineId} is not on this PO`, 400);
    const remaining = line.quantity - line.receivedQty;
    if (rec.receivedQty > remaining) {
      throw new AppError(`Received qty exceeds remaining (${remaining}) for a line item`, 400);
    }
    line.receivedQty += rec.receivedQty;
    await Batch.create({
      medicineId: rec.medicineId,
      batchNumber: rec.batchNumber,
      quantity: rec.receivedQty,
      expiryDate: rec.expiryDate,
      purchasePrice: line.unitCost,
      supplierId: po.supplierId,
      purchaseOrderId: po._id,
    });
    await writeAudit({
      userId: req.user._id,
      action: 'stock.receive',
      entity: 'Batch',
      after: { medicineId: rec.medicineId, qty: rec.receivedQty, batchNumber: rec.batchNumber },
      meta: { purchaseOrderId: po._id },
    });
  }

  const fully = po.items.every((i) => i.receivedQty >= i.quantity);
  const any = po.items.some((i) => i.receivedQty > 0);
  po.status = fully ? 'received' : any ? 'partial' : po.status;
  if (fully) po.receivedAt = new Date();
  await po.save();
  const populated = await PurchaseOrder.findById(po._id)
    .populate('supplierId', 'name')
    .populate('items.medicineId', 'name unit');
  res.json({ success: true, data: populated });
});
