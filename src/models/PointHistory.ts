import mongoose, { Document } from "mongoose";
import { IUser } from "./User";

export interface IPointHistory extends Document {
  user: mongoose.Schema.Types.ObjectId | IUser;
  month: string;
  year: number;
  pointsCount: number;
  daysWorked: number;
}

const pointHistorySchema = new mongoose.Schema<IPointHistory>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    pointsCount: {
      type: Number,
      default: 0,
    },
    daysWorked: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const PointHistory = mongoose.model("PointHistory", pointHistorySchema);
