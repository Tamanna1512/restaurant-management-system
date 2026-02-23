// src/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/daily", reportController.generateDailyReport);
router.get("/sales-summary", reportController.getSalesSummary);
router.get("/popular-items", reportController.getPopularItems);

module.exports = router;
