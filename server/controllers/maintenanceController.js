import MaintenanceTicket from '../models/MaintenanceTicket.js';
import Asset from '../models/Asset.js';
import AssetHistory from '../models/AssetHistory.js';
import Notification from '../models/Notification.js';
import { generateTicketId } from '../utils/idGenerator.js';
import { calculateHealthAndReplacementScore } from '../services/healthScoreService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// 1. GET TICKETS
export const getTickets = async (req, res, next) => {
  try {
    const { status, priority, technician, assetId, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (technician) query.assignedTechnician = technician;
    if (assetId) query.asset = assetId;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketId: searchRegex },
        { issue: searchRegex },
        { description: searchRegex },
      ];
    }

    // Role filtering: If user is TECHNICIAN and not querying specific filter, optionally emphasize or show all
    const tickets = await MaintenanceTicket.find(query)
      .populate('asset', 'assetId name brand model serialNumber status condition location')
      .populate('assignedTechnician', 'name email avatar')
      .populate('reportedBy', 'name email')
      .sort({ createdDate: -1 });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET TICKET BY ID
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let ticket;
    if (id.includes('-')) {
      ticket = await MaintenanceTicket.findOne({ ticketId: id.toUpperCase().trim() });
    } else {
      ticket = await MaintenanceTicket.findById(id);
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Maintenance ticket not found.' });
    }

    await ticket.populate([
      { path: 'asset', populate: [{ path: 'location' }, { path: 'department' }] },
      { path: 'assignedTechnician', select: 'name email role phone avatar' },
      { path: 'reportedBy', select: 'name email' },
      { path: 'comments.author', select: 'name email avatar' },
    ]);

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// 3. CREATE TICKET
export const createTicket = async (req, res, next) => {
  try {
    const {
      assetId,
      issue,
      description,
      priority = 'MEDIUM',
      assignedTechnician,
      dueDate,
      estimatedCost = 0,
    } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Specified asset does not exist.' });
    }

    const ticketId = await generateTicketId();
    const initialStatus = assignedTechnician ? 'ASSIGNED' : 'OPEN';

    const ticket = new MaintenanceTicket({
      ticketId,
      asset: asset._id,
      issue,
      description,
      priority,
      reportedBy: req.user._id,
      assignedTechnician: assignedTechnician || null,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: initialStatus,
      estimatedCost: Number(estimatedCost) || 0,
    });

    await ticket.save();

    // Create Notification
    await Notification.create({
      title: `Maintenance Ticket Created: ${ticketId}`,
      message: `${priority} priority ticket opened for ${asset.name} (${asset.assetId}): "${issue}"`,
      type: 'MAINTENANCE',
      recipient: assignedTechnician || null,
      link: `/maintenance/${ticket._id}`,
    });

    // Log Audit
    await logAuditEvent({
      user: req.user,
      action: 'CREATE_MAINTENANCE_TICKET',
      entity: 'MaintenanceTicket',
      entityId: ticket.ticketId,
      details: `Created maintenance ticket ${ticket.ticketId} for ${asset.assetId}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Maintenance ticket ${ticket.ticketId} created.`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// 4. UPDATE TICKET & WORKFLOW INTEGRATION
export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await MaintenanceTicket.findById(id).populate('asset');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Maintenance ticket not found.' });
    }

    const previousStatus = ticket.status;
    const {
      status,
      assignedTechnician,
      priority,
      estimatedCost,
      actualCost,
      resolution,
      dueDate,
      issue,
      description,
    } = req.body;

    if (priority !== undefined) ticket.priority = priority;
    if (estimatedCost !== undefined) ticket.estimatedCost = Number(estimatedCost);
    if (actualCost !== undefined) ticket.actualCost = Number(actualCost);
    if (resolution !== undefined) ticket.resolution = resolution;
    if (dueDate !== undefined) ticket.dueDate = dueDate;
    if (issue !== undefined) ticket.issue = issue;
    if (description !== undefined) ticket.description = description;

    if (assignedTechnician !== undefined) {
      ticket.assignedTechnician = assignedTechnician || null;
      if (ticket.status === 'OPEN' && assignedTechnician) {
        ticket.status = 'ASSIGNED';
      }
    }

    const asset = await Asset.findById(ticket.asset._id);

    // WORKFLOW STATE MACHINE
    if (status && status !== previousStatus) {
      ticket.status = status;

      // When ticket moves to IN_PROGRESS: Asset status becomes MAINTENANCE
      if (status === 'IN_PROGRESS' && asset) {
        const oldAssetStatus = asset.status;
        asset.status = 'MAINTENANCE';
        await asset.save();

        await AssetHistory.create({
          asset: asset._id,
          action: 'MAINTENANCE_STARTED',
          description: `Maintenance started on ticket ${ticket.ticketId}: "${ticket.issue}"`,
          oldValue: oldAssetStatus,
          newValue: 'MAINTENANCE',
          performedBy: req.user._id,
          performedByName: req.user.name,
          metadata: { ticketId: ticket.ticketId },
        });
      }

      // When ticket is RESOLVED or CLOSED: Asset status returns to ACTIVE
      if ((status === 'RESOLVED' || status === 'CLOSED') && asset) {
        ticket.resolvedDate = new Date();
        const oldAssetStatus = asset.status;
        asset.status = 'ACTIVE';
        asset.lastMaintenanceDate = new Date();

        // Accumulate actual maintenance cost into asset
        if (ticket.actualCost > 0) {
          asset.maintenanceCost = (asset.maintenanceCost || 0) + Number(ticket.actualCost);
        }

        // Recalculate health & replacement scores with completed ticket
        const completedTickets = await MaintenanceTicket.countDocuments({
          asset: asset._id,
          status: { $in: ['RESOLVED', 'CLOSED'] },
        });
        const scores = calculateHealthAndReplacementScore(asset, completedTickets + 1);
        asset.healthScore = scores.healthScore;
        asset.healthStatus = scores.healthStatus;
        asset.replacementScore = scores.replacementScore;
        asset.replacementPriority = scores.replacementPriority;
        asset.replacementReasons = scores.replacementReasons;

        await asset.save();

        await AssetHistory.create({
          asset: asset._id,
          action: 'MAINTENANCE_COMPLETED',
          description: `Maintenance completed for ticket ${ticket.ticketId}. Resolution: "${ticket.resolution || 'Resolved'}". Cost: $${ticket.actualCost}`,
          oldValue: oldAssetStatus,
          newValue: 'ACTIVE',
          performedBy: req.user._id,
          performedByName: req.user.name,
          metadata: {
            ticketId: ticket.ticketId,
            actualCost: ticket.actualCost,
            resolution: ticket.resolution,
          },
        });

        // Trigger Notification
        await Notification.create({
          title: `Maintenance Completed: ${asset.assetId}`,
          message: `Ticket ${ticket.ticketId} resolved for ${asset.name}. Asset status restored to ACTIVE.`,
          type: 'MAINTENANCE',
          link: `/assets/${asset.assetId}`,
        });
      }
    }

    await ticket.save();

    await logAuditEvent({
      user: req.user,
      action: 'UPDATE_MAINTENANCE_TICKET',
      entity: 'MaintenanceTicket',
      entityId: ticket.ticketId,
      details: `Updated ticket ${ticket.ticketId} status: ${previousStatus} → ${ticket.status}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Ticket ${ticket.ticketId} updated successfully.`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// 5. ADD COMMENT
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Maintenance ticket not found.' });
    }

    ticket.comments.push({
      author: req.user._id,
      authorName: req.user.name,
      comment: comment.trim(),
      createdAt: new Date(),
    });

    await ticket.save();
    await ticket.populate('comments.author', 'name email avatar');

    res.json({
      success: true,
      message: 'Comment added.',
      data: ticket.comments,
    });
  } catch (error) {
    next(error);
  }
};

// 6. DELETE TICKET (ADMIN ONLY)
export const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    await MaintenanceTicket.findByIdAndDelete(id);

    await logAuditEvent({
      user: req.user,
      action: 'DELETE_MAINTENANCE_TICKET',
      entity: 'MaintenanceTicket',
      entityId: ticket.ticketId,
      details: `Deleted ticket ${ticket.ticketId}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Ticket ${ticket.ticketId} deleted.`,
    });
  } catch (error) {
    next(error);
  }
};
