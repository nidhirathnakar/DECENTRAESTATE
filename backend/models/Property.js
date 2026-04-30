const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  propertyId: { type: Number, required: true, unique: true },
  address: { type: String, required: true },
  title: { type: String, required: true },
  estimatedValue: { type: Number, default: 0 },
  ownerAddress: { type: String, required: true },
  registrationDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false },
  txHash: String,
  blockNumber: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

PropertySchema.index({ propertyId: 1 }, { unique: true });

module.exports = mongoose.model('Property', PropertySchema);
