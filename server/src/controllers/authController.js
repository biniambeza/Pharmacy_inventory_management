const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../utils/audit');

const toUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (user.status !== 'active') throw new AppError('Account is inactive', 403);
  const token = signToken(user);
  res.json({ success: true, token, user: toUser(user) });
});

exports.register = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  if (count > 0 && (!req.user || req.user.role !== 'admin')) {
    throw new AppError('Only admins can create users', 403);
  }
  const { name, email, password, role, status } = req.body;
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role, status: status || 'active' });
  await writeAudit({
    userId: req.user?._id || user._id,
    action: 'user.create',
    entity: 'User',
    entityId: user._id,
    after: { email, role },
  });
  const token = count === 0 ? signToken(user) : undefined;
  res.status(201).json({ success: true, user: toUser(user), token });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: toUser(req.user) });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: users.map(toUser) });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, role, status, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const before = { name: user.name, role: user.role, status: user.status };
  if (name) user.name = name;
  if (role) user.role = role;
  if (status) user.status = status;
  if (password) user.passwordHash = await User.hashPassword(password);
  await user.save();
  await writeAudit({
    userId: req.user._id,
    action: 'user.update',
    entity: 'User',
    entityId: user._id,
    before,
    after: { name: user.name, role: user.role, status: user.status },
  });
  res.json({ success: true, user: toUser(user) });
});
