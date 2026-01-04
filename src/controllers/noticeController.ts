import { Request, Response } from "express";
import { Notice } from "../models/Notice";

export const getAllNotices = async (_req: Request, res: Response) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).lean();

    if (!notices || notices.length === 0) {
      return res.status(200).json({
        success: true,
        notices: [],
        message: "Nenhuma notícia encontrada",
      });
    }
    res.status(200).json({
      success: true,
      notices,
      message: "Lista de notícias encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar notícias",
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
