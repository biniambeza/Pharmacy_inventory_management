const express = require('express');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/schemas');
const ctrl = require('../controllers/authController');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const bootstrapOrAdmin = asyncHandler(async (req, res, next) => {
  const count = await User.countDocuments();
  if (count === 0) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Admin authentication required to register users', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') throw new AppError('Not authenticated', 401);
    if (user.role !== 'admin') throw new AppError('Only admins can create users', 403);
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired token', 401);
  }
});

router.post('/login', validate(loginSchema), ctrl.login);
router.post('/register', bootstrapOrAdmin, validate(registerSchema), ctrl.register);
router.get('/me', protect, ctrl.me);
router.get('/users', protect, authorize('admin'), ctrl.listUsers);
router.put('/users/:id', protect, authorize('admin'), ctrl.updateUser);

module.exports = router;
