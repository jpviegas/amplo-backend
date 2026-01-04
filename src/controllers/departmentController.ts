import { Request, Response } from "express";
import { Department, IDepartment } from "../models/Department";

export const getAllDepartments = async (req: Request, res: Response) => {
  const { search } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};

    if (search) {
      filter.department = { $regex: search, $options: "i" };
    }

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(filter),
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
      count: departments.length,
      departments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching departments",
      error: error.message,
    });
  }
};

export const getDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const department = await Department.findOne({ _id: id }).lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada",
      });
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching department",
      error: error.message,
    });
  }
};

export const registerDepartment = async (req: Request, res: Response) => {
  const values = req.body;
  try {
    const existingDepartment = await Department.findOne({
      departmentName: values.departmentName,
    }).lean();

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Departamento já cadastrado com este nome",
      });
    }

    const createNewDepartment = new Department(values);
    await createNewDepartment.save();
    res.status(201).json({
      success: true,
      message: `O departamento ${values.departmentName} foi criado com sucesso.`,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para cadastro do departamento",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar o departamento",
      error: error.message,
    });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const values: IDepartment = req.body;

  try {
    const existingDepartment = await Department.findById(id).lean();

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Funcionário não encontrado",
      });
    }

    await Department.findByIdAndUpdate(id, values);
    res.status(200).json({
      success: true,
      message: `O departamento ${
        values.departmentName || existingDepartment.departmentName
      } foi atualizado com sucesso.`,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização do departamento",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar o funcionário.",
      error: error.message,
    });
  }
};
