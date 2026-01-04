import { Request, Response } from "express";
import { Holerite } from "../models/Holerite";
import { Notice } from "../models/Notice";

export const getAllHolerites = async (_req: Request, res: Response) => {
  try {
    const holerites = await Holerite.find().sort({ createdAt: -1 }).lean();

    if (!holerites || holerites.length === 0) {
      return res.status(200).json({
        success: true,
        holerites: [],
        message: "Nenhum holerite encontrado",
      });
    }
    res.status(200).json({
      success: true,
      holerites,
      message: "Lista de holerites encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar holerites",
    });
  }
};

export const getHoleriteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const holerite = await Holerite.findById(id).lean();

    if (!holerite) {
      return res.status(404).json({
        success: false,
        message: "Holerite não encontrado",
      });
    }
    res.status(200).json({
      success: true,
      holerite,
      message: "Holerite encontrado com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar holerite",
    });
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, subTitle, notice } = req.body;

    if (!title || !notice) {
      return res.status(400).json({
        success: false,
        message: "Título e conteúdo da notícia são obrigatórios",
      });
    }

    const newNotice = await Notice.create({
      title,
      subTitle,
      notice,
    });

    res.status(201).json({
      success: true,
      data: newNotice,
      message: "Notícia criada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar notícia",
      error: error.message,
    });
  }
};
