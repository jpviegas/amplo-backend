const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
