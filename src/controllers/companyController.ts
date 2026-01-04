import { Request, Response } from "express";
import { Company, ICompany } from "../models/Company";

export const getAllCompanies = async (req: Request, res: Response) => {
  const { search } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};

    if (search) {
      filter.companyName = { $regex: search, $options: "i" };
    }

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Company.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

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
      count: companies.length,
      companies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching companies",
      error: error.message,
    });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const company = await Company.findOne({ _id: id }).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada",
      });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching company",
      error: error.message,
    });
  }
};

export const registerCompany = async (req: Request, res: Response) => {
  const values = req.body;
  try {
    const existingCompany = await Company.findOne({
      companyName: values.companyName,
    }).lean();

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "Empresa já cadastrada com este nome",
      });
    }

    const createNewCompany = new Company(values);
    await createNewCompany.save();
    res.status(201).json({
      success: true,
      message: `A empresa ${values.companyName} foi criada com sucesso.`,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para cadastro da empresa",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar a empresa",
      error: error.message,
    });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  const { id } = req.params;
  const values: ICompany = req.body;

  try {
    const existingCompany = await Company.findById(id).lean();

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada",
      });
    }

    await Company.findByIdAndUpdate(id, values);
    res.status(200).json({
      success: true,
      message: `A empresa ${
        values.companyName || existingCompany.companyName
      } foi atualizada com sucesso.`,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização da empresa",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar a empresa.",
      error: error.message,
    });
  }
};
