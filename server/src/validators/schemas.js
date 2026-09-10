const Joi = require('joi');
const { objectId } = require('./objectId');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(72).required(),
  role: Joi.string().valid('admin', 'pharmacist', 'cashier').required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const medicineSchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  genericName: Joi.string().min(1).max(120).required(),
  category: Joi.string().min(1).max(80).required(),
  manufacturer: Joi.string().min(1).max(120).required(),
  unit: Joi.string().min(1).max(40).default('tablet'),
  price: Joi.number().min(0).required(),
  reorderLevel: Joi.number().integer().min(0).default(10),
  requiresPrescription: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
});

const batchSchema = Joi.object({
  medicineId: objectId.required(),
  batchNumber: Joi.string().min(1).max(60).required(),
  quantity: Joi.number().integer().min(0).required(),
  expiryDate: Joi.date().required(),
  purchasePrice: Joi.number().min(0).required(),
  supplierId: objectId.allow(null, ''),
});

const supplierSchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  contact: Joi.string().min(1).max(80).required(),
  address: Joi.string().min(1).max(240).required(),
  email: Joi.string().email().allow('', null),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const purchaseOrderSchema = Joi.object({
  supplierId: objectId.required(),
  notes: Joi.string().allow('', null),
  items: Joi.array()
    .items(
      Joi.object({
        medicineId: objectId.required(),
        quantity: Joi.number().integer().min(1).required(),
        unitCost: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),
});

const receivePOSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        medicineId: objectId.required(),
        receivedQty: Joi.number().integer().min(1).required(),
        batchNumber: Joi.string().min(1).max(60).required(),
        expiryDate: Joi.date().required(),
      })
    )
    .min(1)
    .required(),
});

const saleSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        medicineId: objectId.required(),
        qty: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
  discount: Joi.number().min(0).default(0),
  taxRate: Joi.number().min(0).max(1).allow(null),
  paymentMethod: Joi.string().valid('cash', 'card', 'mobile').default('cash'),
  prescription: Joi.object({
    patientName: Joi.string().min(1).required(),
    doctorName: Joi.string().min(1).required(),
    notes: Joi.string().allow('', null),
    date: Joi.date().allow(null),
  }).optional(),
});

module.exports = {
  loginSchema,
  registerSchema,
  medicineSchema,
  batchSchema,
  supplierSchema,
  purchaseOrderSchema,
  receivePOSchema,
  saleSchema,
};
