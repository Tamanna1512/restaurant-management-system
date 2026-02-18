// src/routes/menuRoutes.js
const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");
const { authorize } = require("../middleware/auth");

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const { category, isAvailable } = req.query;
    const query = {};

    if (category) query.category = category;
    if (isAvailable) query.isAvailable = isAvailable === "true";

    const menuItems = await MenuItem.find(query).sort("category name");

    res.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Create menu item (admin/manager only)
router.post("/", authorize("admin", "manager"), async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Update menu item
router.put("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete menu item
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update availability
router.patch(
  "/:id/availability",
  authorize("admin", "manager", "waiter"),
  async (req, res) => {
    try {
      const { isAvailable } = req.body;

      const menuItem = await MenuItem.findByIdAndUpdate(
        req.params.id,
        { isAvailable },
        { new: true },
      );

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        });
      }

      res.json({
        success: true,
        data: menuItem,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// Get menu by categories
router.get("/categories/all", async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true });

    const categorizedMenu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      data: categorizedMenu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
