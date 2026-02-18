// src/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  sales: {
    totalOrders: Number,
    totalRevenue: Number,
    averageOrderValue: Number,
    dineInOrders: Number,
    parcelOrders: Number,
    dineInRevenue: Number,
    parcelRevenue: Number
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    name: String,
    quantity: Number,
    revenue: Number
  }],
  categories: [{
    category: String,
    quantity: Number,
    revenue: Number
  }],
  payments: {
    cash: Number,
    card: Number,
    upi: Number,
    wallet: Number
  },
  kotStats: {
    total: Number,
    averagePreparationTime: Number
  },
  tableStats: {
    totalTables: Number,
    totalOccupied: Number,
    averageOccupancyTime: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);