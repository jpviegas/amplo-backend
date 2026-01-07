import { Request, Response } from "express";
import { Abono } from "../models/Abono";

export const getAllAbonos = async (_req: Request, res: Response) => {
  try {
    const abonos = await Abono.find().sort({ createdAt: -1 }).lean();

    if (!abonos || abonos.length === 0) {
      return res.status(200).json({
        success: true,
        abonos: [],
        message: "Nenhum atendimento encontrado",
      });
    }
    res.status(200).json({
      success: true,
      abonos,
      message: "Lista de atendimentos encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar atendimentos",
    });
  }
};

export const getAbonoByUserId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const filter: any = { user: id };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    const abonos = await Abono.find(filter).lean();

    if (!abonos || abonos.length === 0) {
      return res.status(200).json({
        success: true,
        abonos: [],
        message: "Nenhum abono encontrado para este usuário ou período",
      });
    }
    res.status(200).json({
      success: true,
      abonos,
      message: "Abonos encontrados com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar abonos",
    });
  }
};

export const getAbonoById = async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;

    const abono = await Abono.findById(id).lean();

    if (!abono || !abono.user || abono.user.toString() !== userId) {
      return res.status(200).json({
        success: true,
        abono: {},
        message: "Nenhum abono encontrado para este usuário",
      });
    }
    res.status(200).json({
      success: true,
      abono,
      message: "Abono encontrado com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar abonos",
    });
  }
};

export const createAbono = async (req: Request, res: Response) => {
  try {
    const {
      reason,
      initialDate,
      finalDate,
      fullJourney,
      note,
      attachment,
      user,
    } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Motivo é obrigatório",
      });
    }
    // if (!initialDate) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Data inicial é obrigatória",
    //   });
    // }
    // if (!finalDate) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Data final é obrigatória",
    //   });
    // }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Usuário é obrigatório",
      });
    }

    const newAbono = await Abono.create({
      user,
      reason,
      initialDate,
      finalDate,
      fullJourney,
      note,
      attachment,
    });

    res.status(201).json({
      success: true,
      data: newAbono,
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
