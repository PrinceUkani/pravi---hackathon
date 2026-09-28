import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { entity, action, search } = req.query;
    const query = {};

    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { entityId: searchRegex },
        { details: searchRegex },
        { userName: searchRegex },
        { action: searchRegex },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email role avatar')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
