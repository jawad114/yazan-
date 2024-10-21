const mongoose = require('mongoose');

// Define Menu Category Schema
const MenuCategorySchema = new mongoose.Schema({
    categoryName: String,
    categoryImage: String,
    dishes: [{
      name: String,
      price: Number,
      dishImage: String,
      description: String,
      visibility: {
        type: Boolean,
        default: true // Default value is true
      },
      extras: {
        requiredExtras: {
          type: [{
            name: String,
            price: Number,
         
          }],
          default: []
        },
        optionalExtras: {
          type: [{
            name: String,
            price: Number
          }],
          default: []
        }
      }
    }]
  });

  const MenuCategory = mongoose.model("MenuCategory", MenuCategorySchema);
  module.exports = { MenuCategory, MenuCategorySchema };
