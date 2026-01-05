import { Request, Response } from "express";
import { Service } from "../models/Service";

export const getAllServices = async (_req: Request, res: Response) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean();

    if (!services || services.length === 0) {
      return res.status(200).json({
        success: true,
        services: [],
        message: "Nenhum atendimento encontrado",
      });
    }
    res.status(200).json({
      success: true,
      services,
      message: "Lista de atendimentos encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar atendimentos",
    });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Atendimento não encontrado",
      });
    }
    res.status(200).json({
      success: true,
      service,
      message: "Atendimento encontrado com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar atendimento",
    });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { type, subject, text, id } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Tipo é obrigatório",
      });
    }
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Assunto é obrigatório",
      });
    }
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Texto é obrigatório",
      });
    }

    const newService = await Service.create({
      user: id,
      type,
      subject,
      text,
    });

    res.status(201).json({
      success: true,
      data: newService,
      message: "Atendimento criado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar atendimento",
      error: error.message,
    });
  }
};
