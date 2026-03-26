import { Request, Response } from "express";
import { Hour } from "../models/Hour";

export const getAllHours = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const [hours, total] = await Promise.all([
      Hour.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Hour.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!hours || hours.length === 0) {
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
        hours: [],
        message: "Nenhuma horário encontrada",
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
      count: hours.length,
      hours,
      message: "Lista de horários encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar notícias",
    });
  }
};

export const createHour = async (req: Request, res: Response) => {
  try {
    const { initialHour, finalHour } = req.body;
    console.log(initialHour, finalHour);

    if (!initialHour || !finalHour) {
      return res.status(400).json({
        success: false,
        message: "Conteúdo da hora é obrigatório",
      });
    }

    const existingHour = await Hour.findOne({
      initialHour,
      finalHour,
    }).lean();
    console.log(existingHour);

    if (existingHour) {
      return res.status(409).json({
        success: false,
        message: "Horário já cadastrado com este período",
      });
    }

    const newHour = await Hour.create({
      initialHour,
      finalHour,
    });

    res.status(201).json({
      success: true,
      data: newHour,
      message: "Horário criada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar horário",
      error: error.message,
    });
  }
};

export const updateHour = async (req: Request, res: Response) => {
  try {
    const { hour } = req.body;

    if (!hour) {
      return res.status(400).json({
        success: false,
        message: "Conteúdo da hora é obrigatório",
      });
    }

    const newHour = await Hour.findByIdAndUpdate(
      req.params.id,
      {
        hour,
      },
      { new: true },
    );

    res.status(201).json({
      success: true,
      data: newHour,
      message: "Hora atualizada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar hora",
      error: error.message,
    });
  }
};
