import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  title: string;
  type: "contrato" | "codigo_conduta" | "termos" | "demais_documentos";
  filename: string;
  data: Buffer;
  mimetype: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "O usuário é obrigatório"],
    },
    title: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: {
        values: ["contrato", "codigo_conduta", "termos", "demais_documentos"],
        message: "Tipo de documento inválido",
      },
      required: [true, "O tipo do documento é obrigatório"],
    },
    filename: {
      type: String,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const DocumentModel = mongoose.model<IDocument>(
  "Document",
  documentSchema,
);
