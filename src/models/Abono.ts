import mongoose from "mongoose";

export interface IAbono extends Document {
  reason: "Esqueci" | "Atestado" | "Justificada" | "Injustificada";
  initialDate: Date;
  finalDate: Date;
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
      type: Date,
    },
    finalDate: {
      type: Date,
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
