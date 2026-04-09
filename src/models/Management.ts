import mongoose, { Document } from "mongoose";

export interface IManagement extends Document {
  employeeId: mongoose.Types.ObjectId;
  epiId: mongoose.Types.ObjectId;
  quantity?: number;
  size?: string;
  comment?: string;
}

const managementSchema = new mongoose.Schema<IManagement>(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "O ID do funcionário é obrigatório"],
    },
    epiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EPI",
      required: [true, "O ID do EPI é obrigatório"],
    },
    quantity: {
      type: Number,
      default: 0,
    },
    size: {
      type: String,
      default: "",
    },
    comment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const Management = mongoose.model("Management", managementSchema);
