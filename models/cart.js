const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  selectedOption: {
    type: Object,
    default: null // Stores selected color and other options
  },
  priceAtAdd: {
    type: Number,
    required: [true, 'Price at add is required']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Index for efficient product lookups in cart
cartSchema.index({ 'items.productId': 1 });

// Instance method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity, selectedOption, price) {
  // Check if item with same product and options already exists
  const existingItemIndex = this.items.findIndex(item => {
    const sameProduct = item.productId.toString() === productId.toString();
    const sameOption = JSON.stringify(item.selectedOption) === JSON.stringify(selectedOption);
    return sameProduct && sameOption;
  });

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].priceAtAdd = price; // Update to current price
  } else {
    // Add new item
    this.items.push({
      productId,
      quantity,
      selectedOption,
      priceAtAdd: price,
      addedAt: Date.now()
    });
  }

  await this.save();
  return this;
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity, selectedOption) {
  const itemIndex = this.items.findIndex(item => {
    const sameProduct = item.productId.toString() === productId.toString();
    const sameOption = JSON.stringify(item.selectedOption) === JSON.stringify(selectedOption);
    return sameProduct && sameOption;
  });

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    this.items.splice(itemIndex, 1);
  } else {
    this.items[itemIndex].quantity = quantity;
  }

  await this.save();
  return this;
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = async function(productId, selectedOption) {
  this.items = this.items.filter(item => {
    const sameProduct = item.productId.toString() === productId.toString();
    const sameOption = JSON.stringify(item.selectedOption) === JSON.stringify(selectedOption);
    return !(sameProduct && sameOption);
  });

  await this.save();
  return this;
};

// Instance method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  await this.save();
  return this;
};

// Instance method to get total price
cartSchema.methods.getTotalPrice = function() {
  return this.items.reduce((total, item) => {
    return total + (item.priceAtAdd * item.quantity);
  }, 0);
};

// Instance method to get total items count
cartSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
};

// Virtual for total price
cartSchema.virtual('totalPrice').get(function() {
  return this.getTotalPrice();
});

// Virtual for total items
cartSchema.virtual('totalItems').get(function() {
  return this.getTotalItems();
});

// Ensure virtuals are included when converting to JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
