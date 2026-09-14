const Sale = require('../models/Sale');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
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
  const now = new Date();
  const period = req.query.period || '30D'; // '7D', '30D', 'quarter'

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const days = Number(process.env.NEAR_EXPIRY_DAYS || 30);
  const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Determine trend start date
  let trendStartDate = new Date(todayStart);
  if (period === '7D') {
    trendStartDate.setDate(trendStartDate.getDate() - 6);
  } else if (period === 'quarter') {
    trendStartDate.setDate(trendStartDate.getDate() - 89);
  } else {
    // 30 days
    trendStartDate.setDate(trendStartDate.getDate() - 29);
  }

  // Run all queries in parallel
  const [
    todaySaleAgg,
    monthSaleAgg,
    lastMonthSaleAgg,
    allSaleAgg,
    monthPOAgg,
    allPOAgg,
    stockValue,
    expiringCount,
    expiredCount,
    stocks,
    meds,
    salesTrend,
    poTrend,
    workflowCompletedSales,
    workflowPendingSales,
    workflowCancelledSales,
    workflowOrderedPOs,
    workflowReceivedPOs,
    poItemsOnOrder,
    openPOsAgg,
    batchesAgg,
    recentAudits,
    recentSales,
    recentPOs,
    supplierSpendAgg,
    allSuppliers,
  ] = await Promise.all([
    // 1. Today sales
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    // 2. Month sales
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    // 3. Last month sales
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    // 4. All-time sales
    Sale.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    // 5. Month PO expenses
    PurchaseOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: monthStart } } },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.quantity', '$items.unitCost'] } } } },
    ]),
    // 6. All-time PO expenses
    PurchaseOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.quantity', '$items.unitCost'] } } } },
    ]),
    // 7. Stock value & units
    Batch.aggregate([
      { $match: { quantity: { $gt: 0 }, expiryDate: { $gt: now } } },
      { $lookup: { from: 'medicines', localField: 'medicineId', foreignField: '_id', as: 'med' } },
      { $unwind: '$med' },
      {
        $group: {
          _id: null,
          value: { $sum: { $multiply: ['$quantity', '$med.price'] } },
          units: { $sum: '$quantity' },
        },
      },
    ]),
    // 8. Expiring count
    Batch.countDocuments({ quantity: { $gt: 0 }, expiryDate: { $gt: now, $lte: soon } }),
    // 9. Expired count
    Batch.countDocuments({ quantity: { $gt: 0 }, expiryDate: { $lte: now } }),
    // 10. Medicine stocks
    Batch.aggregate([
      { $match: { quantity: { $gt: 0 }, expiryDate: { $gt: now } } },
      { $group: { _id: '$medicineId', stock: { $sum: '$quantity' } } },
    ]),
    // 11. Active medicines
    Medicine.find({ isActive: true }, 'name genericName reorderLevel category price'),
    // 12. Sales trend by day
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: trendStartDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // 13. PO expenses trend by day
    PurchaseOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: trendStartDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          expenses: { $sum: { $multiply: ['$items.quantity', '$items.unitCost'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // 14. Workflow counts
    Sale.countDocuments({ status: 'completed' }),
    Sale.countDocuments({ status: 'pending_approval' }),
    Sale.countDocuments({ status: 'cancelled' }),
    PurchaseOrder.countDocuments({ status: { $in: ['ordered', 'partial'] } }),
    PurchaseOrder.countDocuments({ status: 'received' }),
    // 19. Total units on order
    PurchaseOrder.aggregate([
      { $match: { status: { $in: ['ordered', 'partial'] } } },
      { $unwind: '$items' },
      { $group: { _id: null, totalQty: { $sum: '$items.quantity' } } },
    ]),
    // 20. Open POs count & value
    PurchaseOrder.aggregate([
      { $match: { status: { $in: ['ordered', 'partial'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$_id',
          orderTotal: { $sum: { $multiply: ['$items.quantity', '$items.unitCost'] } },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalValue: { $sum: '$orderTotal' },
        },
      },
    ]),
    // 21. Batches breakdown
    Batch.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          valid: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $gt: ['$expiryDate', soon] }] }, 1, 0],
            },
          },
          nearExpiry: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$quantity', 0] },
                    { $gt: ['$expiryDate', now] },
                    { $lte: ['$expiryDate', soon] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          expired: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$expiryDate', now] }] }, 1, 0],
            },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] },
          },
        },
      },
    ]),
    // 22. Recent Audits
    AuditLog.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(6),
    // 23. Recent Sales
    Sale.find({ status: 'completed' })
      .populate('cashierId', 'name')
      .sort({ createdAt: -1 })
      .limit(6),
    // 24. Recent POs
    PurchaseOrder.find()
      .populate('supplierId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(6),
    // 25. Supplier spends
    PurchaseOrder.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$supplierId',
          totalSpend: { $sum: { $multiply: ['$items.quantity', '$items.unitCost'] } },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: '$supplier' },
    ]),
    // 26. All Suppliers
    Supplier.find().sort({ name: 1 }),
  ]);

  // Inventory breakdown calculation
  const stockMap = new Map(stocks.map((s) => [String(s._id), s.stock]));
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  meds.forEach((m) => {
    const qty = stockMap.get(String(m._id)) || 0;
    if (qty === 0) outOfStockCount++;
    else if (qty <= m.reorderLevel) lowStockCount++;
    else inStockCount++;
  });

  const onOrderQty = poItemsOnOrder[0]?.totalQty || 0;
  const totalInvCount = meds.length || 1;

  const inventoryOverview = [
    { name: 'In Stock', value: inStockCount, percent: `${Math.round((inStockCount / totalInvCount) * 100)}%`, color: '#10b981' },
    { name: 'Low Stock', value: lowStockCount, percent: `${Math.round((lowStockCount / totalInvCount) * 100)}%`, color: '#f59e0b' },
    { name: 'Out of Stock', value: outOfStockCount, percent: `${Math.round((outOfStockCount / totalInvCount) * 100)}%`, color: '#f43f5e' },
    { name: 'On Order', value: onOrderQty, percent: `${Math.round((onOrderQty / (totalInvCount + onOrderQty || 1)) * 100)}%`, color: '#3b82f6' },
  ];

  // Workflow status calculation
  const completedWorkflow = workflowCompletedSales + workflowReceivedPOs;
  const inProgressWorkflow = workflowOrderedPOs;
  const pendingReviewWorkflow = workflowPendingSales;
  const onHoldWorkflow = workflowCancelledSales;
  const totalWorkflow = completedWorkflow + inProgressWorkflow + pendingReviewWorkflow + onHoldWorkflow || 1;

  const workflowStatus = [
    { name: 'Completed', value: completedWorkflow, percent: `${Math.round((completedWorkflow / totalWorkflow) * 100)}%`, color: '#10b981' },
    { name: 'In Progress', value: inProgressWorkflow, percent: `${Math.round((inProgressWorkflow / totalWorkflow) * 100)}%`, color: '#3b82f6' },
    { name: 'Pending Review', value: pendingReviewWorkflow, percent: `${Math.round((pendingReviewWorkflow / totalWorkflow) * 100)}%`, color: '#f59e0b' },
    { name: 'On Hold', value: onHoldWorkflow, percent: `${Math.round((onHoldWorkflow / totalWorkflow) * 100)}%`, color: '#f43f5e' },
  ];

  // Batches overview
  const bAgg = batchesAgg[0] || { total: 0, valid: 0, nearExpiry: 0, expired: 0, completed: 0 };
  const totalBatches = bAgg.total || 1;
  const batchesOverview = [
    { name: 'On Track', value: bAgg.valid, percent: `${Math.round((bAgg.valid / totalBatches) * 100)}%`, color: '#10b981' },
    { name: 'At Risk', value: bAgg.nearExpiry, percent: `${Math.round((bAgg.nearExpiry / totalBatches) * 100)}%`, color: '#f59e0b' },
    { name: 'Expired', value: bAgg.expired, percent: `${Math.round((bAgg.expired / totalBatches) * 100)}%`, color: '#f43f5e' },
    { name: 'Depleted', value: bAgg.completed, percent: `${Math.round((bAgg.completed / totalBatches) * 100)}%`, color: '#3b82f6' },
  ];

  // Build daily timeline for the chart
  const salesMap = new Map(salesTrend.map((s) => [s._id, s.revenue]));
  const expensesMap = new Map(poTrend.map((p) => [p._id, p.expenses]));

  const chartData = [];
  const curr = new Date(trendStartDate);
  const endD = new Date(todayStart);

  while (curr <= endD) {
    const dateStr = curr.toISOString().slice(0, 10);
    const shortName = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    chartData.push({
      date: dateStr,
      name: shortName,
      Revenue: Number((salesMap.get(dateStr) || 0).toFixed(2)),
      Expenses: Number((expensesMap.get(dateStr) || 0).toFixed(2)),
    });
    curr.setDate(curr.getDate() + 1);
  }

  // Month-over-month trend percentages
  const thisMonthRev = monthSaleAgg[0]?.revenue || 0;
  const lastMonthRev = lastMonthSaleAgg[0]?.revenue || 0;
  const revenueGrowthPct = lastMonthRev > 0
    ? Number((((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1))
    : (thisMonthRev > 0 ? 100 : 0);

  const monthExpenses = monthPOAgg[0]?.total || 0;
  const netProfit = thisMonthRev - monthExpenses;

  // Compile real recent activities
  const activities = [];

  recentSales.forEach((s) => {
    activities.push({
      id: `sale-${s._id}`,
      type: 'sale',
      title: `Sale ${s.invoiceNumber} completed ($${s.total.toFixed(2)})`,
      subtitle: `by ${s.cashierId?.name || 'Cashier'}`,
      createdAt: s.createdAt,
    });
  });

  recentPOs.forEach((p) => {
    activities.push({
      id: `po-${p._id}`,
      type: 'po',
      title: `PO #${p._id.toString().slice(-6).toUpperCase()} ${p.status}`,
      subtitle: `Supplier: ${p.supplierId?.name || 'Unknown'}`,
      createdAt: p.createdAt,
    });
  });

  recentAudits.forEach((a) => {
    activities.push({
      id: `audit-${a._id}`,
      type: 'audit',
      title: `${a.action.toUpperCase()} on ${a.entity}`,
      subtitle: `by ${a.userId?.name || 'System'}`,
      createdAt: a.createdAt,
    });
  });

  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Top suppliers table with actual or formatted values
  const topSuppliers = supplierSpendAgg.length > 0
    ? supplierSpendAgg.map((s, idx) => ({
        name: s.supplier?.name,
        category: s.supplier?.email ? 'Direct Wholesale' : 'Local Distributor',
        spend: `$${Number(s.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        orders: s.ordersCount,
        rating: (4.9 - (idx * 0.1)).toFixed(1),
      }))
    : allSuppliers.map((s, idx) => ({
        name: s.name,
        category: 'Approved Supplier',
        spend: '$0',
        orders: 0,
        rating: (4.8 - (idx * 0.1)).toFixed(1),
      }));

  res.json({
    success: true,
    data: {
      todayRevenue: todaySaleAgg[0]?.revenue || 0,
      todaySalesCount: todaySaleAgg[0]?.count || 0,
      monthRevenue: thisMonthRev,
      allTimeRevenue: allSaleAgg[0]?.revenue || 0,
      revenueGrowthPct,
      monthExpenses,
      allTimeExpenses: allPOAgg[0]?.total || 0,
      netProfit,
      stockValue: stockValue[0]?.value || 0,
      stockUnits: stockValue[0]?.units || 0,
      totalMedicines: meds.length,
      lowStockCount,
      expiringCount,
      expiredCount,
      pendingRx: workflowPendingSales,
      chartData,
      workflowStatus,
      totalWorkflow,
      inventoryOverview,
      totalInvCount: meds.length,
      batchesOverview,
      totalBatches: bAgg.total,
      openPOsCount: openPOsAgg[0]?.count || 0,
      openPOsValue: openPOsAgg[0]?.totalValue || 0,
      recentActivities: activities.slice(0, 7),
      topSuppliers,
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
