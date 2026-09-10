const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const { AppError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const { allocateFEFO, deductAllocations } = require('../utils/stock');
const { writeAudit } = require('../utils/audit');
const { buildInvoicePdf } = require('../utils/pdf');

const nextInvoice = async () => {
  const count = await Sale.countDocuments();
  const n = String(count + 1).padStart(6, '0');
  return `INV-${new Date().getFullYear()}-${n}`;
};

const computeTotals = (lineItems, discount, taxRate) => {
  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.price, 0);
  const disc = Math.min(discount || 0, subtotal);
  const taxable = subtotal - disc;
  const tax = Number((taxable * taxRate).toFixed(2));
  const total = Number((taxable + tax).toFixed(2));
  return { subtotal, discount: disc, tax, total };
};

exports.createSale = asyncHandler(async (req, res) => {
  const taxRate =
    req.body.taxRate != null ? req.body.taxRate : Number(process.env.TAX_RATE || 0.08);

  const medicines = await Medicine.find({
    _id: { $in: req.body.items.map((i) => i.medicineId) },
  });
  const medMap = new Map(medicines.map((m) => [String(m._id), m]));

  const needsRx = req.body.items.some((i) => medMap.get(String(i.medicineId))?.requiresPrescription);
  if (needsRx && !req.body.prescription) {
    throw new AppError('Prescription details are required for restricted medicines', 400);
  }

  const saleItems = [];
  for (const line of req.body.items) {
    const med = medMap.get(String(line.medicineId));
    if (!med || !med.isActive) throw new AppError('Medicine not found or inactive', 400);
    const allocs = await allocateFEFO(med._id, line.qty);
    for (const a of allocs) {
      saleItems.push({
        medicineId: med._id,
        batchId: a.batchId,
        qty: a.qty,
        price: med.price,
      });
    }
  }

  const canCompleteNow = !needsRx || req.user.role === 'pharmacist' || req.user.role === 'admin';
  const status = canCompleteNow ? 'completed' : 'pending_approval';

  if (status === 'completed') {
    await deductAllocations(saleItems);
  }

  let prescription = null;
  if (req.body.prescription) {
    prescription = await Prescription.create({
      ...req.body.prescription,
      medicines: req.body.items.map((i) => ({ medicineId: i.medicineId, quantity: i.qty })),
      createdBy: req.user._id,
    });
  }

  const totals = computeTotals(saleItems, req.body.discount, taxRate);
  const sale = await Sale.create({
    invoiceNumber: await nextInvoice(),
    items: saleItems,
    ...totals,
    paymentMethod: req.body.paymentMethod || 'cash',
    cashierId: req.user._id,
    status,
    requiresPrescription: needsRx,
    prescriptionId: prescription?._id,
    approvedBy: status === 'completed' && needsRx ? req.user._id : undefined,
  });

  if (prescription) {
    prescription.linkedSaleId = sale._id;
    await prescription.save();
  }

  await writeAudit({
    userId: req.user._id,
    action: status === 'completed' ? 'sale.complete' : 'sale.pending',
    entity: 'Sale',
    entityId: sale._id,
    after: { invoiceNumber: sale.invoiceNumber, total: sale.total, status },
  });

  const populated = await Sale.findById(sale._id)
    .populate('items.medicineId', 'name unit')
    .populate('cashierId', 'name role')
    .populate('prescriptionId');

  res.status(201).json({ success: true, data: populated });
});

exports.approveSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw new AppError('Sale not found', 404);
  if (sale.status !== 'pending_approval') {
    throw new AppError('Sale is not awaiting approval', 400);
  }
  await deductAllocations(sale.items);
  sale.status = 'completed';
  sale.approvedBy = req.user._id;
  await sale.save();
  await writeAudit({
    userId: req.user._id,
    action: 'sale.approve',
    entity: 'Sale',
    entityId: sale._id,
  });
  const populated = await Sale.findById(sale._id)
    .populate('items.medicineId', 'name unit')
    .populate('cashierId', 'name role')
    .populate('approvedBy', 'name');
  res.json({ success: true, data: populated });
});

exports.listSales = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (req.user.role === 'cashier') filter.cashierId = req.user._id;
  const data = await Sale.find(filter)
    .populate('cashierId', 'name role')
    .populate('items.medicineId', 'name')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, data });
});

exports.getSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('items.medicineId', 'name genericName unit')
    .populate('items.batchId', 'batchNumber expiryDate')
    .populate('cashierId', 'name role')
    .populate('prescriptionId')
    .populate('approvedBy', 'name');
  if (!sale) throw new AppError('Sale not found', 404);
  res.json({ success: true, data: sale });
});

exports.invoicePdf = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('items.medicineId', 'name')
    .populate('cashierId', 'name');
  if (!sale) throw new AppError('Sale not found', 404);
  const buf = await buildInvoicePdf(sale);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=${sale.invoiceNumber}.pdf`);
  res.send(buf);
});
