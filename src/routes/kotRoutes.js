// src/routes/kotRoutes.js
const express = require("express");
const router = express.Router();
const kotController = require("../controllers/kotController");

router.get("/", kotController.getAllKOTs);
router.get("/pending", kotController.getPendingKOTs);
router.put("/:id/items/:itemId/status", kotController.updateKOTItemStatus);
router.put("/:id/priority", kotController.updateKOTPriority);

module.exports = router;
