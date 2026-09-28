import Asset from '../models/Asset.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import AssetHistory from '../models/AssetHistory.js';
import Category from '../models/Category.js';
import Location from '../models/Location.js';

// 1. KPI STATS
export const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalAssets,
      activeAssets,
      maintenanceAssets,
      retiredAssets,
      warrantyExpiring,
      criticalAssets,
      financialAgg,
    ] = await Promise.all([
      Asset.countDocuments(),
      Asset.countDocuments({ status: { $in: ['ACTIVE', 'ASSIGNED', 'INSTALLED'] } }),
      Asset.countDocuments({ status: { $in: ['MAINTENANCE', 'REPAIR'] } }),
      Asset.countDocuments({ status: { $in: ['RETIRED', 'DISPOSED'] } }),
      Asset.countDocuments({ warrantyExpiry: { $gte: now, $lte: in30Days } }),
      Asset.countDocuments({ $or: [{ condition: 'CRITICAL' }, { healthScore: { $lt: 40 } }] }),
      Asset.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$purchaseCost' },
            totalMaintSpend: { $sum: '$maintenanceCost' },
          },
        },
      ]),
    ]);

    const totalAssetValue = financialAgg[0]?.totalValue || 0;
    const totalMaintenanceSpend = financialAgg[0]?.totalMaintSpend || 0;

    res.json({
      success: true,
      data: {
        totalAssets,
        activeAssets,
        maintenanceAssets,
        retiredAssets,
        warrantyExpiring,
        criticalAssets,
        totalAssetValue,
        totalMaintenanceSpend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. ANALYTICS & CHARTS
export const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Assets by Category
    const byCategory = await Asset.aggregate([
      {
        $group: {
          _id: '$categoryName',
          count: { $sum: 1 },
          totalValue: { $sum: '$purchaseCost' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Assets by Status
    const byStatus = await Asset.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Assets by Location (Building)
    const byLocation = await Asset.aggregate([
      {
        $lookup: {
          from: 'locations',
          localField: 'location',
          foreignField: '_id',
          as: 'loc',
        },
      },
      { $unwind: { path: '$loc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$loc.building', 'Unassigned'] },
          count: { $sum: 1 },
          value: { $sum: '$purchaseCost' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Asset Age Distribution
    const allAssets = await Asset.find({}, 'purchaseDate');
    const ageBuckets = {
      '< 1 year': 0,
      '1–3 years': 0,
      '3–5 years': 0,
      '5–7 years': 0,
      '7+ years': 0,
    };
    allAssets.forEach((a) => {
      const pDate = a.purchaseDate ? new Date(a.purchaseDate) : now;
      const ageYrs = (now - pDate) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYrs < 1) ageBuckets['< 1 year']++;
      else if (ageYrs < 3) ageBuckets['1–3 years']++;
      else if (ageYrs < 5) ageBuckets['3–5 years']++;
      else if (ageYrs < 7) ageBuckets['5–7 years']++;
      else ageBuckets['7+ years']++;
    });

    const ageDistribution = Object.entries(ageBuckets).map(([name, count]) => ({
      name,
      count,
    }));

    // Maintenance Cost Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const maintTrendAgg = await MaintenanceTicket.aggregate([
      {
        $match: {
          status: { $in: ['RESOLVED', 'CLOSED'] },
          resolvedDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$resolvedDate' },
            month: { $month: '$resolvedDate' },
          },
          totalCost: { $sum: '$actualCost' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maintenanceCostTrend = maintTrendAgg.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      cost: item.totalCost,
      count: item.count,
    }));

    // Warranty Buckets
    const [expiredCount, d0_30, d31_60, d61_90, d90plus] = await Promise.all([
      Asset.countDocuments({ warrantyExpiry: { $lt: now } }),
      Asset.countDocuments({ warrantyExpiry: { $gte: now, $lte: in30Days } }),
      Asset.countDocuments({ warrantyExpiry: { $gt: in30Days, $lte: in60Days } }),
      Asset.countDocuments({ warrantyExpiry: { $gt: in60Days, $lte: in90Days } }),
      Asset.countDocuments({ warrantyExpiry: { $gt: in90Days } }),
    ]);

    const warrantyBuckets = [
      { name: 'Expired', count: expiredCount, color: '#ef4444' },
      { name: '0–30 days', count: d0_30, color: '#f59e0b' },
      { name: '31–60 days', count: d31_60, color: '#eab308' },
      { name: '61–90 days', count: d61_90, color: '#10b981' },
      { name: '90+ days', count: d90plus, color: '#059669' },
    ];

    // High Priority / Critical Assets
    const criticalAssetsList = await Asset.find({
      $or: [{ condition: 'CRITICAL' }, { condition: 'POOR' }, { healthScore: { $lt: 50 } }],
    })
      .select('assetId name brand model condition healthScore status location')
      .populate('location', 'building room')
      .sort({ healthScore: 1 })
      .limit(5);

    // Warranty Alerts (Expiring in <= 30 days)
    const warrantyAlertsList = await Asset.find({
      warrantyExpiry: { $gte: now, $lte: in30Days },
    })
      .select('assetId name brand model warrantyExpiry warrantyProvider status')
      .sort({ warrantyExpiry: 1 })
      .limit(5);

    // Replacement Candidates (Highest Replacement Score)
    const replacementCandidates = await Asset.find({
      replacementScore: { $gte: 50 },
      status: { $nin: ['RETIRED', 'DISPOSED'] },
    })
      .select('assetId name brand model healthScore replacementScore replacementPriority replacementReasons purchaseCost maintenanceCost')
      .sort({ replacementScore: -1 })
      .limit(5);

    // Upcoming Preventive Maintenance
    const upcomingMaintenance = await MaintenanceTicket.find({
      status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
    })
      .populate('asset', 'assetId name location')
      .populate('assignedTechnician', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    // Recent Lifecycle Activity
    const recentActivity = await AssetHistory.find()
      .populate('asset', 'assetId name')
      .sort({ timestamp: -1 })
      .limit(8);

    res.json({
      success: true,
      data: {
        byCategory: byCategory.map((c) => ({ name: c._id || 'Other', count: c.count, value: c.totalValue })),
        byStatus: byStatus.map((s) => ({ name: s._id, count: s.count })),
        byLocation: byLocation.map((l) => ({ name: l._id, count: l.count, value: l.value })),
        ageDistribution,
        maintenanceCostTrend,
        warrantyBuckets,
        criticalAssets: criticalAssetsList,
        warrantyAlerts: warrantyAlertsList,
        replacementCandidates,
        upcomingMaintenance,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
