const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    company: {
      type: String,
      required: true,
    },
    approvalFlow: { type: String },
    sheetNumber: { type: String },
  },
  {
    timestamps: true,
  },
);

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;
