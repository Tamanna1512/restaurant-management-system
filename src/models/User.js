// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "waiter", "kitchen", "cashier"],
      default: "waiter",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    permissions: [
      {
        type: String,
        enum: [
          "manage_tables",
          "manage_orders",
          "manage_kot",
          "view_reports",
          "manage_menu",
          "manage_users",
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set permissions based on role
userSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    const rolePermissions = {
      admin: [
        "manage_tables",
        "manage_orders",
        "manage_kot",
        "view_reports",
        "manage_menu",
        "manage_users",
      ],
      manager: [
        "manage_tables",
        "manage_orders",
        "manage_kot",
        "view_reports",
        "manage_menu",
      ],
      waiter: ["manage_tables", "manage_orders"],
      kitchen: ["manage_kot"],
      cashier: ["manage_orders", "view_reports"],
    };
    this.permissions = rolePermissions[this.role] || [];
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
