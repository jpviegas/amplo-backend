import mongoose from "mongoose";

export interface IAbono extends Document {
  reason: "Esqueci" | "Atestado" | "Justificada" | "Injustificada";
  initialDate: Number;
  finalDate: Number;
  initialTime: Number;
  finalTime: Number;
  fullJourney: boolean;
  note: string;
  attachment: string;
  user: mongoose.Schema.Types.ObjectId;
}

const abonoSchema = new mongoose.Schema<IAbono>(
  {
    reason: {
      type: String,
      required: true,
    },
    initialDate: {
      type: String,
    },
    finalDate: {
      type: String,
    },
    initialTime: {
      type: String,
    },
    finalTime: {
      type: String,
    },
    fullJourney: {
      type: Boolean,
    },
    note: {
      type: String,
    },
    attachment: {
      type: String,
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

export const Abono = mongoose.model("Abono", abonoSchema);
