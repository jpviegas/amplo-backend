import mongoose, { Document } from "mongoose";

export interface IEPI extends Document {
  name: string;
  ca: string;
}

const epiSchema = new mongoose.Schema<IEPI>(
  {
    name: {
      type: String,
      required: [true, "O nome do EPI é obrigatório"],
    },
    ca: {
      type: String,
      required: [true, "O C.A. é obrigatório"],
    },
  },
  {
    timestamps: true,
  },
);

export const EPI = mongoose.model("EPI", epiSchema);
