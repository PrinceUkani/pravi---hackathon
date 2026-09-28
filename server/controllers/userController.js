import User from '../models/User.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    const user = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'TECHNICIAN',
      department: department || 'General',
      phone: phone || '',
    });

    await user.save();

    await logAuditEvent({
      user: req.user,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      details: `Created user ${user.email} with role ${user.role}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, role, department, phone, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const previousRole = user.role;
    if (name) user.name = name;
    if (role) user.role = role;
    if (department) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await logAuditEvent({
      user: req.user,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id,
      details: `Updated user ${user.email}. Role: ${previousRole} → ${user.role}, Active: ${user.isActive}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User updated successfully.', data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await User.findByIdAndDelete(req.params.id);

    await logAuditEvent({
      user: req.user,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: user._id,
      details: `Deleted user ${user.email}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};
