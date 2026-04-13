import mongoose, { Document } from "mongoose";
import { IUser } from "./User";

export interface IPoint extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  type: "user" | "rh";
}

const PointSchema = new mongoose.Schema<IPoint>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "O ID do usuário é obrigatório"],
    },
    timestamp: {
      type: Date,
      required: [true, "O horário é obrigatório"],
      default: Date.now,
    },
    location: {
      latitude: {
        type: Number,
        required: [true, "A latitude é obrigatória"],
      },
      longitude: {
        type: Number,
        required: [true, "A longitude é obrigatória"],
      },
    },
    type: {
      type: String,
      required: [true, "O tipo do ponto é obrigatório"],
      enum: ["user", "rh"],
    },
  },
  {
    timestamps: true,
  },
);

export const Point = mongoose.model<IPoint>("Point", PointSchema);
