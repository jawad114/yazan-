const mongoose = require('mongoose');
const { MenuCategorySchema } = require('./MenuCategory'); // Adjust path as necessary

// Define Restaurant Schema
const RestaurantsSchema = new mongoose.Schema({
    restaurantName: { type: String, required: true },
    picture: { type: String, required: true },
    location: { type: String },
    coordinates: {
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false }
    },
    menu: [MenuCategorySchema],
    contact: { type: String},
    availableOptions:{
      'delivery':{type: Boolean, default: true},
      'dine-in':{type: Boolean, default: true},
      'self-pickup':{type: Boolean, default: true},
    },
    generatedEmail: { type: String},
    generatedPassword: { type: String},
    deliveryCharges: {
      type: Map,
      of: Number, // Key: city name, Value: delivery charge
    },
    statusByTimezone: {
      'Asia/Karachi': { status: String },
      'Asia/Jerusalem': { status: String },
      // Add other timezones as needed
    },
    openingHours: {
      sunday: {
        open: { type: String, default: "00:00" }, // Default to midnight if not specified
        close: { type: String, default: "00:00" } // Default to midnight if not specified
      },
      monday: {
        open: { type: String, default: "00:00" },
        close: { type: String, default: "00:00" }
      },
      tuesday: {
        open: { type: String, default: "00:00" },
        close: { type: String, default: "00:00" }
      },
      wednesday: {
        open: { type: String, default: "00:00" },
        close: { type: String, default: "00:00" }
      },
      thursday: {
        open: { type: String, default: "00:00" },
        close: { type: String, default: "00:00" }
      },
      friday: {
        open: { type: String, default: "00:00" },
        close: { type: String, default: "00:00" }
      },
      saturday: {
        open: { type: String, default: "00:00" },
        close: { type: String, default: "00:00" }
      }
    },
    status: { type: String, enum: ['open', 'closed', 'busy'], default: 'open' }
  }, {
    collection: "restaurantInfo"
  });
  
  const Restaurant = mongoose.model("RestaurantInfo", RestaurantsSchema);
  module.exports = Restaurant;
