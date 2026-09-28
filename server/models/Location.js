import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    building: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
      default: 'Ground Floor',
    },
    room: {
      type: String,
      default: '',
    },
    rack: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ building: 1, floor: 1, room: 1, rack: 1 });

const Location = mongoose.model('Location', locationSchema);
export default Location;
