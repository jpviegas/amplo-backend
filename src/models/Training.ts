import mongoose from "mongoose";

export interface ITraining extends Document {
  title: string;
  subTitle: string;
  image: string;
}

const trainingSchema = new mongoose.Schema<ITraining>(
  {
    title: {
      type: String,
      required: [true, "O nome é obrigatório"],
    },
    subTitle: {
      type: String,
      required: [true, "O subtítulo é obrigatório"],
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Training = mongoose.model("Training", trainingSchema);
