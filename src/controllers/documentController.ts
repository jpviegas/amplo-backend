import { Request, Response } from "express";
import { DocumentModel } from "../models/Document";
import { User } from "../models/User";

export const getAllDocuments = async (req: Request, res: Response) => {
  try {
    const { userId, type, search } = req.query;
    const filter: any = {};

    if (userId) {
      filter.userId = userId;
    }

    if (type) {
      filter.type = type;
    }

    const rawSearch =
      search !== undefined && search !== null ? String(search).trim() : "";
    if (!rawSearch) {
      const documents = await DocumentModel.find(filter)
        .select("-data")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();
      const documentsWithUserName = documents.map((doc: any) => ({
        ...doc,
        userName:
          doc.userId && typeof doc.userId === "object" ? doc.userId.name : null,
      }));
      return res.status(200).json({
        success: true,
        message: "Documentos encontrados com sucesso.",
        documents: documentsWithUserName,
      });
    }

    {
      const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");

      const users = await User.find({ email: searchRegex })
        .select("_id")
        .lean();
      const userIds = users.map((u: any) => u._id);

      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { filename: { $regex: escaped, $options: "i" } },
        ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
      ];
    }

    const documents = await DocumentModel.find(filter)
      .select("-data")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const documentsWithUserName = documents.map((doc: any) => ({
      ...doc,
      userName:
        doc.userId && typeof doc.userId === "object" ? doc.userId.name : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Documentos encontrados com sucesso.",
      documents: documentsWithUserName,
    });
  } catch (error: any) {
    console.error("Erro ao buscar documentos:", error);
    return res
      .status(500)
      .json({ success: false, message: "Erro interno ao buscar documentos." });
  }
};

export class DocumentController {
  async upload(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const file = req.file;

      // The type comes from the route middleware or body, but for this specific request
      // where we have specific routes like /contrato, we can extract it from the path
      // or pass it via a middleware.
      // However, to keep it simple and robust, we'll expect it in the body OR infer it.
      // Let's assume the router sets `req.body.type` or we read it from the URL.
      // For this implementation, I will assume the route middleware sets it
      // or I'll extract it here if I map the routes specifically.

      // Let's rely on the body first, as it's standard for forms.
      // But since the user asked for specific routes, I'll handle the type assignment in the route definition.
      const type = req.body.type;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      if (!userId) {
        return res
          .status(400)
          .json({ message: "ID do usuário é obrigatório." });
      }

      if (!type) {
        return res
          .status(400)
          .json({ message: "Tipo de documento não especificado." });
      }

      // 1. Verify User
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      // 2. Create Document Record
      const document = await DocumentModel.create({
        userId,
        type,
        filename: file.originalname,
        data: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
        title: file.originalname, // Default title to filename
      });

      return res.status(201).json({
        message: "Upload realizado com sucesso!",
        document: {
          _id: document._id,
          title: document.title,
          filename: document.filename,
          type: document.type,
          size: document.size,
          createdAt: document.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Erro no upload:", error);
      return res.status(500).json({
        message: "Erro interno ao processar upload.",
        error: error.message,
      });
    }
  }

  // async getAll(req: Request, res: Response) {
  //   try {
  //     const { userId, type } = req.query;
  //     const filter: any = {};

  //     if (userId) {
  //       filter.userId = userId;
  //     }

  //     if (type) {
  //       filter.type = type;
  //     }

  //     const documents = await DocumentModel.find(filter)
  //       .populate("userId", "name email")
  //       .sort({ createdAt: -1 });

  //     return res.json(documents);
  //   } catch (error: any) {
  //     console.error("Erro ao buscar documentos:", error);
  //     return res
  //       .status(500)
  //       .json({ message: "Erro interno ao buscar documentos." });
  //   }
  // }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const document = await DocumentModel.findById(id)
        // .select("-data")
        .populate("userId", "name email");

      if (!document) {
        return res
          .status(404)
          .json({ success: false, message: "Documento não encontrado." });
      }

      return res.status(200).json({
        success: true,
        message: "Documento encontrado com sucesso.",
        document,
      });
    } catch (error: any) {
      console.error("Erro ao buscar documento:", error);
      return res
        .status(500)
        .json({ success: false, message: "Erro interno ao buscar documento." });
    }
  }

  async download(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const document = await DocumentModel.findById(id);

      if (!document) {
        return res
          .status(404)
          .json({ success: false, message: "Documento não encontrado." });
      }

      res.setHeader("Content-Type", document.mimetype);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.filename}"`,
      );
      res.send(document.data);
    } catch (error: any) {
      console.error("Erro ao baixar documento:", error);
      return res
        .status(500)
        .json({ success: false, message: "Erro interno ao baixar documento." });
    }
  }

  async view(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const document = await DocumentModel.findById(id);

      if (!document) {
        return res
          .status(404)
          .json({ success: false, message: "Documento não encontrado." });
      }

      res.setHeader("Content-Type", document.mimetype);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${document.filename}"`,
      );
      res.send(document.data);
    } catch (error: any) {
      console.error("Erro ao visualizar documento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno ao visualizar documento.",
      });
    }
  }

  async getByFilename(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const document = await DocumentModel.findOne({ filename });

      if (!document) {
        return res
          .status(404)
          .json({ success: false, message: "Documento não encontrado." });
      }

      res.setHeader("Content-Type", document.mimetype);
      // Inline allows viewing in browser (e.g. PDF), while still allowing save.
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${document.filename}"`,
      );
      res.send(document.data);
    } catch (error: any) {
      console.error("Erro ao buscar documento por nome:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno ao buscar documento.",
      });
    }
  }
}

export const documentController = new DocumentController();
