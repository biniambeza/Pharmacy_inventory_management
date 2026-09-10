const mongoose = require('mongoose');
const dns = require('node:dns');

const connectDB = async () => {
  mongoose.set('strictQuery', true);
  const dnsServers = (process.env.MONGODB_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers.length > 0) dns.setServers(dnsServers);
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacy_inventory';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

module.exports = connectDB;
