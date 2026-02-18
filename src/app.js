// src/app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import middleware
const { requestLogger } = require("./middleware/logger");
const { errorHandler } = require("./middleware/errorHandler");
const { authenticate } = require("./middleware/auth");

// Import routes
const authRoutes = require("./routes/authRoutes");
const tableRoutes = require("./routes/tableRoutes");
const orderRoutes = require("./routes/orderRoutes");
const kotRoutes = require("./routes/kotRoutes");
const reportRoutes = require("./routes/reportRoutes");
const menuRoutes = require("./routes/menuRoutes");
const userRoutes = require("./routes/userRoutes");

// Initialize express app
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Apply rate limiting to API routes
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// Request logging
app.use(requestLogger);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_db",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// API Routes (public)
app.use("/api/auth", authRoutes);

// API Routes (protected)
app.use("/api/tables", authenticate, tableRoutes);
app.use("/api/orders", authenticate, orderRoutes);
app.use("/api/kot", authenticate, kotRoutes);
app.use("/api/reports", authenticate, reportRoutes);
app.use("/api/menu", authenticate, menuRoutes);
app.use("/api/users", authenticate, userRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve frontend for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Export app and connectDB function
module.exports = { app, connectDB };
