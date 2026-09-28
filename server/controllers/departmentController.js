import Department from '../models/Department.js';
import Asset from '../models/Asset.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().populate('manager', 'name email').sort({ name: 1 });

    const stats = await Asset.aggregate([
      {
        $group: {
          _id: '$department',
          assetCount: { $sum: 1 },
          totalValue: { $sum: '$purchaseCost' },
          activeCount: {
            $sum: { $cond: [{ $in: ['$status', ['ACTIVE', 'ASSIGNED', 'INSTALLED']] }, 1, 0] },
          },
          maintenanceCount: {
            $sum: { $cond: [{ $in: ['$status', ['MAINTENANCE', 'REPAIR']] }, 1, 0] },
          },
        },
      },
    ]);

    const statMap = new Map(stats.map((s) => [String(s._id), s]));

    const enriched = departments.map((dept) => {
      const s = statMap.get(String(dept._id)) || {
        assetCount: 0,
        totalValue: 0,
        activeCount: 0,
        maintenanceCount: 0,
      };
      return {
        ...dept.toObject(),
        assetCount: s.assetCount,
        totalValue: s.totalValue,
        activeCount: s.activeCount,
        maintenanceCount: s.maintenanceCount,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, manager, description } = req.body;
    const department = new Department({
      name,
      code,
      manager: manager || null,
      description,
    });
    await department.save();

    await logAuditEvent({
      user: req.user,
      action: 'CREATE_DEPARTMENT',
      entity: 'Department',
      entityId: department._id,
      details: `Created department ${department.name}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Department created.', data: department });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found.' });

    await logAuditEvent({
      user: req.user,
      action: 'UPDATE_DEPARTMENT',
      entity: 'Department',
      entityId: department._id,
      details: `Updated department ${department.name}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Department updated.', data: department });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const inUse = await Asset.countDocuments({ department: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department because ${inUse} assets are assigned to it.`,
      });
    }
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
