import { ZapSignDocumentModel, IZapSignDocument, IZapSigner } from "../models/ZapSignDocument";
import mongoose from "mongoose";

export async function saveZapSignDocument(doc: {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  document_name: string;
  token: string;
  status: "pending" | "signed";
  signers: IZapSigner[];
  zapsign_created_at?: Date | null;
}): Promise<IZapSignDocument> {
  const created = await ZapSignDocumentModel.create(doc);
  return created;
}

export async function findByToken(token: string): Promise<IZapSignDocument | null> {
  return ZapSignDocumentModel.findOne({ token });
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listDocumentsForSignerEmail(
  email: string,
  options?: { onlyPending?: boolean; onlyToSign?: boolean },
): Promise<IZapSignDocument[]> {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const emailRegex = new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i");

  const onlyPending = options?.onlyPending ?? true;
  const onlyToSign = options?.onlyToSign ?? true;

  const filter: Record<string, any> = {};

  if (onlyPending) {
    filter.status = "pending";
  }

  if (onlyToSign) {
    filter.signers = { $elemMatch: { email: emailRegex, status: { $ne: "signed" } } };
  } else {
    filter["signers.email"] = emailRegex;
  }

  return ZapSignDocumentModel.find(filter).sort({ created_at: -1 });
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

