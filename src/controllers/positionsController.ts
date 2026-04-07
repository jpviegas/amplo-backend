import { Request, Response } from "express";
import { IPosition, Position } from "../models/Position";

export const getAllPositions = async (req: Request, res: Response) => {
  const { search } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};

    if (search) {
      filter.positionName = { $regex: search, $options: "i" };
    }

    const [positions, total] = await Promise.all([
      Position.find(filter)
        .collation({ locale: "pt", strength: 2 })
        .sort({ positionName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Position.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

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
      count: positions.length,
      positions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching positions",
      error: error.message,
    });
  }
};

export const getPosition = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const position = await Position.findOne({ _id: id }).lean();

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Cargo não encontrado",
      });
    }

    res.status(200).json({
      success: true,
      position,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching position",
      error: error.message,
    });
  }
};

export const registerPosition = async (req: Request, res: Response) => {
  const values = req.body as Partial<IPosition> & { position?: unknown };

  const rawName =
    typeof (values as any)?.positionName === "string"
      ? String((values as any).positionName)
      : typeof (values as any)?.position === "string"
        ? String((values as any).position)
        : "";
  const positionName = rawName.trim();

  if (!positionName) {
    return res.status(400).json({
      success: false,
      message: "Nome do cargo é obrigatório",
    });
  }

  const escapeRegex = (input: string) =>
    input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const existingPosition = await Position.findOne({
    positionName: {
      $regex: `^${escapeRegex(positionName)}$`,
      $options: "i",
    },
  }).lean();

  if (existingPosition) {
    return res.status(409).json({
      success: false,
      message: "Cargo já cadastrado com este nome",
    });
  }

  await Position.create({ ...values, positionName });
  res.status(201).json({
    success: true,
    message: `O cargo ${positionName} foi criado com sucesso.`,
  });
};

export const updatePosition = async (req: Request, res: Response) => {
  const { id } = req.params;
  const values = req.body;

  try {
    const existingPosition = await Position.findById(id).lean();

    if (!existingPosition) {
      return res.status(404).json({
        success: false,
        message: "Cargo não encontrado",
      });
    }

    // const rawName = values?.positionName;
    // if (!rawName || typeof rawName !== "string") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "O nome é obrigatório",
    //   });
    // }

    // const positionName = rawName.trim();
    // const escapeRegex = (input: string) =>
    //   input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const rawName =
      typeof (values as any)?.positionName === "string"
        ? (values as any).positionName
        : typeof (values as any)?.position === "string"
          ? (values as any).position
          : "";
    const positionName = String(rawName).trim();

    if (!positionName) {
      return res.status(400).json({
        success: false,
        message: "Nome do cargo é obrigatório",
      });
    }

    const escapeRegex = (input: string) =>
      input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const existingPositionName = await Position.findOne({
      _id: { $ne: id },
      positionName: {
        $regex: `^${escapeRegex(positionName)}$`,
        $options: "i",
      },
    }).lean();

    if (existingPositionName) {
      return res.status(409).json({
        success: false,
        message: "Cargo já cadastrado com este nome",
      });
    }

    await Position.findByIdAndUpdate(id, { ...values, positionName });
    res.status(200).json({
      success: true,
      message: `O cargo ${positionName} foi atualizado com sucesso.`,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização do cargo",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar o cargo.",
      error: error.message,
    });
  }
};

export const deletePosition = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingPosition = await Position.findById(id).lean();

    if (!existingPosition) {
      return res.status(404).json({
        success: false,
        message: "Cargo não encontrado",
      });
    }

    await Position.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: `O cargo ${existingPosition.positionName} foi excluído com sucesso.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao excluir o cargo.",
      error: error.message,
    });
  }
};
