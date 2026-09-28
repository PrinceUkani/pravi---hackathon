import Vendor from '../models/Vendor.js';
import Asset from '../models/Asset.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });

    const stats = await Asset.aggregate([
      {
        $group: {
          _id: '$vendor',
          assetCount: { $sum: 1 },
          totalValue: { $sum: '$purchaseCost' },
          activeCount: {
            $sum: { $cond: [{ $in: ['$status', ['ACTIVE', 'ASSIGNED', 'INSTALLED']] }, 1, 0] },
          },
        },
      },
    ]);

    const statMap = new Map(stats.map((s) => [String(s._id), s]));

    const enriched = vendors.map((v) => {
      const s = statMap.get(String(v._id)) || {
        assetCount: 0,
        totalValue: 0,
        activeCount: 0,
      };
      return {
        ...v.toObject(),
        assetCount: s.assetCount,
        totalValue: s.totalValue,
        activeCount: s.activeCount,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

export const createVendor = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address, website } = req.body;
    const vendor = new Vendor({ name, contactPerson, email, phone, address, website });
    await vendor.save();

    await logAuditEvent({
      user: req.user,
      action: 'CREATE_VENDOR',
      entity: 'Vendor',
      entityId: vendor._id,
      details: `Created vendor ${vendor.name}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Vendor created.', data: vendor });
  } catch (error) {
    next(error);
  }
};

export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });

    await logAuditEvent({
      user: req.user,
      action: 'UPDATE_VENDOR',
      entity: 'Vendor',
      entityId: vendor._id,
      details: `Updated vendor ${vendor.name}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Vendor updated.', data: vendor });
  } catch (error) {
    next(error);
  }
};

export const deleteVendor = async (req, res, next) => {
  try {
    const inUse = await Asset.countDocuments({ vendor: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vendor because ${inUse} assets are associated with it.`,
      });
    }
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vendor deleted.' });
  } catch (error) {
    next(error);
  }
};
