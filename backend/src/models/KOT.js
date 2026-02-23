// src/models/KOT.js
const mongoose = require("mongoose");

const kotSchema = new mongoose.Schema(
  {
    kotNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    tableNumber: Number,
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        name: String,
        quantity: Number,
        notes: String,
        status: {
          type: String,
          enum: ["pending", "preparing", "ready", "served"],
          default: "pending",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "preparing", "completed", "cancelled"],
      default: "pending",
    },
    preparedBy: String,
    preparedTime: Date,
    servedTime: Date,
    notes: String,
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
  },
  {
    timestamps: true,
  },
);

// Generate KOT number
kotSchema.pre("save", async function (next) {
  if (!this.kotNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const count = await this.constructor.countDocuments();
    this.kotNumber = `KOT${year}${month}${day}${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("KOT", kotSchema);
