const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true // Snapshot at time of order
  },
  selectedOption: {
    type: Object,
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true // Price at time of order
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  addressType: String
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: String
}, { _id: false });

const shippingSchema = new mongoose.Schema({
  provider: {
    type: String,
    default: 'shiprocket'
  },
  shiprocketOrderId: {
    type: String,
    index: true
  },
  shipmentId: {
    type: String,
    index: true
  },
  awbCode: String,
  courierName: String,
  courierCompanyId: Number,
  pickupScheduled: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['not_created', 'created', 'awb_assigned', 'picked', 'in_transit', 'delivered', 'rto', 'cancelled'],
    default: 'not_created'
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: addressSchema,
    required: true
  },
  billingAddress: addressSchema,
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
    index: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  shippingCharges: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  razorpayOrderId: {
    type: String,
    index: true
  },
  trackingNumber: String,
  shippingProvider: String,
  shipping: shippingSchema,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  adminNotes: String,
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ orderStatus: 1 });

// Static method to generate order number
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${random}`;
};

// Instance method to calculate totals
orderSchema.methods.calculateTotals = function() {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate tax (18% GST)
  this.tax = Math.round(this.subtotal * 0.18);
  
  // Calculate total amount
  this.totalAmount = this.subtotal + this.shippingCharges + this.tax - this.discount;
  
  return this;
};

// Instance method to add status history
orderSchema.methods.addStatusHistory = function(status, note = '') {
  this.statusHistory.push({
    status,
    timestamp: Date.now(),
    note
  });
  
  return this;
};

// Instance method to check if order can be cancelled
orderSchema.methods.canCancel = function() {
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  return cancellableStatuses.includes(this.orderStatus);
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function(reason) {
  if (!this.canCancel()) {
    throw new Error('Order cannot be cancelled in current status');
  }
  
  this.orderStatus = 'cancelled';
  this.cancelledAt = Date.now();
  this.cancellationReason = reason;
  this.addStatusHistory('cancelled', reason);
  
  return this;
};

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Ensure virtuals are included when converting to JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = this.constructor.generateOrderNumber();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
