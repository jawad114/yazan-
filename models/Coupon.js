const mongoose = require('mongoose');
const { Schema } = mongoose;

const CouponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: 'RestaurantInfo', // Reference to a Restaurant model
    required: true
  },
  discountPercentage: {
    type: Number,
    required: true
  },
  userSpecific: {
    type: Boolean,
    default: false // Default to false for non-user-specific coupons
  },
  usageLimit: {
    type: Number,
    default: 1 // Default to 1 if not specified
  },
  userUsage: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientInfo' // Reference to a User model
    },
    count: {
      type: Number,
      default: 0 // Initialize usage count to 0
    }
  }],
  expiryDate: {
    type: Date,
    required: true
  },
  minOrderValue: {
    type: Number,
    default: 0 // Default to 0 if not specified, meaning no minimum order value
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('Coupon', CouponSchema);