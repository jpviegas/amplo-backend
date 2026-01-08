import { Request, Response } from "express";

import jwt from "jsonwebtoken";

import { IUser, User } from "../models/User";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "30d",
  });
};

export const getAllUsers = async (req: Request, res: Response) => {
  const { search } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("companyId", "companyName")
        .populate("departmentId", "departmentName")
        .lean(),
      User.countDocuments(filter),
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
      count: users.length,
      users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

export const getAllusersByCompany = async (req: Request, res: Response) => {
  const { name, company } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const filter = {};

  if (company) {
    (filter as any).company = company as string;
  }

  if (name) {
    (filter as any).name = { $regex: name, $options: "i" };
  }

  try {
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("companyId", "companyName")
        .populate("departmentId", "departmentName")
        .lean(),
      User.countDocuments(filter),
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
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id)
      .populate("companyId", "companyName")
      .populate("departmentId", "departmentName")
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.status(200).json({
      success: true,
      user: user,
      message: "Usuário encontrado com sucesso",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const values: IUser = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ cpf: values.cpf }, { rg: values.rg }, { email: values.email }],
    }).lean();

    if (existingUser) {
      if (existingUser.cpf === values.cpf) {
        return res.status(409).json({
          success: false,
          message: "Funcionário já cadastrado com este CPF",
        });
      }
      if (existingUser.rg === values.rg) {
        return res.status(409).json({
          success: false,
          message: "Funcionário já cadastrado com este RG",
        });
      }
      if (existingUser.email === values.email) {
        return res.status(409).json({
          success: false,
          message: "Funcionário já cadastrado com este Email",
        });
      }
    }

    const user = await User.create(values);
    // const user = new User(values);
    // await user.save();

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id as unknown as string,
        user,
        // name: values.name,
        token: generateToken(user._id as unknown as string),
        message: "Cadastro realizado com sucesso!",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para cadastro do funcionário",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar o funcionário.",
      error: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const values: IUser = req.body;

  try {
    const existingUser = await User.findById(id).lean();

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Funcionário não encontrado",
      });
    }

    const profile = await User.findByIdAndUpdate(id, values, { new: true });
    res.status(200).json({
      success: true,
      message: `O funcionário ${
        values.name || existingUser.name
      } foi atualizado com sucesso.`,
      profile,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para atualização do funcionário",
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

export const authUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email e senha são obrigatórios" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Email ou senha incorreta" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou senha incorreta" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: "Login com sucesso!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "A nova senha deve conter pelo menos 1 letra maiúscula, 1 caractere especial, 1 número e mínimo de 8 caracteres",
    });
  }
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Senha atual incorreta",
      });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao alterar senha",
      error: error.message,
    });
  }
};
