import mongoose from "mongoose";

export interface ICities extends Document {
  city: string;
  meal: number;
  transport: number;
}

const citiesSchema = new mongoose.Schema<ICities>(
  {
    city: {
      type: String,
      required: [true, "A cidade é obrigatória"],
    },
    meal: {
      type: Number,
      required: [true, "O valor do vale refeição é obrigatório"],
    },
    transport: {
      type: Number,
      required: [true, "O valor do vale transporte é obrigatório"],
    },
  },
  {
    timestamps: true,
  },
);

export const Cities = mongoose.model("Cities", citiesSchema);
