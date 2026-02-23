// src/controllers/reportController.js
const Order = require("../models/Order");
const KOT = require("../models/KOT");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");
const Report = require("../models/Report");
const moment = require("moment");

// Generate daily report
exports.generateDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    const startDate = moment(reportDate).startOf("day").toDate();
    const endDate = moment(reportDate).endOf("day").toDate();

    // Get orders for the day
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "completed",
    }).populate("items.menuItem");

    // Calculate sales data
    const sales = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: 0,
      dineInOrders: 0,
      parcelOrders: 0,
      dineInRevenue: 0,
      parcelRevenue: 0,
    };

    sales.averageOrderValue =
      sales.totalOrders > 0 ? sales.totalRevenue / sales.totalOrders : 0;

    // Item wise sales
    const itemSales = {};
    const categorySales = {};
    const payments = { cash: 0, card: 0, upi: 0, wallet: 0 };

    orders.forEach((order) => {
      // Count by order type
      if (order.orderType === "dine_in") {
        sales.dineInOrders++;
        sales.dineInRevenue += order.total;
      } else {
        sales.parcelOrders++;
        sales.parcelRevenue += order.total;
      }

      // Payment method
      if (order.paymentMethod) {
        payments[order.paymentMethod] += order.total;
      }

      // Items
      order.items.forEach((item) => {
        const itemId = item.menuItem._id.toString();
        if (!itemSales[itemId]) {
          itemSales[itemId] = {
            menuItem: item.menuItem,
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[itemId].quantity += item.quantity;
        itemSales[itemId].revenue += item.price * item.quantity;

        // Category
        const category = item.menuItem.category;
        if (!categorySales[category]) {
          categorySales[category] = {
            category,
            quantity: 0,
            revenue: 0,
          };
        }
        categorySales[category].quantity += item.quantity;
        categorySales[category].revenue += item.price * item.quantity;
      });
    });

    // Get KOT stats
    const kots = await KOT.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalPrepTime = kots.reduce((sum, kot) => {
      if (kot.preparedTime) {
        return sum + (kot.preparedTime - kot.createdAt);
      }
      return sum;
    }, 0);

    const kotStats = {
      total: kots.length,
      averagePreparationTime:
        kots.length > 0
          ? totalPrepTime / kots.length / 60000 // Convert to minutes
          : 0,
    };

    // Table stats
    const tables = await Table.find();
    const occupiedTables = tables.filter((t) => t.status === "occupied");

    const tableStats = {
      totalTables: tables.length,
      totalOccupied: occupiedTables.length,
      averageOccupancyTime: 0, // Calculate if needed
    };

    // Create or update report
    const report = await Report.findOneAndUpdate(
      { reportType: "daily", date: startDate },
      {
        reportType: "daily",
        date: startDate,
        sales,
        items: Object.values(itemSales),
        categories: Object.values(categorySales),
        payments,
        kotStats,
        tableStats,
      },
      { upsert: true, new: true },
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sales summary
exports.getSalesSummary = async (req, res) => {
  try {
    const { period } = req.query; // daily, weekly, monthly

    let startDate;
    const endDate = new Date();

    switch (period) {
      case "weekly":
        startDate = moment().subtract(7, "days").toDate();
        break;
      case "monthly":
        startDate = moment().subtract(30, "days").toDate();
        break;
      default:
        startDate = moment().startOf("day").toDate();
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "completed",
    });

    const summary = {
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: orders.length,
      dineInOrders: orders.filter((o) => o.orderType === "dine_in").length,
      parcelOrders: orders.filter((o) => o.orderType === "parcel").length,
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
          : 0,
    };

    // Group by date
    const dailyData = {};
    orders.forEach((order) => {
      const date = moment(order.createdAt).format("YYYY-MM-DD");
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          revenue: 0,
          orders: 0,
        };
      }
      dailyData[date].revenue += order.total;
      dailyData[date].orders++;
    });

    res.json({
      success: true,
      data: {
        summary,
        dailyData: Object.values(dailyData),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get popular items
exports.getPopularItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const orders = await Order.find({
      createdAt: { $gte: moment().subtract(30, "days").toDate() },
    }).populate("items.menuItem");

    const itemCount = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemId = item.menuItem._id.toString();
        if (!itemCount[itemId]) {
          itemCount[itemId] = {
            name: item.menuItem.name,
            category: item.menuItem.category,
            quantity: 0,
            revenue: 0,
          };
        }
        itemCount[itemId].quantity += item.quantity;
        itemCount[itemId].revenue += item.price * item.quantity;
      });
    });

    const popularItems = Object.values(itemCount)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    res.json({
      success: true,
      data: popularItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
