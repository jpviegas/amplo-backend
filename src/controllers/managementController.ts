import { Request, Response } from "express";
import mongoose from "mongoose";
import { EPI } from "../models/EPI";
import { Management } from "../models/Management";
import { Point } from "../models/Point";
import { User } from "../models/User";

export const getAllManagements = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};

    const employeeIdQuery =
      typeof req.query.employeeId === "string"
        ? req.query.employeeId
        : typeof req.query.userId === "string"
          ? req.query.userId
          : undefined;

    if (employeeIdQuery && mongoose.Types.ObjectId.isValid(employeeIdQuery)) {
      filter.employeeId = new mongoose.Types.ObjectId(employeeIdQuery);
    }

    if (
      typeof req.query.epiId === "string" &&
      mongoose.Types.ObjectId.isValid(req.query.epiId)
    ) {
      filter.epiId = new mongoose.Types.ObjectId(req.query.epiId);
    }

    const [managements, total] = await Promise.all([
      Management.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("employeeId", "name email")
        .populate("epiId", "name ca")
        .lean(),
      Management.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!managements || managements.length === 0) {
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
        managements: [],
        message: "Nenhum registro encontrado",
      });
    }
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
      count: managements.length,
      managements,
      message: "Lista encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar registros",
    });
  }
};

export const getManagementById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const management = await Management.findById(id)
      .populate("employeeId", "name email")
      .populate("epiId", "name ca")
      .lean();

    if (!management) {
      return res.status(404).json({
        success: false,
        message: "Registro não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      management,
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
      message: "Erro ao buscar registro",
      error: error.message,
    });
  }
};

export const createManagement = async (req: Request, res: Response) => {
  try {
    const values = req.body as unknown as Record<string, any>;
    console.log(values);

    if (
      typeof values.employeeId !== "string" ||
      !mongoose.Types.ObjectId.isValid(values.employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "employeeId inválido",
      });
    }

    if (
      typeof values.epiId !== "string" ||
      !mongoose.Types.ObjectId.isValid(values.epiId)
    ) {
      return res.status(400).json({
        success: false,
        message: "epiId inválido",
      });
    }

    const quantityNumber =
      typeof values.quantity === "number"
        ? values.quantity
        : Number(values.quantity);
    const normalizedQuantity =
      values.quantity === undefined || Number.isNaN(quantityNumber)
        ? 1
        : quantityNumber;

    if (normalizedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity deve ser maior que zero",
      });
    }

    const [userExists, epiExists] = await Promise.all([
      User.exists({ _id: values.employeeId }),
      EPI.exists({ _id: values.epiId }),
    ]);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Funcionário não encontrado",
      });
    }

    if (!epiExists) {
      return res.status(404).json({
        success: false,
        message: "EPI não encontrado",
      });
    }

    const newManagement = await Management.create({
      employeeId: values.employeeId,
      epiId: values.epiId,
      quantity: normalizedQuantity,
      ...(typeof values.size === "string" ? { size: values.size.trim() } : {}),
      ...(typeof values.comment === "string"
        ? { comment: values.comment.trim() }
        : {}),
    });

    return res.status(201).json({
      success: true,
      data: newManagement,
      message: "Registro criado com sucesso!",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para cadastro",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao criar registro",
      error: error.message,
    });
  }
};

export const updateManagement = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const values = req.body as Partial<{
      employeeId: unknown;
      userId: unknown;
      epiId: unknown;
      quantity: unknown;
      size: unknown;
      comment: unknown;
    }>;

    const existingManagement = await Management.findById(id).lean();
    if (!existingManagement) {
      return res.status(404).json({
        success: false,
        message: "Registro não encontrado",
      });
    }

    const nextEmployeeId =
      typeof values.employeeId === "string"
        ? values.employeeId
        : typeof values.userId === "string"
          ? values.userId
          : undefined;
    const nextEpiId =
      typeof values.epiId === "string" ? values.epiId : undefined;

    if (nextEmployeeId && !mongoose.Types.ObjectId.isValid(nextEmployeeId)) {
      return res.status(400).json({
        success: false,
        message: "employeeId inválido",
      });
    }

    if (nextEpiId && !mongoose.Types.ObjectId.isValid(nextEpiId)) {
      return res.status(400).json({
        success: false,
        message: "epiId inválido",
      });
    }

    const quantityNumber =
      typeof values.quantity === "number"
        ? values.quantity
        : Number(values.quantity);

    if (
      values.quantity !== undefined &&
      (Number.isNaN(quantityNumber) || quantityNumber <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "quantity deve ser maior que zero",
      });
    }

    if (nextEmployeeId) {
      const userExists = await User.exists({ _id: nextEmployeeId });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Funcionário não encontrado",
        });
      }
    }

    if (nextEpiId) {
      const epiExists = await EPI.exists({ _id: nextEpiId });
      if (!epiExists) {
        return res.status(404).json({
          success: false,
          message: "EPI não encontrado",
        });
      }
    }

    const updatedManagement = await Management.findByIdAndUpdate(
      id,
      {
        ...(nextEmployeeId ? { employeeId: nextEmployeeId } : {}),
        ...(nextEpiId ? { epiId: nextEpiId } : {}),
        ...(values.quantity !== undefined ? { quantity: quantityNumber } : {}),
        ...(typeof values.size === "string"
          ? { size: values.size.trim() }
          : {}),
        ...(typeof values.comment === "string"
          ? { comment: values.comment.trim() }
          : {}),
      },
      { new: true, runValidators: true },
    )
      .populate("employeeId", "name email")
      .populate("epiId", "name ca")
      .lean();

    return res.status(200).json({
      success: true,
      data: updatedManagement,
      message: "Registro atualizado com sucesso!",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização",
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
      message: "Erro ao atualizar registro",
      error: error.message,
    });
  }
};

export const deleteManagement = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingManagement = await Management.findById(id).lean();

    if (!existingManagement) {
      return res.status(404).json({
        success: false,
        message: "Registro não encontrado",
      });
    }

    await Management.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Registro excluído com sucesso.",
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
      message: "Erro ao excluir o registro.",
      error: error.message,
    });
  }
};

export const getPointsById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const point = await Point.findById(id)
      .populate("userId", "name email")
      .lean();

    if (!point) {
      return res.status(404).json({
        success: false,
        message: "Registro não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      point,
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
      message: "Erro ao buscar registro",
      error: error.message,
    });
  }
};

export const getAllPointsByUserId = async (req: Request, res: Response) => {
  const userId =
    typeof req.params.userId === "string"
      ? req.params.userId
      : typeof req.query.userId === "string"
        ? req.query.userId
        : "";

  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "ID do usuário inválido",
      });
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    const filter: Record<string, any> = { userId };

    const month = req.query.month;
    const year = req.query.year;
    if (month !== undefined && year !== undefined) {
      const monthNumber = Number(month);
      const yearNumber = Number(year);
      if (
        Number.isFinite(monthNumber) &&
        Number.isFinite(yearNumber) &&
        monthNumber >= 1 &&
        monthNumber <= 12
      ) {
        const start = new Date(yearNumber, monthNumber - 1, 1);
        const end = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);
        filter.timestamp = { $gte: start, $lte: end };
      }
    }

    const [points, total] = await Promise.all([
      Point.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email")
        .lean(),
      Point.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!points || points.length === 0) {
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
        points: [],
        message: "Nenhum ponto encontrado",
      });
    }

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
      count: points.length,
      points,
      message: "Lista de pontos encontrada com sucesso",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar pontos",
      error: error.message,
    });
  }
};

export const updatePointById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingPoint = await Point.findById(id).lean();
    if (!existingPoint) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    const rawUserId = (req.body as any)?.userId;
    const rawTimestamp = (req.body as any)?.timestamp;
    const rawLocation = (req.body as any)?.location;

    const update: Record<string, any> = { type: "rh" };

    if (rawUserId !== undefined) {
      if (
        typeof rawUserId !== "string" ||
        !mongoose.Types.ObjectId.isValid(rawUserId)
      ) {
        return res.status(400).json({
          success: false,
          message: "userId inválido",
        });
      }

      const userExists = await User.exists({ _id: rawUserId });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      update.userId = rawUserId;
    }

    if (rawTimestamp !== undefined) {
      const date =
        rawTimestamp instanceof Date
          ? rawTimestamp
          : typeof rawTimestamp === "string" || typeof rawTimestamp === "number"
            ? new Date(rawTimestamp)
            : null;

      if (!date || Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "timestamp inválido",
        });
      }

      update.timestamp = date;
    }

    if (rawLocation !== undefined) {
      const lat = rawLocation?.latitude;
      const lng = rawLocation?.longitude;

      if (typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({
          success: false,
          message: "Localização inválida (latitude e longitude)",
        });
      }

      update.location = { latitude: lat, longitude: lng };
    }

    const updateKeys = Object.keys(update).filter((k) => k !== "type");
    if (updateKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo para atualizar",
      });
    }

    const updatedPoint = await Point.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate("userId", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      data: updatedPoint,
      message: "Ponto atualizado com sucesso!",
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
      message: "Erro ao atualizar ponto",
      error: error.message,
    });
  }
};
