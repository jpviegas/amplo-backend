import mongoose from "mongoose";

export interface ITransporte extends Document {
  month: String;
  year: Number;
  dailyValue: Number;
  daysWorked: number;
  totalValue: number;
  user: mongoose.Schema.Types.ObjectId;
}
const transporteSchema = new mongoose.Schema<ITransporte>(
  {
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    daysWorked: {
      type: Number,
      required: true,
      min: 0,
      max: 31,
    },
    dailyValue: {
      type: Number,
      required: true,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Transporte = mongoose.model("Transporte", transporteSchema);
