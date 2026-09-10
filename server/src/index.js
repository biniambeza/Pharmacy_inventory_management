const dns = require('dns');
require('dotenv').config();
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);



const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./utils/errors');
const { startCron } = require('./jobs/alerts');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    ok: dbReady,
    database: dbReady ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrderRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const User = require('./models/User');
  if ((await User.countDocuments()) === 0) {
    const { seedDatabase } = require('./seed');
    await seedDatabase();
  }
  startCron();
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});