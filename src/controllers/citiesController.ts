import { Request, Response } from "express";
import { Cities } from "../models/Cities";

export const getAllCities = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (search) {
      filter.city = { $regex: search, $options: "i" };
    }

    const [cities, total] = await Promise.all([
      Cities.find(filter).sort({ city: 1 }).skip(skip).limit(limit).lean(),
      Cities.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!cities || cities.length === 0) {
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
        cities: [],
        message: "Nenhuma cidade encontrada",
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
      count: cities.length,
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

export const getCityById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const cities = await Cities.findOne({ _id: id }).lean();

    if (!cities) {
      return res.status(404).json({
        success: false,
        message: "Cidade não encontrada",
      });
    }
    res.status(200).json({
      success: true,
      cities,
      message: "Cidade encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar cidade",
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

export const deleteCity = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingCity = await Cities.findById(id).lean();

    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: "Cidade não encontrada",
      });
    }

    await Cities.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: `A cidade ${existingCity.city} foi excluído com sucesso.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao excluir a cidade.",
      error: error.message,
    });
  }
};
