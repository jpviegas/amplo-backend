import { Request, Response } from "express";
import mongoose from "mongoose";
import { Service } from "../models/Service";
import { User } from "../models/User";

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      Service.find()
        .collation({ locale: "pt", strength: 2 })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!services || services.length === 0) {
      return res.status(200).json({
        success: true,
        pagination: {
          total,
          page,
          totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
        count: 0,
        services: [],
        message: "Nenhum atendimento encontrado",
      });
    }

    const userIds = Array.from(
      new Set(
        services
          .map((s: any) => s.user)
          .filter(Boolean)
          .map((id: any) => String(id)),
      ),
    );

    const userObjectIds = userIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const users = await User.find({ _id: { $in: userObjectIds } })
      .select("name")
      .lean();

    const userNameById = new Map<string, string>();
    for (const u of users) {
      userNameById.set(String((u as any)._id), (u as any).name);
    }

    const servicesWithNames = services.map((s: any) => ({
      ...s,
      name: s.user ? (userNameById.get(String(s.user)) ?? null) : null,
    }));

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      count: servicesWithNames.length,
      services: servicesWithNames,
      message: "Lista de atendimentos encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar atendimentos",
    });
  }
};

export const getServicesByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const services = await Service.find({ user: id as Object })
      .sort({ createdAt: -1 })
      .lean();

    if (!services || services.length === 0) {
      return res.status(200).json({
        success: true,
        services: [],
        message: "Nenhum atendimento encontrado",
      });
    }
    res.status(200).json({
      success: true,
      services,
      message: "Lista de atendimentos encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar atendimentos",
    });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Atendimento não encontrado",
      });
    }
    res.status(200).json({
      success: true,
      service,
      message: "Atendimento encontrado com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar atendimento",
    });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const values = req.body as Partial<{
      type: unknown;
      subject: unknown;
      text: unknown;
      status: unknown;
      user: unknown;
      userId: unknown;
    }> & { id?: unknown };

    const existingService = await Service.findById(id).lean();
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Atendimento não encontrado",
      });
    }

    const update: Record<string, any> = {};

    if (typeof values.type === "string" && values.type.trim()) {
      const normalizedType = values.type.trim();
      if (!["RH", "OP", "OR"].includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: "Tipo inválido. Use 'RH', 'OP' ou 'OR'.",
        });
      }
      update.type = normalizedType;
    }

    if (typeof values.subject === "string") {
      const subject = values.subject.trim();
      if (!subject) {
        return res.status(400).json({
          success: false,
          message: "Assunto é obrigatório",
        });
      }
      update.subject = subject;
    }

    if (typeof values.text === "string") {
      const text = values.text.trim();
      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Texto é obrigatório",
        });
      }
      update.text = text;
    }

    if (typeof values.status === "string" && values.status.trim()) {
      const normalizedStatus = values.status.trim();
      if (!["Pendente", "Aprovado", "Rejeitado"].includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message:
            "Status inválido. Use 'Pendente', 'Aprovado' ou 'Rejeitado'.",
        });
      }
      update.status = normalizedStatus;
    }

    const rawUserId =
      typeof values.userId === "string"
        ? values.userId
        : typeof values.user === "string"
          ? values.user
          : typeof (values as any).id === "string"
            ? String((values as any).id)
            : "";
    if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      update.user = new mongoose.Types.ObjectId(rawUserId);
    } else if (rawUserId) {
      return res.status(400).json({
        success: false,
        message: "userId inválido",
      });
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo válido para atualizar",
      });
    }

    const updated = await Service.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Atendimento atualizado com sucesso!",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização do atendimento",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar atendimento",
      error: error.message,
    });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { type, subject, text, id } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Tipo é obrigatório",
      });
    }
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Assunto é obrigatório",
      });
    }
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Texto é obrigatório",
      });
    }

    const newService = await Service.create({
      user: id,
      type,
      subject,
      text,
    });

    res.status(201).json({
      success: true,
      data: newService,
      message: "Atendimento criado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar atendimento",
      error: error.message,
    });
  }
};
