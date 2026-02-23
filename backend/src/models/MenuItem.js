// src/models/MenuItem.js
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["starter", "main_course", "dessert", "beverage", "soup"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: String,
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
    },
    tax: {
      type: Number,
      default: 5, // percentage
    },
    image: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
