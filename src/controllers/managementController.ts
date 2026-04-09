import { Request, Response } from "express";
import mongoose from "mongoose";
import { EPI } from "../models/EPI";
import { IManagement, Management } from "../models/Management";
import { User } from "../models/User";

export const getAllManagements = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};

    if (
      typeof req.query.userId === "string" &&
      mongoose.Types.ObjectId.isValid(req.query.userId)
    ) {
      filter.userId = new mongoose.Types.ObjectId(req.query.userId);
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
        .populate("userId", "name email")
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
      .populate("userId", "name email")
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
    const values = req.body as IManagement;
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
      userId: unknown;
      epiId: unknown;
      quantity: unknown;
    }>;

    const existingManagement = await Management.findById(id).lean();
    if (!existingManagement) {
      return res.status(404).json({
        success: false,
        message: "Registro não encontrado",
      });
    }

    const nextUserId =
      typeof values.userId === "string" ? values.userId : undefined;
    const nextEpiId =
      typeof values.epiId === "string" ? values.epiId : undefined;

    if (nextUserId && !mongoose.Types.ObjectId.isValid(nextUserId)) {
      return res.status(400).json({
        success: false,
        message: "userId inválido",
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

    if (nextUserId) {
      const userExists = await User.exists({ _id: nextUserId });
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
        ...(nextUserId ? { userId: nextUserId } : {}),
        ...(nextEpiId ? { epiId: nextEpiId } : {}),
        ...(values.quantity !== undefined ? { quantity: quantityNumber } : {}),
      },
      { new: true, runValidators: true },
    )
      .populate("userId", "name email")
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
