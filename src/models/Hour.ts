import mongoose from "mongoose";

export interface IHours extends Document {
  initialHour: string;
  finalHour: string;
}

const hourSchema = new mongoose.Schema<IHours>(
  {
    initialHour: {
      type: String,
      required: [true, "O horário é obrigatório"],
    },
    finalHour: {
      type: String,
      required: [true, "O horário é obrigatório"],
    },
  },
  {
    timestamps: true,
  },
);

export const Hour = mongoose.model("Hour", hourSchema);
