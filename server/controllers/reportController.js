import Asset from '../models/Asset.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';

export const getAssetReport = async (req, res, next) => {
  try {
    const assets = await Asset.find()
      .populate('category', 'name code')
      .populate('location', 'building floor room')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

export const getWarrantyReport = async (req, res, next) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [expired, expiringSoon, active] = await Promise.all([
      Asset.find({ warrantyExpiry: { $lt: now } })
        .populate('vendor', 'name')
        .populate('department', 'name')
        .sort({ warrantyExpiry: 1 }),
      Asset.find({ warrantyExpiry: { $gte: now, $lte: in30Days } })
        .populate('vendor', 'name')
        .populate('department', 'name')
        .sort({ warrantyExpiry: 1 }),
      Asset.find({ warrantyExpiry: { $gt: in30Days } })
        .populate('vendor', 'name')
        .populate('department', 'name')
        .sort({ warrantyExpiry: 1 }),
    ]);

    res.json({
      success: true,
      data: {
        expired,
        expiringSoon,
        active,
        summary: {
          expiredCount: expired.length,
          expiringSoonCount: expiringSoon.length,
          activeCount: active.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceReport = async (req, res, next) => {
  try {
    const tickets = await MaintenanceTicket.find()
      .populate('asset', 'assetId name categoryName brand model')
      .populate('assignedTechnician', 'name email')
      .sort({ createdDate: -1 });

    const totalCost = tickets.reduce((sum, t) => sum + (t.actualCost || 0), 0);
    const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    res.json({
      success: true,
      data: {
        tickets,
        summary: {
          totalTickets: tickets.length,
          resolvedCount,
          openCount: tickets.length - resolvedCount,
          totalCost,
          avgCost: resolvedCount > 0 ? Math.round(totalCost / resolvedCount) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHealthReport = async (req, res, next) => {
  try {
    const assets = await Asset.find()
      .select('assetId name brand model condition healthScore healthStatus replacementScore replacementPriority replacementReasons purchaseCost maintenanceCost')
      .populate('department', 'name')
      .populate('location', 'building room')
      .sort({ healthScore: 1 });

    const healthSummary = {
      healthy: assets.filter((a) => a.healthScore >= 80).length,
      needsAttention: assets.filter((a) => a.healthScore >= 60 && a.healthScore < 80).length,
      atRisk: assets.filter((a) => a.healthScore >= 40 && a.healthScore < 60).length,
      critical: assets.filter((a) => a.healthScore < 40).length,
    };

    const replacementSummary = {
      critical: assets.filter((a) => a.replacementScore >= 80).length,
      high: assets.filter((a) => a.replacementScore >= 65 && a.replacementScore < 80).length,
      medium: assets.filter((a) => a.replacementScore >= 40 && a.replacementScore < 65).length,
      low: assets.filter((a) => a.replacementScore < 40).length,
    };

    res.json({
      success: true,
      data: {
        assets,
        healthSummary,
        replacementSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};
