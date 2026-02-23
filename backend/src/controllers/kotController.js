// src/controllers/kotController.js
const KOT = require("../models/KOT");
const Order = require("../models/Order");

// Get all KOTs
exports.getAllKOTs = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) query.status = status;

    const kots = await KOT.find(query)
      .populate("orderId")
      .populate("items.menuItem")
      .sort("-createdAt");

    res.json({
      success: true,
      data: kots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update KOT item status
exports.updateKOTItemStatus = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { status, preparedBy } = req.body;

    const kot = await KOT.findById(id);

    const item = kot.items.id(itemId);
    if (item) {
      item.status = status;

      // Check if all items are ready
      const allReady = kot.items.every((i) => i.status === "ready");
      if (allReady) {
        kot.status = "completed";
        kot.preparedTime = new Date();
      }

      kot.preparedBy = preparedBy;
      await kot.save();

      // Update order item status
      await Order.updateOne(
        {
          kotIds: id,
          "items._id": itemId,
        },
        {
          $set: { "items.$.status": status },
        },
      );

      const io = req.app.get("io");
      io.emit("kotUpdated", kot);
    }

    res.json({
      success: true,
      data: kot,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending KOTs
exports.getPendingKOTs = async (req, res) => {
  try {
    const kots = await KOT.find({
      status: { $in: ["pending", "preparing"] },
    })
      .populate("orderId")
      .sort("priority createdAt");

    res.json({
      success: true,
      data: kots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update KOT priority
exports.updateKOTPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const kot = await KOT.findByIdAndUpdate(id, { priority }, { new: true });

    const io = req.app.get("io");
    io.emit("kotPriorityUpdated", kot);

    res.json({
      success: true,
      data: kot,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
