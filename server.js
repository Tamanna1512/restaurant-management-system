// server.js
const { app, connectDB } = require("./src/app");
const http = require("http");
const socketIO = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join room based on user role
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Handle table status updates
  socket.on("table-update", (data) => {
    io.emit("table-updated", data);
  });

  // Handle new orders
  socket.on("new-order", (data) => {
    io.emit("order-created", data);
    // Notify kitchen
    io.to("kitchen").emit("new-kot", data);
  });

  // Handle KOT updates
  socket.on("kot-update", (data) => {
    io.emit("kot-updated", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// Connect to database and start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`WebSocket server is ready`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

module.exports = server;
