import mongoose from 'mongoose';

const assetHistorySchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATED',
        'PURCHASED',
        'RECEIVED',
        'INSTALLED',
        'ASSIGNED',
        'TRANSFERRED',
        'LOCATION_CHANGED',
        'STATUS_CHANGED',
        'MAINTENANCE_STARTED',
        'MAINTENANCE_COMPLETED',
        'CONDITION_CHANGED',
        'WARRANTY_UPDATED',
        'REPLACEMENT_REQUESTED',
        'REPLACEMENT_APPROVED',
        'RETIRED',
        'DISPOSED',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    performedByName: {
      type: String,
      default: 'System',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

assetHistorySchema.index({ asset: 1, timestamp: -1 });

const AssetHistory = mongoose.model('AssetHistory', assetHistorySchema);
export default AssetHistory;
