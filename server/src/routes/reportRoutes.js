const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

const router = express.Router();
router.use(protect);

router.get('/dashboard', ctrl.dashboard);
router.get('/alerts', ctrl.listAlerts);
router.put('/alerts/:id/resolve', authorize('admin', 'pharmacist'), ctrl.resolveAlert);
router.get('/sales', authorize('admin'), ctrl.salesSummary);
router.get('/best-sellers', authorize('admin'), ctrl.bestSellers);
router.get('/expiry', authorize('admin', 'pharmacist'), ctrl.expiryReport);
router.get('/sales/export.csv', authorize('admin'), ctrl.exportCsv);
router.get('/sales/export.pdf', authorize('admin'), ctrl.exportPdf);
router.get('/audit', authorize('admin'), ctrl.auditLogs);
router.get('/categories', ctrl.categories);

module.exports = router;
