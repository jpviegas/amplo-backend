import { Request, Response } from "express";
import { Cities } from "../models/Cities";

export const getAllCities = async (_req: Request, res: Response) => {
  try {
    const cities = await Cities.find().sort({ createdAt: -1 }).lean();

    if (!cities || cities.length === 0) {
      return res.status(200).json({
        success: true,
        cities: [],
        message: "Nenhuma cidade encontrada",
      });
    }
    res.status(200).json({
      success: true,
      cities,
      message: "Lista de cidades encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar cidades",
    });
  }
};

export const createCity = async (req: Request, res: Response) => {
  try {
    const { city, meal, transport } = req.body;

    if (!city || !meal || !transport) {
      return res.status(400).json({
        success: false,
        message: "Cidade, vale refeição e vale transporte são obrigatórios",
      });
    }

    const newCity = await Cities.create({
      city,
      meal,
      transport,
    });

    res.status(201).json({
      success: true,
      data: newCity,
      message: "Cidade cadastrada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar cidade",
      error: error.message,
    });
  }
};

export const updateCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { city, meal, transport } = req.body;

    const existingCity = await Cities.findById(id);

    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: "Cidade não encontrada",
      });
    }

    existingCity.city = city || existingCity.city;
    existingCity.meal = meal || existingCity.meal;
    existingCity.transport = transport || existingCity.transport;

    await existingCity.save();

    res.status(200).json({
      success: true,
      data: existingCity,
      message: "Cidade atualizada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar cidade",
      error: error.message,
    });
  }
};
