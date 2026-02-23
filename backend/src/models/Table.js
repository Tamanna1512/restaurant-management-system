// src/models/Table.js
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "hold"],
      default: "available",
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    section: {
      type: String,
      enum: ["indoor", "outdoor", "private"],
      default: "indoor",
    },
    holdUntil: {
      type: Date,
    },
    occupiedSince: {
      type: Date,
    },
    waiter: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Table", tableSchema);
