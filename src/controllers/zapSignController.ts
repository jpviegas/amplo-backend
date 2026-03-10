import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { createDocument } from "../services/zapSignService";
import { saveZapSignDocument, findByToken, updateStatusByToken, updateSignersByToken } from "../repositories/zapSignRepository";

const fixedSignerEmail = "josiassxz@gmail.com";

const createDocSchema = z.object({
  userId: z.string().min(1, "userId é obrigatório"),
  signers: z.array(z.string().email("Email inválido")).min(1, "Ao menos 1 email"),
});

export async function postDocuments(req: Request, res: Response) {
  try {
    console.log("POST /documents init", {
      headers: {
        "content-type": req.headers["content-type"],
      },
    });
    const parsed = createDocSchema.safeParse({
      userId: req.body.userId,
      signers: Array.isArray(req.body.signers)
        ? req.body.signers
        : typeof req.body.signers === "string"
        ? req.body.signers.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Inputs inválidos",
        issues: parsed.error.issues,
      });
    }

    const { userId, signers } = parsed.data;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Arquivo (file) é obrigatório",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    const userEmail = user.email;

    const uniqueEmails = new Set<string>([
      fixedSignerEmail.toLowerCase(),
      userEmail.toLowerCase(),
      ...signers.map((e) => e.toLowerCase()),
    ]);

    const finalEmails = Array.from(uniqueEmails);
    if (!finalEmails.includes(fixedSignerEmail.toLowerCase())) {
      finalEmails.push(fixedSignerEmail.toLowerCase());
    }
    if (!finalEmails.includes(userEmail.toLowerCase())) {
      finalEmails.push(userEmail.toLowerCase());
    }

    console.log("POST /documents payload", {
      userId,
      userEmail,
      file: {
        name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      finalEmails,
    });

    const base64Pdf = file.buffer.toString("base64");

    const payload = {
      name: file.originalname,
      base64_pdf: base64Pdf,
      signers: finalEmails.map((email) => ({
        name: email,
        email,
      })),
    };

    let zapsignResp;
    try {
      zapsignResp = await createDocument(payload);
    } catch (e: any) {
      if (e?.isZapSign) {
        console.error("POST /documents ZapSign failed", {
          status: e.status,
          data: e.data,
          message: e.message,
        });
        return res.status(e.status || 502).json({
          success: false,
          message: "Falha ao criar documento na ZapSign",
          zapsign: {
            status: e.status,
            data: e.data,
          },
        });
      }
      console.error("POST /documents unexpected error", e);
      return res.status(500).json({
        success: false,
        message: "Erro interno ao enviar documento para ZapSign",
      });
    }

    const saved = await saveZapSignDocument({
      userId: user._id,
      userEmail,
      document_name: zapsignResp.name,
      token: zapsignResp.token,
      status: zapsignResp.status,
      signers: (zapsignResp.signers || []).map((s) => ({
        token: s.token,
        status: s.status,
        name: s.name,
        email: s.email,
        phone_country: s.phone_country,
        phone_number: s.phone_number,
        signed_at: s.signed_at ? new Date(s.signed_at) : null,
      })),
    });

    return res.status(201).json({
      success: true,
      message: "Documento enviado para assinatura na ZapSign",
      data: {
        id: saved._id,
        user_id: saved.userId,
        document_name: saved.document_name,
        token: saved.token,
        status: saved.status,
        signers: saved.signers,
        created_at: saved.created_at,
      },
    });
  } catch (err: any) {
    console.error("POST /documents fatal error", err);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao enviar documento para ZapSign",
      error: err?.message || "unknown",
    });
  }
}

// Webhook payload types are varied; we handle the common fields: token, status, signers[]
export async function zapSignWebhook(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const token: string | undefined = body.token || body.doc_token;
    const status: string | undefined = body.status;
    const signers: Array<any> = Array.isArray(body.signers) ? body.signers : [];

    if (!token) {
      return res.status(400).json({ success: false, message: "Token do documento ausente" });
    }

    const existing = await findByToken(token);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Documento não encontrado pelo token" });
    }

    console.log("POST /webhooks/zapsign received", {
      token,
      status,
      signersCount: signers.length,
    });

    const normalizedSigners = signers.map((s) => ({
      token: s.token,
      status: s.status,
      name: s.name,
      email: s.email,
      phone_country: s.phone_country,
      phone_number: s.phone_number,
      signed_at: s.signed_at ? new Date(s.signed_at) : null,
    }));

    if (normalizedSigners.length > 0) {
      await updateSignersByToken(token, normalizedSigners);
    }

    const userSigned = normalizedSigners.some(
      (s) => (s.email || "").toLowerCase() === (existing.userEmail || "").toLowerCase() && s.status === "signed",
    );

    if (userSigned || status === "signed") {
      await updateStatusByToken(token, "signed");
    }

    console.log("POST /webhooks/zapsign processed", {
      token,
      updatedStatus: userSigned || status === "signed" ? "signed" : existing.status,
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("POST /webhooks/zapsign error", err?.response?.data || err);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao processar webhook",
      error: err?.message || "unknown",
    });
  }
}
