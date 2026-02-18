// src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.put("/:id/status", orderController.updateOrderStatus);
router.post("/:id/items", orderController.addItemsToOrder);

module.exports = router;
