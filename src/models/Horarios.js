const mongoose = require("mongoose");

const hourSchema = new mongoose.Schema(
  {
    hour: {
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

const Hour = mongoose.model("Hour", hourSchema);

module.exports = Hour;
