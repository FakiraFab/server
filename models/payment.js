const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['razorpay', 'cod'],
    required: true
  },
  providerPaymentId: {
    type: String,
    index: true
  },
  providerOrderId: {
    type: String,
    index: true
  },
  providerSignature: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  method: {
    type: String, // card, netbanking, upi, wallet
    default: null
  },
  email: String,
  contact: String,
  description: String,
  failureReason: String,
  refundAmount: {
    type: Number,
    default: 0
  },
  refundedAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ providerOrderId: 1 });
paymentSchema.index({ providerPaymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
