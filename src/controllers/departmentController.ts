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
      filter.departmentName = { $regex: search, $options: "i" };
    }

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .sort({ departmentName: 1 })
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
  const values = req.body as Partial<IDepartment> & { department?: unknown };

  try {
    const rawName =
      typeof (values as any)?.departmentName === "string"
        ? String((values as any).departmentName)
        : typeof (values as any)?.department === "string"
          ? String((values as any).department)
          : "";
    const departmentName = rawName.trim();

    if (!values || !departmentName) {
      return res.status(400).json({
        success: false,
        message: "O nome é obrigatório",
      });
    }

    const escapeRegex = (input: string) =>
      input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const existingDepartment = await Department.findOne({
      departmentName: {
        $regex: `^${escapeRegex(departmentName)}$`,
        $options: "i",
      },
    }).lean();

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Departamento já cadastrado com este nome",
      });
    }

    await Department.create({ ...values, departmentName });
    res.status(201).json({
      success: true,
      message: `O departamento ${departmentName} foi criado com sucesso.`,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Departamento já cadastrado com este nome",
      });
    }

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
        message: "Departamento não encontrado",
      });
    }

    const rawName =
      typeof (req.body as any)?.departmentName === "string"
        ? String((req.body as any).departmentName)
        : typeof (req.body as any)?.department === "string"
          ? String((req.body as any).department)
          : "";
    const departmentName = rawName.trim();

    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: "O nome é obrigatório",
      });
    }

    const escapeRegex = (input: string) =>
      input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const existingDepartmentName = await Department.findOne({
      _id: { $ne: id },
      departmentName: {
        $regex: `^${escapeRegex(departmentName)}$`,
        $options: "i",
      },
    }).lean();

    if (existingDepartmentName) {
      return res.status(409).json({
        success: false,
        message: "Departamento já cadastrado com este nome",
      });
    }

    await Department.findByIdAndUpdate(id, { ...values, departmentName });
    res.status(200).json({
      success: true,
      message: `O departamento ${departmentName} foi atualizado com sucesso.`,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Departamento já cadastrado com este nome",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização do departamento",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar o departamento.",
      error: error.message,
    });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingDepartment = await Department.findById(id).lean();

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Departamento não encontrado",
      });
    }

    await Department.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: `O departamento ${existingDepartment.departmentName} foi excluído com sucesso.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao excluir o departamento.",
      error: error.message,
    });
  }
};
