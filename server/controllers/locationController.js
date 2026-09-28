import Location from '../models/Location.js';
import Asset from '../models/Asset.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getLocations = async (req, res, next) => {
  try {
    const locations = await Location.find().sort({ building: 1, floor: 1 });

    // Aggregate asset statistics for each location
    const stats = await Asset.aggregate([
      {
        $group: {
          _id: '$location',
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

    const enriched = locations.map((loc) => {
      const s = statMap.get(String(loc._id)) || {
        assetCount: 0,
        totalValue: 0,
        activeCount: 0,
        maintenanceCount: 0,
      };
      return {
        ...loc.toObject(),
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

export const createLocation = async (req, res, next) => {
  try {
    const { building, floor, room, rack, address, description } = req.body;
    const location = new Location({
      building,
      floor,
      room,
      rack,
      address,
      description,
    });
    await location.save();

    await logAuditEvent({
      user: req.user,
      action: 'CREATE_LOCATION',
      entity: 'Location',
      entityId: location._id,
      details: `Created location ${location.building} - ${location.room || location.floor}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Location created successfully.', data: location });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

    await logAuditEvent({
      user: req.user,
      action: 'UPDATE_LOCATION',
      entity: 'Location',
      entityId: location._id,
      details: `Updated location ${location.building}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Location updated.', data: location });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const inUse = await Asset.countDocuments({ location: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete location because ${inUse} assets are assigned to it. Reassign assets first.`,
      });
    }
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Location deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
