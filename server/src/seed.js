require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const Batch = require('./models/Batch');
const Supplier = require('./models/Supplier');
const PurchaseOrder = require('./models/PurchaseOrder');
const mongoose = require('mongoose');

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const seedDatabase = async ({ reset = true } = {}) => {
  if (reset) {

  await Promise.all([
    User.deleteMany({}),
    Medicine.deleteMany({}),
    Batch.deleteMany({}),
    Supplier.deleteMany({}),
    PurchaseOrder.deleteMany({}),
  ]);

  const passwordHash = await User.hashPassword('Password123!');
  const [admin, pharmacist, cashier] = await User.create([
    { name: 'Ada Admin', email: 'admin@pharmacy.com', passwordHash, role: 'admin' },
    { name: 'Phil Pharmacist', email: 'pharmacist@pharmacy.com', passwordHash, role: 'pharmacist' },
    { name: 'Casey Cashier', email: 'cashier@pharmacy.com', passwordHash, role: 'cashier' },
  ]);

  const suppliers = await Supplier.create([
    {
      name: 'MediSource Wholesale',
      contact: '+1-555-0101',
      email: 'orders@medisource.example',
      address: '120 Supply Park, Suite 4',
    },
    {
      name: 'Northwind Pharma Dist.',
      contact: '+1-555-0188',
      email: 'sales@northwindpharma.example',
      address: '88 Harbor Road',
    },
  ]);

  const medicines = await Medicine.create([
    {
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      category: 'Antibiotic',
      manufacturer: 'Pfizer',
      unit: 'capsule',
      price: 12.5,
      reorderLevel: 40,
      requiresPrescription: true,
    },
    {
      name: 'Lisinopril 10mg',
      genericName: 'Lisinopril',
      category: 'Cardiovascular',
      manufacturer: 'AstraZeneca',
      unit: 'tablet',
      price: 8.75,
      reorderLevel: 30,
      requiresPrescription: true,
    },
    {
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      category: 'Analgesic',
      manufacturer: 'GSK',
      unit: 'tablet',
      price: 3.2,
      reorderLevel: 80,
      requiresPrescription: false,
    },
    {
      name: 'Ibuprofen 200mg',
      genericName: 'Ibuprofen',
      category: 'NSAID',
      manufacturer: 'Advil',
      unit: 'tablet',
      price: 4.5,
      reorderLevel: 50,
      requiresPrescription: false,
    },
    {
      name: 'Cetirizine 10mg',
      genericName: 'Cetirizine',
      category: 'Antihistamine',
      manufacturer: 'Johnson & Johnson',
      unit: 'tablet',
      price: 6.0,
      reorderLevel: 25,
      requiresPrescription: false,
    },
    {
      name: 'Metformin 500mg',
      genericName: 'Metformin',
      category: 'Antidiabetic',
      manufacturer: 'Merck',
      unit: 'tablet',
      price: 7.25,
      reorderLevel: 35,
      requiresPrescription: true,
    },
    {
      name: 'Omeprazole 20mg',
      genericName: 'Omeprazole',
      category: 'GI',
      manufacturer: 'Sandoz',
      unit: 'capsule',
      price: 9.1,
      reorderLevel: 20,
      requiresPrescription: false,
    },
    {
      name: 'Vitamin D3 1000IU',
      genericName: 'Cholecalciferol',
      category: 'Supplement',
      manufacturer: 'Nature Made',
      unit: 'softgel',
      price: 5.4,
      reorderLevel: 15,
      requiresPrescription: false,
    },
  ]);

  const [s1, s2] = suppliers;
  await Batch.create([
    {
      medicineId: medicines[0]._id,
      batchNumber: 'AMX-A1',
      quantity: 80,
      expiryDate: addDays(400),
      purchasePrice: 6.2,
      supplierId: s1._id,
    },
    {
      medicineId: medicines[0]._id,
      batchNumber: 'AMX-B2',
      quantity: 25,
      expiryDate: addDays(20),
      purchasePrice: 6.0,
      supplierId: s1._id,
    },
    {
      medicineId: medicines[1]._id,
      batchNumber: 'LIS-01',
      quantity: 60,
      expiryDate: addDays(300),
      purchasePrice: 3.8,
      supplierId: s2._id,
    },
    {
      medicineId: medicines[2]._id,
      batchNumber: 'PCM-OLD',
      quantity: 12,
      expiryDate: addDays(-5),
      purchasePrice: 1.1,
      supplierId: s1._id,
    },
    {
      medicineId: medicines[2]._id,
      batchNumber: 'PCM-NEW',
      quantity: 200,
      expiryDate: addDays(500),
      purchasePrice: 1.2,
      supplierId: s1._id,
    },
    {
      medicineId: medicines[3]._id,
      batchNumber: 'IBU-01',
      quantity: 8,
      expiryDate: addDays(180),
      purchasePrice: 1.8,
      supplierId: s2._id,
    },
    {
      medicineId: medicines[4]._id,
      batchNumber: 'CET-01',
      quantity: 40,
      expiryDate: addDays(220),
      purchasePrice: 2.4,
      supplierId: s1._id,
    },
    {
      medicineId: medicines[5]._id,
      batchNumber: 'MET-01',
      quantity: 90,
      expiryDate: addDays(360),
      purchasePrice: 3.1,
      supplierId: s2._id,
    },
    {
      medicineId: medicines[6]._id,
      batchNumber: 'OME-01',
      quantity: 18,
      expiryDate: addDays(25),
      purchasePrice: 4.0,
      supplierId: s1._id,
    },
    {
      medicineId: medicines[7]._id,
      batchNumber: 'VIT-01',
      quantity: 55,
      expiryDate: addDays(600),
      purchasePrice: 2.0,
      supplierId: s2._id,
    },
  ]);

  await PurchaseOrder.create({
    supplierId: s1._id,
    status: 'ordered',
    createdBy: pharmacist._id,
    notes: 'Restock ibuprofen and omeprazole',
    items: [
      { medicineId: medicines[3]._id, quantity: 100, unitCost: 1.75, receivedQty: 0 },
      { medicineId: medicines[6]._id, quantity: 50, unitCost: 3.9, receivedQty: 0 },
    ],
  });

  console.log('Seed complete.');
  console.log('Users (password for all: Password123!):');
  console.log('  admin@pharmacy.com');
  console.log('  pharmacist@pharmacy.com');
  console.log('  cashier@pharmacy.com');
  return { admin };
  }
};

const run = async () => {
  await connectDB();
  await seedDatabase();
  await mongoose.disconnect();
};

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
