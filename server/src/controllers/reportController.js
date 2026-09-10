const Sale = require('../models/Sale');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { buildReportPdf } = require('../utils/pdf');

const rangeDates = (range) => {
  const now = new Date();
  const start = new Date(now);
  if (range === 'daily') start.setHours(0, 0, 0, 0);
  else if (range === 'weekly') {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
};

exports.salesSummary = asyncHandler(async (req, res) => {
  const range = req.query.range || 'monthly';
  const { start, end } = rangeDates(range);
  const data = await Sale.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
        discount: { $sum: '$discount' },
        tax: { $sum: '$tax' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const totals = data.reduce(
    (a, d) => ({ revenue: a.revenue + d.revenue, count: a.count + d.count }),
    { revenue: 0, count: 0 }
  );
  res.json({ success: true, range, start, end, totals, data });
});

exports.bestSellers = asyncHandler(async (req, res) => {
  const range = req.query.range || 'monthly';
  const { start, end } = rangeDates(range);
  const data = await Sale.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.medicineId',
        qty: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'medicines',
        localField: '_id',
        foreignField: '_id',
        as: 'medicine',
      },
    },
    { $unwind: '$medicine' },
    {
      $project: {
        _id: 0,
        medicineId: '$_id',
        name: '$medicine.name',
        qty: 1,
        revenue: 1,
      },
    },
  ]);
  res.json({ success: true, data });
});

exports.expiryReport = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || process.env.NEAR_EXPIRY_DAYS || 30);
  const now = new Date();
  const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const expired = await Batch.find({ quantity: { $gt: 0 }, expiryDate: { $lte: now } })
    .populate('medicineId', 'name genericName')
    .sort({ expiryDate: 1 });
  const nearExpiry = await Batch.find({
    quantity: { $gt: 0 },
    expiryDate: { $gt: now, $lte: soon },
  })
    .populate('medicineId', 'name genericName')
    .sort({ expiryDate: 1 });
  res.json({ success: true, expired, nearExpiry });
});

exports.exportCsv = asyncHandler(async (req, res) => {
  const range = req.query.range || 'monthly';
  const { start, end } = rangeDates(range);
  const sales = await Sale.find({ status: 'completed', createdAt: { $gte: start, $lte: end } })
    .populate('cashierId', 'name')
    .sort({ createdAt: 1 });
  const header = 'invoiceNumber,date,cashier,total,discount,tax,paymentMethod,status\n';
  const rows = sales
    .map(
      (s) =>
        `${s.invoiceNumber},${s.createdAt.toISOString()},${s.cashierId?.name || ''},${s.total},${s.discount},${s.tax},${s.paymentMethod},${s.status}`
    )
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=sales-${range}.csv`);
  res.send(header + rows);
});

exports.exportPdf = asyncHandler(async (req, res) => {
  const range = req.query.range || 'monthly';
  const { start, end } = rangeDates(range);
  const sales = await Sale.find({ status: 'completed', createdAt: { $gte: start, $lte: end } })
    .populate('cashierId', 'name')
    .sort({ createdAt: 1 });
  const rows = sales.map((s) => ({
    invoice: s.invoiceNumber,
    date: s.createdAt.toISOString().slice(0, 10),
    cashier: s.cashierId?.name || '',
    total: s.total.toFixed(2),
    pay: s.paymentMethod,
  }));
  const buf = await buildReportPdf(`Sales report (${range})`, rows, [
    { key: 'invoice', label: 'Invoice' },
    { key: 'date', label: 'Date' },
    { key: 'cashier', label: 'Cashier' },
    { key: 'total', label: 'Total' },
    { key: 'pay', label: 'Pay' },
  ]);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=sales-${range}.pdf`);
  res.send(buf);
});

exports.dashboard = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todayAgg = await Sale.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: start } } },
    { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  const now = new Date();
  const stockValue = await Batch.aggregate([
    { $match: { quantity: { $gt: 0 }, expiryDate: { $gt: now } } },
    {
      $lookup: { from: 'medicines', localField: 'medicineId', foreignField: '_id', as: 'med' },
    },
    { $unwind: '$med' },
    {
      $group: {
        _id: null,
        value: { $sum: { $multiply: ['$quantity', '$med.price'] } },
        units: { $sum: '$quantity' },
      },
    },
  ]);
  const days = Number(process.env.NEAR_EXPIRY_DAYS || 30);
  const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const expiringCount = await Batch.countDocuments({
    quantity: { $gt: 0 },
    expiryDate: { $gt: now, $lte: soon },
  });
  const expiredCount = await Batch.countDocuments({ quantity: { $gt: 0 }, expiryDate: { $lte: now } });

  const stocks = await Batch.aggregate([
    { $match: { quantity: { $gt: 0 }, expiryDate: { $gt: now } } },
    { $group: { _id: '$medicineId', stock: { $sum: '$quantity' } } },
  ]);
  const stockMap = new Map(stocks.map((s) => [String(s._id), s.stock]));
  const meds = await Medicine.find({ isActive: true }, 'name reorderLevel');
  const lowStock = meds.filter((m) => (stockMap.get(String(m._id)) || 0) <= m.reorderLevel);

  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() - 6);
  const trend = await Sale.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: weekStart } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const pendingRx = await Sale.countDocuments({ status: 'pending_approval' });

  res.json({
    success: true,
    data: {
      todayRevenue: todayAgg[0]?.revenue || 0,
      todaySalesCount: todayAgg[0]?.count || 0,
      stockValue: stockValue[0]?.value || 0,
      stockUnits: stockValue[0]?.units || 0,
      lowStockCount: lowStock.length,
      lowStock,
      expiringCount,
      expiredCount,
      pendingRx,
      trend,
    },
  });
});

exports.listAlerts = asyncHandler(async (req, res) => {
  const data = await Alert.find({ resolved: false })
    .populate('medicineId', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data });
});

exports.resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { resolved: true }, { new: true });
  res.json({ success: true, data: alert });
});

exports.auditLogs = asyncHandler(async (req, res) => {
  const data = await AuditLog.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data });
});

exports.categories = asyncHandler(async (req, res) => {
  const data = await Medicine.distinct('category');
  res.json({ success: true, data });
});
