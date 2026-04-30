const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  propertyId: { type: Number, required: true, index: true },
  seller: { type: String, required: true },
  buyer: { type: String, required: true },
  sellerAgent: { type: String, required: true },
  buyerAgent: { type: String, required: true },
  salePrice: { type: Number, required: true },
  isDualRepresentation: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  txHash: String,
  blockNumber: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

TransactionSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
