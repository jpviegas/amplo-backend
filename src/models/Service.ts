import mongoose from "mongoose";

export interface IService extends Document {
  type: "RH" | "OP" | "OR";
  subject: String;
  text: String;
  user: mongoose.Schema.Types.ObjectId;
}

const serviceSchema = new mongoose.Schema<IService>(
  {
    type: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
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

export const Service = mongoose.model("Service", serviceSchema);
