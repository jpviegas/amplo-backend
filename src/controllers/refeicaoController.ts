import { Request, Response } from "express";
import { Refeicao } from "../models/Refeicao";

export const getAllRefeicoes = async (_req: Request, res: Response) => {
  try {
    const refeicoes = await Refeicao.find().sort({ createdAt: -1 }).lean();

    if (!refeicoes || refeicoes.length === 0) {
      return res.status(200).json({
        success: true,
        refeicoes: [],
        message: "Nenhuma refeição encontrada",
      });
    }
    res.status(200).json({
      success: true,
      refeicoes,
      message: "Lista de refeições encontradas com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar refeições",
    });
  }
};

export const getRefeicaoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { year } = req.query;

    const filter: any = { user: id };

    if (year) {
      filter.year = Number(year);
    }

    const refeicoes = await Refeicao.find(filter).sort({ year: 1 }).lean();

    if (!refeicoes || refeicoes.length === 0) {
      return res.status(200).json({
        success: true,
        refeicoes: [],
        message: "Nenhum Vale refeição encontrado neste período",
      });
    }
    res.status(200).json({
      success: true,
      refeicoes,
      message: "Lista de Vale Refeição encontradas com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar refeições",
    });
  }
};
