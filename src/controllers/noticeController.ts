import { Request, Response } from "express";
import { Notice } from "../models/Notice";

export const getAllNotices = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const [notices, total] = await Promise.all([
      Notice.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notice.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!notices || notices.length === 0) {
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
        notices: [],
        message: "Nenhuma notícia encontrada",
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
      count: notices.length,
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

export const getNoticeById = async (req: Request, res: Response) => {
  try {
    const notice = await Notice.findById(req.params.id).lean();

    if (!notice) {
      return res.status(200).json({
        success: true,
        notice: {},
        message: "Nenhuma notícia encontrada",
      });
    }
    res.status(200).json({
      success: true,
      notice,
      message: "Notícia encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar notícia",
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

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const { title, subTitle, notice } = req.body;

    if (!title || !notice) {
      return res.status(400).json({
        success: false,
        message: "Título e conteúdo da notícia são obrigatórios",
      });
    }

    const newNotice = await Notice.findByIdAndUpdate(
      req.params.id,
      {
        title,
        subTitle,
        notice,
      },
      { new: true },
    );

    res.status(201).json({
      success: true,
      data: newNotice,
      message: "Notícia editada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao editar notícia",
      error: error.message,
    });
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const { title, subTitle, notice } = req.body;

    if (!title || !notice) {
      return res.status(400).json({
        success: false,
        message: "Título e conteúdo da notícia são obrigatórios",
      });
    }

    const newNotice = await Notice.findByIdAndDelete(req.params.id, {
      title,
      subTitle,
      notice,
    });

    res.status(201).json({
      success: true,
      data: newNotice,
      message: "Notícia deletada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao deletar notícia",
      error: error.message,
    });
  }
};
