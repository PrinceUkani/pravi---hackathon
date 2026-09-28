import QRCode from 'qrcode';
import { Parser } from 'json2csv';
import Asset from '../models/Asset.js';
import AssetHistory from '../models/AssetHistory.js';
import Category from '../models/Category.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import Location from '../models/Location.js';
import Department from '../models/Department.js';
import Vendor from '../models/Vendor.js';
import { generateAssetId } from '../utils/idGenerator.js';
import { calculateHealthAndReplacementScore } from '../services/healthScoreService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// 1. GET ASSETS (Paginated, Search, Filters, Sort)
export const getAssets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      category,
      department,
      location,
      condition,
      warrantyStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Global Search across Asset ID, Name, Serial Number, Brand, Model
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { assetId: searchRegex },
        { name: searchRegex },
        { serialNumber: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
        { assetTag: searchRegex },
      ];
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (department) query.department = department;
    if (location) query.location = location;
    if (condition) query.condition = condition;

    // Filter by calculated warranty status
    if (warrantyStatus) {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (warrantyStatus === 'ACTIVE') {
        query.warrantyExpiry = { $gt: in30Days };
      } else if (warrantyStatus === 'EXPIRING_SOON') {
        query.warrantyExpiry = { $gte: now, $lte: in30Days };
      } else if (warrantyStatus === 'EXPIRED') {
        query.warrantyExpiry = { $lt: now };
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [assets, total] = await Promise.all([
      Asset.find(query)
        .populate('category', 'name code')
        .populate('location', 'building floor room rack')
        .populate('department', 'name code')
        .populate('assignedTo', 'name email avatar')
        .populate('vendor', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Asset.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        assets,
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

// 2. GET ASSET BY ID
export const getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let asset;

    // Allow lookup by Mongo _id OR by custom assetId (e.g. SRV-000124)
    if (id.includes('-')) {
      asset = await Asset.findOne({ assetId: id.toUpperCase().trim() });
    } else {
      asset = await Asset.findById(id);
    }

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: `Asset not found with identifier: ${id}`,
      });
    }

    await asset.populate([
      { path: 'category', select: 'name code expectedLifespanYears icon' },
      { path: 'location', select: 'building floor room rack address' },
      { path: 'department', select: 'name code manager' },
      { path: 'assignedTo', select: 'name email role department avatar' },
      { path: 'vendor', select: 'name contactPerson email phone website' },
      { path: 'retirement.approvedBy', select: 'name email' },
    ]);

    // Fetch maintenance tickets count & stats
    const maintenanceTickets = await MaintenanceTicket.find({ asset: asset._id })
      .populate('assignedTechnician', 'name email')
      .populate('reportedBy', 'name email')
      .sort({ createdDate: -1 });

    const totalMaintenanceCost = maintenanceTickets.reduce((acc, t) => acc + (t.actualCost || 0), 0);
    const completedTickets = maintenanceTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');

    // Recalculate health & replacement scores with live ticket history
    const scoreResults = calculateHealthAndReplacementScore(asset, completedTickets.length);
    if (
      asset.healthScore !== scoreResults.healthScore ||
      asset.replacementScore !== scoreResults.replacementScore
    ) {
      asset.healthScore = scoreResults.healthScore;
      asset.healthStatus = scoreResults.healthStatus;
      asset.replacementScore = scoreResults.replacementScore;
      asset.replacementPriority = scoreResults.replacementPriority;
      asset.replacementReasons = scoreResults.replacementReasons;
      asset.maintenanceCost = totalMaintenanceCost;
      await asset.save();
    }

    res.json({
      success: true,
      data: {
        asset,
        maintenanceTickets,
        maintenanceStats: {
          totalCount: maintenanceTickets.length,
          completedCount: completedTickets.length,
          totalCost: totalMaintenanceCost,
          averageCost: completedTickets.length > 0 ? Math.round(totalMaintenanceCost / completedTickets.length) : 0,
          lastMaintenanceDate: asset.lastMaintenanceDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. CREATE ASSET
export const createAsset = async (req, res, next) => {
  try {
    const {
      name,
      category,
      type,
      brand,
      model,
      serialNumber,
      assetTag,
      vendor,
      purchaseDate,
      purchaseCost,
      warrantyStart,
      warrantyExpiry,
      warrantyProvider,
      warrantyType,
      location,
      department,
      assignedTo,
      condition,
      status,
      description,
      replacementCost,
      maintenanceIntervalDays,
    } = req.body;

    // Check serial number uniqueness
    const existingSerial = await Asset.findOne({ serialNumber: serialNumber.trim() });
    if (existingSerial) {
      return res.status(400).json({
        success: false,
        message: `Serial number ${serialNumber} is already registered to asset ${existingSerial.assetId}.`,
      });
    }

    // Lookup Category for code prefix
    const catDoc = await Category.findById(category);
    const catCode = catDoc ? catDoc.code : 'AST';
    const catName = catDoc ? catDoc.name : '';

    const assetId = await generateAssetId(catCode);

    // Initial rule-based health score calculation
    const dummyAsset = {
      purchaseDate: purchaseDate || new Date(),
      purchaseCost: Number(purchaseCost) || 0,
      condition: condition || 'GOOD',
      status: status || 'ACTIVE',
      warrantyExpiry,
      maintenanceCost: 0,
    };
    const scoreResults = calculateHealthAndReplacementScore(dummyAsset, 0);

    const asset = new Asset({
      assetId,
      name,
      category,
      categoryName: catName,
      type: type || (catDoc ? catDoc.name : ''),
      brand,
      model,
      serialNumber: serialNumber.trim(),
      assetTag: assetTag || assetId,
      vendor: vendor || null,
      purchaseDate: purchaseDate || new Date(),
      purchaseCost: Number(purchaseCost) || 0,
      warrantyStart: warrantyStart || null,
      warrantyExpiry: warrantyExpiry || null,
      warrantyProvider: warrantyProvider || brand,
      warrantyType: warrantyType || 'Standard',
      location: location || null,
      department: department || null,
      assignedTo: assignedTo || null,
      condition: condition || 'GOOD',
      status: status || 'ACTIVE',
      description: description || '',
      replacementCost: Number(replacementCost) || Number(purchaseCost) || 0,
      maintenanceIntervalDays: Number(maintenanceIntervalDays) || 90,
      healthScore: scoreResults.healthScore,
      healthStatus: scoreResults.healthStatus,
      replacementScore: scoreResults.replacementScore,
      replacementPriority: scoreResults.replacementPriority,
      replacementReasons: scoreResults.replacementReasons,
    });

    await asset.save();

    // Create initial lifecycle timeline events
    await AssetHistory.create([
      {
        asset: asset._id,
        action: 'PURCHASED',
        description: `Purchased from ${warrantyProvider || brand} for $${asset.purchaseCost.toLocaleString()}`,
        newValue: { purchaseCost: asset.purchaseCost, purchaseDate: asset.purchaseDate },
        performedBy: req.user._id,
        performedByName: req.user.name,
        timestamp: asset.purchaseDate,
      },
      {
        asset: asset._id,
        action: 'CREATED',
        description: `Asset registered into Infraro platform as ${asset.assetId} with condition ${asset.condition}`,
        newValue: { assetId: asset.assetId, status: asset.status, condition: asset.condition },
        performedBy: req.user._id,
        performedByName: req.user.name,
        timestamp: new Date(),
      },
    ]);

    // Log to Audit trail
    await logAuditEvent({
      user: req.user,
      action: 'CREATE_ASSET',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `Created asset ${asset.name} (${asset.assetId})`,
      newValue: asset.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Asset ${asset.assetId} created successfully.`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

// 4. UPDATE ASSET
export const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found.',
      });
    }

    const previousStatus = asset.status;
    const previousCondition = asset.condition;

    // Check serial number uniqueness if changed
    if (req.body.serialNumber && req.body.serialNumber !== asset.serialNumber) {
      const existingSerial = await Asset.findOne({
        serialNumber: req.body.serialNumber.trim(),
        _id: { $ne: asset._id },
      });
      if (existingSerial) {
        return res.status(400).json({
          success: false,
          message: `Serial number ${req.body.serialNumber} is already used by ${existingSerial.assetId}.`,
        });
      }
    }

    // Apply allowed updates
    const fieldsToUpdate = [
      'name', 'type', 'brand', 'model', 'serialNumber', 'assetTag',
      'vendor', 'purchaseDate', 'purchaseCost', 'warrantyStart', 'warrantyExpiry',
      'warrantyProvider', 'warrantyType', 'location', 'department', 'assignedTo',
      'condition', 'status', 'description', 'replacementCost', 'maintenanceIntervalDays',
      'nextMaintenanceDate',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        asset[field] = req.body[field];
      }
    });

    // Recalculate health & replacement score
    const ticketCount = await MaintenanceTicket.countDocuments({
      asset: asset._id,
      status: { $in: ['RESOLVED', 'CLOSED'] },
    });
    const scores = calculateHealthAndReplacementScore(asset, ticketCount);
    asset.healthScore = scores.healthScore;
    asset.healthStatus = scores.healthStatus;
    asset.replacementScore = scores.replacementScore;
    asset.replacementPriority = scores.replacementPriority;
    asset.replacementReasons = scores.replacementReasons;

    await asset.save();

    // Create history events if status or condition changed
    if (previousStatus !== asset.status) {
      await AssetHistory.create({
        asset: asset._id,
        action: 'STATUS_CHANGED',
        description: `Status changed from ${previousStatus} to ${asset.status}`,
        oldValue: previousStatus,
        newValue: asset.status,
        performedBy: req.user._id,
        performedByName: req.user.name,
      });
    }

    if (previousCondition !== asset.condition) {
      await AssetHistory.create({
        asset: asset._id,
        action: 'CONDITION_CHANGED',
        description: `Condition updated from ${previousCondition} to ${asset.condition}`,
        oldValue: previousCondition,
        newValue: asset.condition,
        performedBy: req.user._id,
        performedByName: req.user.name,
      });
    }

    // Audit log
    await logAuditEvent({
      user: req.user,
      action: 'UPDATE_ASSET',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `Updated asset details for ${asset.assetId}`,
      oldValue: { status: previousStatus, condition: previousCondition },
      newValue: { status: asset.status, condition: asset.condition },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Asset ${asset.assetId} updated successfully.`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

// 5. DELETE ASSET (ADMIN ONLY)
export const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found.',
      });
    }

    // Safety: check active maintenance tickets
    const activeTickets = await MaintenanceTicket.countDocuments({
      asset: asset._id,
      status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
    });
    if (activeTickets > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete asset with ${activeTickets} active maintenance tickets. Resolve tickets first.`,
      });
    }

    await Asset.findByIdAndDelete(id);

    await logAuditEvent({
      user: req.user,
      action: 'DELETE_ASSET',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `Asset ${asset.name} (${asset.assetId}) deleted by ${req.user.name}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Asset ${asset.assetId} successfully removed.`,
    });
  } catch (error) {
    next(error);
  }
};

// 6. GET ASSET HISTORY (Vertical Timeline)
export const getAssetHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    let assetIdQuery = id;
    if (id.includes('-')) {
      const a = await Asset.findOne({ assetId: id.toUpperCase().trim() });
      if (!a) {
        return res.status(404).json({ success: false, message: 'Asset not found.' });
      }
      assetIdQuery = a._id;
    }

    const history = await AssetHistory.find({ asset: assetIdQuery })
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// 7. TRANSFER ASSET (Location, Department, Assigned User)
export const transferAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { locationId, departmentId, assignedToId, transferNotes } = req.body;

    const asset = await Asset.findById(id)
      .populate('location')
      .populate('department')
      .populate('assignedTo');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    if (asset.status === 'RETIRED' || asset.status === 'DISPOSED') {
      return res.status(400).json({
        success: false,
        message: `Cannot transfer an asset that is currently ${asset.status}.`,
      });
    }

    const oldLocationStr = asset.location ? `${asset.location.building} - ${asset.location.room || asset.location.floor}` : 'Unassigned';
    const oldDeptStr = asset.department ? asset.department.name : 'Unassigned';
    const oldAssigneeStr = asset.assignedTo ? asset.assignedTo.name : 'Unassigned';

    let locationDoc = null;
    let deptDoc = null;

    if (locationId) {
      locationDoc = await Location.findById(locationId);
      asset.location = locationId;
    }
    if (departmentId) {
      deptDoc = await Department.findById(departmentId);
      asset.department = departmentId;
    }
    if (assignedToId !== undefined) {
      asset.assignedTo = assignedToId || null;
    }

    // If status was INSTALLED or RECEIVED, set to ASSIGNED/ACTIVE
    if (['PROCUREMENT', 'RECEIVED', 'INSTALLED'].includes(asset.status)) {
      asset.status = assignedToId ? 'ASSIGNED' : 'ACTIVE';
    }

    await asset.save();
    await asset.populate(['location', 'department', 'assignedTo']);

    const newLocationStr = asset.location ? `${asset.location.building} - ${asset.location.room || asset.location.floor}` : 'Unassigned';
    const newDeptStr = asset.department ? asset.department.name : 'Unassigned';
    const newAssigneeStr = asset.assignedTo ? asset.assignedTo.name : 'Unassigned';

    // Record Lifecycle History
    await AssetHistory.create({
      asset: asset._id,
      action: 'TRANSFERRED',
      description: `Asset reassigned. Location: [${oldLocationStr} → ${newLocationStr}], Department: [${oldDeptStr} → ${newDeptStr}], Assignee: [${oldAssigneeStr} → ${newAssigneeStr}]. Notes: ${transferNotes || 'None'}`,
      oldValue: { location: oldLocationStr, department: oldDeptStr, assignedTo: oldAssigneeStr },
      newValue: { location: newLocationStr, department: newDeptStr, assignedTo: newAssigneeStr },
      performedBy: req.user._id,
      performedByName: req.user.name,
      metadata: { transferNotes },
    });

    await logAuditEvent({
      user: req.user,
      action: 'TRANSFER_ASSET',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `Transferred asset ${asset.assetId} to ${newDeptStr} / ${newLocationStr}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Asset ${asset.assetId} transferred successfully.`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

// 8. RETIRE ASSET
export const retireAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    if (asset.status === 'DISPOSED') {
      return res.status(400).json({
        success: false,
        message: 'Asset has already been disposed.',
      });
    }

    const previousStatus = asset.status;
    asset.status = 'RETIRED';
    asset.retirement = {
      date: new Date(),
      reason: reason || 'Scheduled end of lifecycle retirement',
      approvedBy: req.user._id,
      notes: notes || '',
    };
    asset.assignedTo = null; // Unassign upon retirement

    await asset.save();

    await AssetHistory.create({
      asset: asset._id,
      action: 'RETIRED',
      description: `Asset officially retired from active service. Reason: ${reason || 'N/A'}. Approved by: ${req.user.name}`,
      oldValue: previousStatus,
      newValue: 'RETIRED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      metadata: asset.retirement,
    });

    await logAuditEvent({
      user: req.user,
      action: 'RETIRE_ASSET',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `Retired asset ${asset.assetId}. Reason: ${reason}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Asset ${asset.assetId} retired successfully.`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

// 9. DISPOSE ASSET
export const disposeAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { method, cost, notes } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const previousStatus = asset.status;
    asset.status = 'DISPOSED';
    asset.disposal = {
      date: new Date(),
      method: method || 'Certified E-Waste Recycling',
      cost: Number(cost) || 0,
      notes: notes || '',
    };
    asset.condition = 'CRITICAL';
    asset.assignedTo = null;

    await asset.save();

    await AssetHistory.create({
      asset: asset._id,
      action: 'DISPOSED',
      description: `Asset permanently disposed via ${asset.disposal.method}. Disposal cost: $${asset.disposal.cost}. Notes: ${notes || 'None'}`,
      oldValue: previousStatus,
      newValue: 'DISPOSED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      metadata: asset.disposal,
    });

    await logAuditEvent({
      user: req.user,
      action: 'DISPOSE_ASSET',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `Disposed asset ${asset.assetId} via ${asset.disposal.method}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Asset ${asset.assetId} disposed successfully.`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

// 10. GENERATE QR CODE
export const getAssetQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const assetDirectUrl = `${clientUrl}/assets/${asset.assetId}`;

    // Generate high resolution QR code data URL
    const qrDataUrl = await QRCode.toDataURL(assetDirectUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#042716', // Emerald ink dark
        light: '#ffffff',
      },
    });

    res.json({
      success: true,
      data: {
        assetId: asset.assetId,
        name: asset.name,
        serialNumber: asset.serialNumber,
        assetUrl: assetDirectUrl,
        qrCode: qrDataUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 11. EXPORT ASSETS TO CSV
export const exportAssetsCSV = async (req, res, next) => {
  try {
    const { status, category, department } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (department) query.department = department;

    const assets = await Asset.find(query)
      .populate('category', 'name code')
      .populate('location', 'building floor room rack')
      .populate('department', 'name')
      .populate('vendor', 'name')
      .populate('assignedTo', 'name email');

    const fields = [
      { label: 'Asset ID', value: 'assetId' },
      { label: 'Asset Name', value: 'name' },
      { label: 'Category', value: (row) => row.category?.name || '' },
      { label: 'Brand', value: 'brand' },
      { label: 'Model', value: 'model' },
      { label: 'Serial Number', value: 'serialNumber' },
      { label: 'Asset Tag', value: 'assetTag' },
      { label: 'Status', value: 'status' },
      { label: 'Condition', value: 'condition' },
      { label: 'Location', value: (row) => row.location ? `${row.location.building} ${row.location.room || ''}` : '' },
      { label: 'Department', value: (row) => row.department?.name || '' },
      { label: 'Assigned To', value: (row) => row.assignedTo?.name || '' },
      { label: 'Purchase Date', value: (row) => row.purchaseDate ? new Date(row.purchaseDate).toISOString().split('T')[0] : '' },
      { label: 'Purchase Cost ($)', value: 'purchaseCost' },
      { label: 'Maintenance Cost ($)', value: 'maintenanceCost' },
      { label: 'Total Lifecycle Cost ($)', value: (row) => (row.purchaseCost || 0) + (row.maintenanceCost || 0) },
      { label: 'Warranty Expiry', value: (row) => row.warrantyExpiry ? new Date(row.warrantyExpiry).toISOString().split('T')[0] : '' },
      { label: 'Health Score', value: 'healthScore' },
      { label: 'Replacement Score', value: 'replacementScore' },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(assets);

    res.header('Content-Type', 'text/csv');
    res.attachment(`infraro_asset_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

// 12. IMPORT ASSETS FROM CSV
export const importAssetsCSV = async (req, res, next) => {
  try {
    const { rows } = req.body; // Expect parsed array of row objects

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No asset data provided in CSV import payload.',
      });
    }

    const categories = await Category.find();
    const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    let successful = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Validation
      if (!row.name || !row.serialNumber || !row.brand) {
        errors.push({ row: rowNum, error: 'Missing required fields: Name, Serial Number, or Brand' });
        continue;
      }

      // Check duplicate serial
      const duplicate = await Asset.findOne({ serialNumber: row.serialNumber.trim() });
      if (duplicate) {
        errors.push({ row: rowNum, error: `Duplicate serial number: ${row.serialNumber} already registered to ${duplicate.assetId}` });
        continue;
      }

      // Match category
      const catKey = (row.category || 'Other').toLowerCase();
      let categoryDoc = catMap.get(catKey) || categories[0];
      const assetId = await generateAssetId(categoryDoc ? categoryDoc.code : 'AST');

      try {
        const newAsset = new Asset({
          assetId,
          name: row.name.trim(),
          category: categoryDoc._id,
          categoryName: categoryDoc.name,
          type: row.type || categoryDoc.name,
          brand: row.brand.trim(),
          model: row.model || 'Standard',
          serialNumber: row.serialNumber.trim(),
          assetTag: row.assetTag || assetId,
          purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : new Date(),
          purchaseCost: Number(row.purchaseCost) || 0,
          warrantyExpiry: row.warrantyExpiry ? new Date(row.warrantyExpiry) : null,
          condition: row.condition || 'GOOD',
          status: row.status || 'ACTIVE',
          description: row.description || 'Imported via CSV',
        });

        const scores = calculateHealthAndReplacementScore(newAsset, 0);
        newAsset.healthScore = scores.healthScore;
        newAsset.healthStatus = scores.healthStatus;
        newAsset.replacementScore = scores.replacementScore;
        newAsset.replacementPriority = scores.replacementPriority;
        newAsset.replacementReasons = scores.replacementReasons;

        await newAsset.save();

        await AssetHistory.create({
          asset: newAsset._id,
          action: 'CREATED',
          description: `Bulk imported into Infraro inventory from CSV by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name,
        });

        successful++;
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
      }
    }

    await logAuditEvent({
      user: req.user,
      action: 'CSV_IMPORT_ASSETS',
      entity: 'Asset',
      entityId: `BATCH_${Date.now()}`,
      details: `CSV import completed: ${successful} imported, ${errors.length} failed`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `CSV Import complete: ${successful} assets imported successfully, ${errors.length} rows failed.`,
      data: {
        successful,
        failed: errors.length,
        errors,
      },
    });
  } catch (error) {
    next(error);
  }
};
