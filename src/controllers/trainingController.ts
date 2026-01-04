import { Request, Response } from "express";
import { Training } from "../models/Training";

export const getAllTrainings = async (_req: Request, res: Response) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 }).lean();

    if (!trainings || trainings.length === 0) {
      return res.status(200).json({
        success: true,
        trainings: [],
        message: "Nenhum treinamento encontrado",
      });
    }
    res.status(200).json({
      success: true,
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
