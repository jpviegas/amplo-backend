import { ZapSignDocumentModel, IZapSignDocument, IZapSigner } from "../models/ZapSignDocument";
import mongoose from "mongoose";

export async function saveZapSignDocument(doc: {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  document_name: string;
  token: string;
  status: "pending" | "signed";
  signers: IZapSigner[];
}): Promise<IZapSignDocument> {
  const created = await ZapSignDocumentModel.create(doc);
  return created;
}

export async function findByToken(token: string): Promise<IZapSignDocument | null> {
  return ZapSignDocumentModel.findOne({ token });
}

export async function updateStatusByToken(
  token: string,
  newStatus: "pending" | "signed",
): Promise<IZapSignDocument | null> {
  return ZapSignDocumentModel.findOneAndUpdate(
    { token },
    { status: newStatus },
    { new: true },
  );
}

export async function updateSignersByToken(
  token: string,
  signers: IZapSigner[],
): Promise<IZapSignDocument | null> {
  return ZapSignDocumentModel.findOneAndUpdate(
    { token },
    { signers },
    { new: true },
  );
}

