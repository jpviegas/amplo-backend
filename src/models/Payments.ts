import mongoose, { Document } from "mongoose";

export interface IPayments extends Document {
  meal: string;
  transport: string;
}

const paymentsSchema = new mongoose.Schema<IPayments>(
  {
    meal: {
      type: String,
      required: [true, "O vale refeição é obrigatório"],
    },
    transport: {
      type: String,
      required: [true, "O vale transporte é obrigatório"],
    },
  },
  {
    timestamps: true,
  },
);

export const Payments = mongoose.model("Payments", paymentsSchema);
