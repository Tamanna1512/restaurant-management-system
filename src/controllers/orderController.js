// src/controllers/orderController.js
const Order = require("../models/Order");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");
const KOT = require("../models/KOT");

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    // Calculate totals
    let subtotal = 0;
    for (const item of orderData.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        item.price = menuItem.price;
        subtotal += menuItem.price * item.quantity;
      }
    }

    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    const order = new Order({
      ...orderData,
      subtotal,
      tax,
      total,
    });

    await order.save();

    // Update table status if dine-in
    if (orderData.orderType === "dine_in" && orderData.tableId) {
      await Table.findByIdAndUpdate(orderData.tableId, {
        status: "occupied",
        currentOrder: order._id,
        occupiedSince: new Date(),
      });
    }

    // Generate KOT
    await generateKOT(order);

    // Emit socket event
    const io = req.app.get("io");
    io.emit("newOrder", order);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to generate KOT
async function generateKOT(order) {
  const kotItems = order.items.filter((item) => item.status === "pending");

  if (kotItems.length > 0) {
    const kot = new KOT({
      orderId: order._id,
      tableNumber: order.tableId,
      items: kotItems.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        notes: item.notes,
      })),
    });

    await kot.save();

    // Update order with KOT reference
    order.kotIds.push(kot._id);
    await order.save();

    return kot;
  }
}

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, type, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.orderType = type;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const orders = await Order.find(query)
      .populate("tableId")
      .populate("items.menuItem")
      .sort("-createdAt");

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

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).populate("tableId");

    // If order is completed, free up the table
    if (
      status === "completed" &&
      order.orderType === "dine_in" &&
      order.tableId
    ) {
      await Table.findByIdAndUpdate(order.tableId._id, {
        status: "available",
        currentOrder: null,
        occupiedSince: null,
      });
    }

    const io = req.app.get("io");
    io.emit("orderUpdated", order);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Add items to existing order
exports.addItemsToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const order = await Order.findById(id);

    // Add new items
    for (const newItem of items) {
      const menuItem = await MenuItem.findById(newItem.menuItem);
      newItem.price = menuItem.price;
      order.items.push(newItem);

      // Recalculate totals
      order.subtotal += menuItem.price * newItem.quantity;
    }

    order.tax = order.subtotal * 0.05;
    order.total = order.subtotal + order.tax;

    await order.save();

    // Generate new KOT for added items
    const newKOT = await generateKOT(order);

    const io = req.app.get("io");
    io.emit("orderUpdated", order);

    res.json({
      success: true,
      data: order,
      kot: newKOT,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
