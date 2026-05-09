import { Request, Response } from "express";
import mongoose from "mongoose";
import { Cities } from "../models/Cities";
import { Refeicao } from "../models/Refeicao";
import { User } from "../models/User";

const getMealValueForUser = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return 0;

  const user = await User.findById(userId).select("city").lean();
  if (!user) return 0;

  const rawCity = (user as any).city;

  if (rawCity && typeof rawCity === "object" && "meal" in rawCity) {
    const meal = Number((rawCity as any).meal);
    return Number.isFinite(meal) ? meal : 0;
  }

  if (typeof rawCity === "string" && rawCity.trim()) {
    const cityValue = rawCity.trim();

    if (mongoose.Types.ObjectId.isValid(cityValue)) {
      const byId = await Cities.findById(cityValue).select("meal").lean();
      const meal = Number((byId as any)?.meal);
      return Number.isFinite(meal) ? meal : 0;
    }

    const byName = await Cities.findOne({ city: cityValue })
      .collation({ locale: "pt", strength: 2 })
      .select("meal")
      .lean();

    const meal = Number((byName as any)?.meal);
    return Number.isFinite(meal) ? meal : 0;
  }

  return 0;
};

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

    const dailyValue = await getMealValueForUser(id);
    const refeicoesWithCityDailyValue = refeicoes.map((r: any) => ({
      ...r,
      dailyValue,
      totalValue:
        typeof r?.daysWorked === "number"
          ? r.daysWorked * dailyValue
          : dailyValue,
    }));

    res.status(200).json({
      success: true,
      refeicoes: refeicoesWithCityDailyValue,
      message: "Lista de Vale Refeição encontradas com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar refeições",
    });
  }
};
