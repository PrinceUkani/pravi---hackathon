import Asset from '../models/Asset.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';

export const generateAssetId = async (categoryCode = 'AST') => {
  const prefix = (categoryCode || 'AST').toUpperCase().trim();
  const regex = new RegExp(`^${prefix}-\\d{6}$`);
  
  // Find highest current number for this prefix
  const lastAsset = await Asset.findOne({ assetId: regex }).sort({ assetId: -1 });
  let nextNum = 1;
  if (lastAsset && lastAsset.assetId) {
    const parts = lastAsset.assetId.split('-');
    if (parts.length === 2 && !isNaN(parts[1])) {
      nextNum = parseInt(parts[1], 10) + 1;
    }
  }

  // Ensure uniqueness
  let candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
  let exists = await Asset.findOne({ assetId: candidate });
  while (exists) {
    nextNum++;
    candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    exists = await Asset.findOne({ assetId: candidate });
  }

  return candidate;
};

export const generateTicketId = async () => {
  const prefix = 'MNT';
  const lastTicket = await MaintenanceTicket.findOne({ ticketId: /^MNT-\d{6}$/ }).sort({ ticketId: -1 });
  let nextNum = 101;
  if (lastTicket && lastTicket.ticketId) {
    const parts = lastTicket.ticketId.split('-');
    if (parts.length === 2 && !isNaN(parts[1])) {
      nextNum = parseInt(parts[1], 10) + 1;
    }
  }

  let candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
  let exists = await MaintenanceTicket.findOne({ ticketId: candidate });
  while (exists) {
    nextNum++;
    candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    exists = await MaintenanceTicket.findOne({ ticketId: candidate });
  }

  return candidate;
};
