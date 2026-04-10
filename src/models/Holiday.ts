import mongoose, { Document } from "mongoose";

export interface IHoliday extends Document {
  date: string;
  comment: string;
}

const holidaySchema = new mongoose.Schema<IHoliday>(
  {
    date: {
      type: String,
      required: [true, "A data do feriado é obrigatório"],
      trim: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Holiday = mongoose.model("Holiday", holidaySchema);
