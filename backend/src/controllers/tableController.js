// src/controllers/tableController.js
const Table = require("../models/Table");
const Order = require("../models/Order");

// Get all tables
exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find().populate("currentOrder");
    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create new table
exports.createTable = async (req, res) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json({
      success: true,
      data: table,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update table status
exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, holdUntil } = req.body;

    const updateData = { status };

    if (status === "occupied") {
      updateData.occupiedSince = new Date();
    } else if (status === "hold") {
      updateData.holdUntil = holdUntil || new Date(Date.now() + 15 * 60000); // Default 15 minutes hold
    } else if (status === "available") {
      updateData.currentOrder = null;
      updateData.occupiedSince = null;
      updateData.holdUntil = null;
    }

    const table = await Table.findByIdAndUpdate(id, updateData, { new: true });

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.emit("tableUpdated", table);

    res.json({
      success: true,
      data: table,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Hold table
exports.holdTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { holdMinutes } = req.body;

    const holdUntil = new Date(Date.now() + (holdMinutes || 15) * 60000);

    const table = await Table.findByIdAndUpdate(
      id,
      {
        status: "hold",
        holdUntil,
      },
      { new: true },
    );

    // Auto release after hold time
    setTimeout(async () => {
      const currentTable = await Table.findById(id);
      if (currentTable && currentTable.status === "hold") {
        currentTable.status = "available";
        currentTable.holdUntil = null;
        await currentTable.save();

        const io = req.app.get("io");
        io.emit("tableUpdated", currentTable);
      }
    }, holdMinutes * 60000);

    res.json({
      success: true,
      data: table,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get table orders
exports.getTableOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({
      tableId: id,
      status: { $ne: "completed" },
    }).populate("items.menuItem");

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
