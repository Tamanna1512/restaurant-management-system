// src/routes/tableRoutes.js
const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");

router.get("/", tableController.getAllTables);
router.post("/", tableController.createTable);
router.put("/:id/status", tableController.updateTableStatus);
router.put("/:id/hold", tableController.holdTable);
router.get("/:id/orders", tableController.getTableOrders);

module.exports = router;
