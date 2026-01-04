import mongoose from "mongoose";

export interface IPosition extends Document {
  positionName: string;
  approvalFlow: string;
  sheetNumber: string;
}

const positionSchema = new mongoose.Schema<IPosition>(
  {
    positionName: {
      type: String,
      required: [true, "O nome é obrigatório"],
    },
  },
  {
    timestamps: true,
  }
);

export const Position = mongoose.model("Position", positionSchema);
