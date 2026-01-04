import mongoose from "mongoose";

export interface IHolerite extends Document {
  holerite: string;
}

const positionSchema = new mongoose.Schema<IHolerite>(
  {
    holerite: {
      type: String,
      required: [true, "O holerite é obrigatório"],
    },
  },
  {
    timestamps: true,
  }
);

export const Holerite = mongoose.model("Holerite", positionSchema);
