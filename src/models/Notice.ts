import mongoose from "mongoose";

export interface INotice extends Document {
  title: string;
  subTitle: string;
  notice: string;
}

const noticeSchema = new mongoose.Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, "O título é obrigatório"],
    },
    subTitle: {
      type: String,
    },
    notice: {
      type: String,
      required: [true, "A notícia é obrigatória"],
    },
  },
  {
    timestamps: true,
  }
);

export const Notice = mongoose.model("Notice", noticeSchema);
