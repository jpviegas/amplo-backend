import { Request, Response } from "express";
import { Training } from "../models/Training";

export const getAllTrainings = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const [trainings, total] = await Promise.all([
      Training.find(filter)
        .collation({ locale: "pt", strength: 2 })
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Training.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!trainings || trainings.length === 0) {
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
        trainings: [],
        message: "Nenhum treinamento encontrado",
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
      count: trainings.length,
      trainings,
      message: "Lista de treinamentos encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar treinamentos",
    });
  }
};

export const getTrainingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const training = await Training.findById(id).lean();

    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Treinamento não encontrado",
      });
    }
    res.status(200).json({
      success: true,
      training,
      message: "Treinamento encontrado com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar treinamento",
    });
  }
};

export const createTraining = async (req: Request, res: Response) => {
  try {
    const { title, subTitle, image } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Título é obrigatório",
      });
    }

    const newTraining = await Training.create({
      title,
      subTitle,
      image,
    });

    res.status(201).json({
      success: true,
      data: newTraining,
      message: "Treinamento criado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar treinamento",
      error: error.message,
    });
  }
};

export const updateTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, subTitle, image } = req.body as Partial<{
      title: unknown;
      subTitle: unknown;
      image: unknown;
    }>;

    const existingTraining = await Training.findById(id);
    if (!existingTraining) {
      return res.status(404).json({
        success: false,
        message: "Treinamento não encontrado",
      });
    }

    if (typeof title === "string") {
      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        return res.status(400).json({
          success: false,
          message: "Título é obrigatório",
        });
      }
      existingTraining.title = normalizedTitle;
    }

    if (typeof subTitle === "string") {
      const normalizedSubTitle = subTitle.trim();
      if (!normalizedSubTitle) {
        return res.status(400).json({
          success: false,
          message: "Subtítulo é obrigatório",
        });
      }
      existingTraining.subTitle = normalizedSubTitle;
    }

    if (typeof image === "string") {
      existingTraining.image = image.trim();
    }

    await existingTraining.save();

    return res.status(200).json({
      success: true,
      data: existingTraining,
      message: "Treinamento atualizado com sucesso!",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização do treinamento",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar treinamento",
      error: error.message,
    });
  }
};

export const deleteTraining = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingTraining = await Training.findById(id).lean();

    if (!existingTraining) {
      return res.status(404).json({
        success: false,
        message: "Treinamento não encontrado",
      });
    }

    await Training.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `O treinamento ${existingTraining.title} foi excluído com sucesso.`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao excluir o treinamento.",
      error: error.message,
    });
  }
};
