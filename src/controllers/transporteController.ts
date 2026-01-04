import { Request, Response } from "express";
import { Transporte } from "../models/Transporte";

export const getAllTransportes = async (_req: Request, res: Response) => {
  try {
    const transportes = await Transporte.find().sort({ createdAt: -1 }).lean();

    if (!transportes || transportes.length === 0) {
      return res.status(200).json({
        success: true,
        transportes: [],
        message: "Nenhum transporte encontrado",
      });
    }
    res.status(200).json({
      success: true,
      transportes,
      message: "Lista de transportes encontradas com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar transportes",
    });
  }
};

export const getTransporteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { year } = req.query;

    const filter: any = { user: id };

    if (year) {
      filter.year = Number(year);
    }

    const transportes = await Transporte.find(filter).sort({ year: 1 }).lean();

    if (!transportes || transportes.length === 0) {
      return res.status(200).json({
        success: true,
        transportes: [],
        message: "Nenhum transporte encontrado neste período",
      });
    }
    res.status(200).json({
      success: true,
      transportes,
      message: "Lista de Transportes encontradas com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar transportes",
    });
  }
};
