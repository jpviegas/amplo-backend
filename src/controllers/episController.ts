import { Request, Response } from "express";
import { EPI } from "../models/EPI";

const escapeRegex = (input: string) =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllEPIs = async (req: Request, res: Response) => {
  const { search } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};
    if (typeof search === "string" && search.trim()) {
      const pattern = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { ca: { $regex: pattern, $options: "i" } },
      ];
    }

    const [epis, total] = await Promise.all([
      EPI.find(filter)
        .collation({ locale: "pt", strength: 2 })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EPI.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!epis || epis.length === 0) {
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
        epis: [],
        message: "Nenhum EPI encontrado",
      });
    }
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
      count: epis.length,
      epis,
      message: "Lista de EPIs encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar EPIs",
    });
  }
};

export const getEPIById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const epi = await EPI.findById(id).lean();

    if (!epi) {
      return res.status(404).json({
        success: false,
        message: "EPI não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      epi,
    });
  } catch (error: any) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar EPI",
      error: error.message,
    });
  }
};

export const createEPI = async (req: Request, res: Response) => {
  try {
    const { name, ca } = req.body as Partial<{
      name: unknown;
      ca: unknown;
    }>;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nome do EPI é obrigatório",
      });
    }

    if (typeof ca !== "string" || !ca.trim()) {
      return res.status(400).json({
        success: false,
        message: "C.A. do EPI é obrigatório",
      });
    }

    const normalizedName = name.trim();
    const normalizedCa = ca.trim();

    const existingEpi = await EPI.findOne({
      $or: [
        { name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" } },
        { ca: { $regex: `^${escapeRegex(normalizedCa)}$`, $options: "i" } },
      ],
    }).lean();

    if (existingEpi) {
      return res.status(409).json({
        success: false,
        message: "EPI já cadastrado",
      });
    }

    const newEpi = await EPI.create({
      name: normalizedName,
      ca: normalizedCa,
    });

    return res.status(201).json({
      success: true,
      data: newEpi,
      message: "EPI criado com sucesso!",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para cadastro do EPI",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "EPI já cadastrado",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao criar EPI",
      error: error.message,
    });
  }
};

export const updateEPI = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const values = req.body as Partial<{ name: unknown; ca: unknown }>;

    const existingEpi = await EPI.findById(id).lean();
    if (!existingEpi) {
      return res.status(404).json({
        success: false,
        message: "EPI não encontrado",
      });
    }

    const nextName =
      typeof values.name === "string" ? values.name.trim() : existingEpi.name;
    const nextCa =
      typeof values.ca === "string" ? values.ca.trim() : existingEpi.ca;

    if (!nextName) {
      return res.status(400).json({
        success: false,
        message: "Nome do EPI é obrigatório",
      });
    }

    if (!nextCa) {
      return res.status(400).json({
        success: false,
        message: "C.A. do EPI é obrigatório",
      });
    }

    const duplicated = await EPI.findOne({
      _id: { $ne: id },
      $or: [
        { name: { $regex: `^${escapeRegex(nextName)}$`, $options: "i" } },
        { ca: { $regex: `^${escapeRegex(nextCa)}$`, $options: "i" } },
      ],
    }).lean();

    if (duplicated) {
      return res.status(409).json({
        success: false,
        message: "EPI já cadastrado",
      });
    }

    const updatedEpi = await EPI.findByIdAndUpdate(
      id,
      { name: nextName, ca: nextCa },
      { new: true, runValidators: true },
    ).lean();

    return res.status(200).json({
      success: true,
      data: updatedEpi,
      message: "EPI atualizado com sucesso!",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização do EPI",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar EPI",
      error: error.message,
    });
  }
};

export const deleteEPI = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingEpi = await EPI.findById(id).lean();

    if (!existingEpi) {
      return res.status(404).json({
        success: false,
        message: "EPI não encontrado",
      });
    }

    await EPI.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: `O EPI ${existingEpi.name} foi excluído com sucesso.`,
    });
  } catch (error: any) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao excluir o EPI.",
      error: error.message,
    });
  }
};
