import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    categoryName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: '',
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    assetTag: {
      type: String,
      trim: true,
      default: '',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    purchaseCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    warrantyStart: {
      type: Date,
    },
    warrantyExpiry: {
      type: Date,
      index: true,
    },
    warrantyProvider: {
      type: String,
      default: '',
    },
    warrantyType: {
      type: String,
      default: 'Standard',
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'PROCUREMENT',
        'RECEIVED',
        'INSTALLED',
        'ASSIGNED',
        'ACTIVE',
        'MAINTENANCE',
        'REPAIR',
        'DAMAGED',
        'LOST',
        'REPLACEMENT_REQUESTED',
        'RETIRED',
        'DISPOSED',
      ],
      default: 'ACTIVE',
      index: true,
    },
    condition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'],
      default: 'GOOD',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
      index: true,
    },
    healthStatus: {
      type: String,
      enum: ['Healthy', 'Needs Attention', 'At Risk', 'Critical'],
      default: 'Healthy',
    },
    replacementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    replacementPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    replacementReasons: {
      type: [String],
      default: [],
    },
    maintenanceCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    replacementCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    nextMaintenanceDate: {
      type: Date,
      index: true,
    },
    maintenanceIntervalDays: {
      type: Number,
      default: 90,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    retirement: {
      date: { type: Date },
      reason: { type: String, default: '' },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String, default: '' },
    },
    disposal: {
      date: { type: Date },
      method: { type: String, default: '' },
      cost: { type: Number, default: 0 },
      notes: { type: String, default: '' },
    },
    documents: [
      {
        name: { type: String, required: true },
        type: { type: String, default: 'Document' },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for dynamic warranty status calculation
assetSchema.virtual('warrantyStatus').get(function () {
  if (!this.warrantyExpiry) return 'NO_WARRANTY';
  const now = new Date();
  const expiry = new Date(this.warrantyExpiry);
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 30) return 'EXPIRING_SOON';
  return 'ACTIVE';
});

// Virtual for remaining warranty days
assetSchema.virtual('warrantyDaysRemaining').get(function () {
  if (!this.warrantyExpiry) return null;
  const now = new Date();
  const expiry = new Date(this.warrantyExpiry);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

// Virtual for total lifecycle cost: Purchase Cost + Maintenance Cost
assetSchema.virtual('totalLifecycleCost').get(function () {
  return (this.purchaseCost || 0) + (this.maintenanceCost || 0);
});

// Compound indexes for high-performance dashboard, filters and search
assetSchema.index({ status: 1, condition: 1 });
assetSchema.index({ category: 1, status: 1 });
assetSchema.index({ department: 1, status: 1 });
assetSchema.index({ location: 1, status: 1 });
assetSchema.index({ warrantyExpiry: 1, status: 1 });

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
