import { Request, Response } from "express";
import { Point } from "../models/Point";
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

export const getRefeicaoById22 = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { year } = req.query;

    // const refeicao = await Refeicao.findById(id).lean();

    const filter: any = { userId: id };

    if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year), 11, 31, 23, 59, 59);
      filter.timestamp = {
        $gte: start,
        $lte: end,
      };
    }

    // Buscar pontos do usuário para cálculo
    const points = await Point.find(filter).sort({ timestamp: 1 }).lean();
    const diario = 25;

    // Agrupar por mês e calcular dias trabalhados
    const stats = new Map<string, Set<string>>();

    points.forEach((point) => {
      const date = new Date(point.timestamp);
      // Chave do mês: "janeiro de 2024"
      const monthKey = date.toLocaleDateString("pt-BR", {
        month: "long",
        // year: "numeric",
      });
      const dayKey = date.toLocaleDateString("pt-BR"); // Dia único

      if (!stats.has(monthKey)) {
        stats.set(monthKey, new Set());
      }
      stats.get(monthKey)?.add(dayKey);
    });

    const calculo = Array.from(stats.entries()).map(([mes, daysSet]) => {
      const diasTrabalhados = daysSet.size;
      return {
        mes,
        valorDiario: diario,
        diasTrabalhados,
        valorTotal: diasTrabalhados * diario,
      };
    });

    // if (!refeicao) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Refeicao não encontrada",
    //   });
    // }
    res.status(200).json({
      success: true,
      // refeicao,
      calculo,
      message: "Refeicao encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar refeicao",
    });
  }
};

// export const createRefeicao = async (req: Request, res: Response) => {
//   try {
//     const { title, subTitle, image } = req.body;

//     if (!title) {
//       return res.status(400).json({
//         success: false,
//         message: "Título é obrigatório",
//       });
//     }

//     const newRefeicao = await Refeicao.create({
//       title,
//       subTitle,
//       image,
//     });

//     res.status(201).json({
//       success: true,
//       data: newRefeicao,
//       message: "Refeicao criada com sucesso!",
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: "Erro ao criar refeicao",
//       error: error.message,
//     });
//   }
// };
