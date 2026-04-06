import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";

export const ZAPSIGN_DOCUMENT_TYPES = [
  "codigo_conduta",
  "contrato",
  "diversos",
  "ficha_epi",
  "ficha_egistro",
  "politica_interna",
  "saude_ocupacional",
  "termos",
  "demais_documentos",
] as const;

export type ZapSignDocumentType = (typeof ZAPSIGN_DOCUMENT_TYPES)[number];

export interface IZapSigner {
  token: string;
  status: "new" | "link-opened" | "signed";
  name?: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
  signed_at?: Date | null;
}

export interface IZapSignDocument extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  userEmail: string;
  type: ZapSignDocumentType;
  document_name: string;
  token: string;
  status: "pending" | "signed";
  signers: IZapSigner[];
  zapsign_created_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const ZapSignerSchema = new Schema<IZapSigner>(
  {
    token: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "link-opened", "signed"],
      required: true,
    },
    name: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone_country: { type: String },
    phone_number: { type: String },
    signed_at: { type: Date, default: null },
  },
  { _id: false },
);

const ZapSignDocumentSchema = new Schema<IZapSignDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    type: { type: String, enum: ZAPSIGN_DOCUMENT_TYPES, required: true },
    document_name: { type: String, required: true },
    token: { type: String, required: true, index: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "signed"],
      required: true,
      default: "pending",
    },
    signers: { type: [ZapSignerSchema], default: [] },
    zapsign_created_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

ZapSignDocumentSchema.index({ "signers.email": 1 });
ZapSignDocumentSchema.index({ userEmail: 1, created_at: -1 });

export const ZapSignDocumentModel = mongoose.model<IZapSignDocument>(
  "ZapSignDocument",
  ZapSignDocumentSchema,
);
