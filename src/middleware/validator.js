// src/middleware/validator.js
const { body, validationResult } = require("express-validator");

// Validation rules for order creation
exports.validateOrder = [
  body("orderType")
    .isIn(["dine_in", "parcel", "delivery"])
    .withMessage("Invalid order type"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.menuItem").isMongoId().withMessage("Invalid menu item ID"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("tableId").optional().isMongoId().withMessage("Invalid table ID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation rules for table creation/update
exports.validateTable = [
  body("tableNumber")
    .isInt({ min: 1 })
    .withMessage("Table number must be a positive integer"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("section")
    .optional()
    .isIn(["indoor", "outdoor", "private"])
    .withMessage("Invalid section"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation rules for user registration
exports.validateUser = [
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["admin", "waiter", "kitchen", "cashier"])
    .withMessage("Invalid role"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];
