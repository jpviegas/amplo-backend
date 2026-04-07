import { createHash, randomBytes } from "crypto";
import { Request, Response } from "express";

import jwt from "jsonwebtoken";

import console from "console";
import { IUser, User } from "../models/User";
import { sendTemplateEmail } from "../services/resendService";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "30d",
  });
};

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

type PasswordTokenType = "first-access" | "reset-password";

const getFrontendBaseUrl = () => {
  return (
    process.env.FRONTEND_URL?.trim().replace(/\/+$/g, "") ||
    "http://localhost:3000"
  );
};

const createPasswordToken = () => {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

const generateTemporaryPassword = () => {
  return `Temp@${randomBytes(8).toString("hex")}A1`;
};

const getPasswordTokenExpiresAt = () => {
  const ttlHours = Number(process.env.PASSWORD_TOKEN_TTL_HOURS || "24");
  const ttlMs = Number.isNaN(ttlHours)
    ? 24 * 60 * 60 * 1000
    : ttlHours * 60 * 60 * 1000;
  return new Date(Date.now() + ttlMs);
};

const parsePasswordTokenType = (value: unknown): PasswordTokenType | null => {
  if (value === "first-access" || value === "reset-password") {
    return value;
  }
  return null;
};

const setPasswordTokenData = (
  user: IUser,
  type: PasswordTokenType,
  tokenHash: string,
) => {
  const expiresAt = getPasswordTokenExpiresAt();

  if (type === "first-access") {
    user.firstAccessTokenHash = tokenHash;
    user.firstAccessTokenExpiresAt = expiresAt;
    user.firstAccessTokenUsedAt = undefined;
    return;
  }

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetTokenExpiresAt = expiresAt;
  user.passwordResetTokenUsedAt = undefined;
};

const clearPasswordTokenData = (user: IUser, type: PasswordTokenType) => {
  if (type === "first-access") {
    user.firstAccessTokenHash = undefined;
    user.firstAccessTokenExpiresAt = undefined;
    user.firstAccessTokenUsedAt = new Date();
    return;
  }

  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  user.passwordResetTokenUsedAt = new Date();
};

const findUserByValidToken = async (token: string, type: PasswordTokenType) => {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  if (type === "first-access") {
    return User.findOne({
      firstAccessTokenHash: tokenHash,
      firstAccessTokenExpiresAt: { $gt: now },
      firstAccessTokenUsedAt: { $exists: false },
    });
  }

  return User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: now },
    passwordResetTokenUsedAt: { $exists: false },
  });
};

export const getAllUsers = async (req: Request, res: Response) => {
  const { search, status } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter: Record<string, any> = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (typeof status === "string" && status.trim()) {
      const normalizedStatus = status.trim().toLowerCase();
      if (normalizedStatus !== "active" && normalizedStatus !== "inactive") {
        return res.status(400).json({
          success: false,
          message: "Status inválido. Use 'active' ou 'inactive'.",
        });
      }
      filter.status = normalizedStatus;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .collation({ locale: "pt", strength: 2 })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate("companyId", "companyName")
        .populate("departmentId", "departmentName")
        .populate("city", "city meal transport")
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
        .populate("city", "city meal transport")
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
      .populate("city", "city meal transport")
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
  const values = req.body as Partial<IUser>;
  console.log(values);

  try {
    const normalizedEmail = values.email?.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ cpf: values.cpf }, { rg: values.rg }, { email: normalizedEmail }],
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

    const userPayload = {
      ...values,
      email: normalizedEmail,
      password: values.password || generateTemporaryPassword(),
    };

    const user = await User.create(userPayload);
    const { token, tokenHash } = createPasswordToken();
    setPasswordTokenData(user, "first-access", tokenHash);
    await user.save();

    const firstAccessLink = `${getFrontendBaseUrl()}/cadastro-senha/${token}`;

    await sendTemplateEmail({
      to: user.email,
      subject: "Defina sua senha de acesso",
      title: "Seu cadastro foi criado",
      description:
        "Para acessar sua conta pela primeira vez, defina sua senha no link abaixo.",
      actionUrl: firstAccessLink,
      actionLabel: "Definir senha",
      supportText:
        "Se você não reconhece este cadastro, ignore este e-mail e entre em contato com o suporte.",
    });

    if (user) {
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      res.status(201).json({
        success: true,
        _id: user._id as unknown as string,
        user: userResponse,
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
  console.log(values);

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
      message: "Dados atualizados com sucesso",
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

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

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
      { expiresIn: "24h" },
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
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

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

export const requestPasswordReset = async (req: Request, res: Response) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email é obrigatório",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Se o email existir, enviaremos as instruções de reset.",
      });
    }

    const { token, tokenHash } = createPasswordToken();
    setPasswordTokenData(user, "reset-password", tokenHash);
    await user.save();

    const resetLink = `${getFrontendBaseUrl()}/reset-senha/${token}`;

    await sendTemplateEmail({
      to: user.email,
      subject: "Redefinição de senha",
      title: "Solicitação de redefinição de senha",
      description:
        "Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para continuar.",
      actionUrl: resetLink,
      actionLabel: "Redefinir senha",
      supportText:
        "Se você não solicitou essa alteração, ignore este e-mail com segurança.",
    });

    return res.status(200).json({
      success: true,
      message: "Email de reset enviado com sucesso.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao solicitar redefinição de senha",
      error: error.message,
    });
  }
};

export const validatePasswordToken = async (req: Request, res: Response) => {
  const token = String(req.body?.token || "").trim();
  const type = parsePasswordTokenType(req.body?.type);

  if (!token || !type) {
    return res.status(400).json({
      success: false,
      message: "Token e tipo são obrigatórios",
    });
  }

  try {
    const user = await findUserByValidToken(token, type);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao validar token",
      error: error.message,
    });
  }
};

export const consumePasswordToken = async (req: Request, res: Response) => {
  const token = String(req.body?.token || "").trim();
  const type = parsePasswordTokenType(req.body?.type);
  const newPassword = String(req.body?.newPassword || "");

  if (!token || !type || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Token, tipo e nova senha são obrigatórios",
    });
  }

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "A nova senha deve conter pelo menos 1 letra maiúscula, 1 caractere especial, 1 número e mínimo de 8 caracteres",
    });
  }

  try {
    const user = await findUserByValidToken(token, type);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    user.password = newPassword;
    clearPasswordTokenData(user, type);
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        type === "first-access"
          ? "Senha cadastrada com sucesso"
          : "Senha redefinida com sucesso",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao consumir token de senha",
      error: error.message,
    });
  }
};

export const sendTestEmail = async (req: Request, res: Response) => {
  const to = String(req.body?.to || "")
    .trim()
    .toLowerCase();
  const actionUrl = String(
    req.body?.actionUrl || "http://localhost:3000/cadastro-senha/token",
  ).trim();
  const subject = String(req.body?.subject || "Teste de envio de e-mail");

  if (!to) {
    return res.status(400).json({
      success: false,
      message: "Campo 'to' é obrigatório",
    });
  }

  try {
    await sendTemplateEmail({
      to,
      subject,
      title: "Teste de template Resend LUCAS",
      description:
        "Este e-mail é um teste manual disparado pelo Postman para validar integração com Resend.",
      actionUrl,
      actionLabel: "Abrir link de teste",
      supportText: "Se recebeu, a integração está funcionando corretamente.",
    });

    return res.status(200).json({
      success: true,
      message: "E-mail de teste enviado com sucesso.",
      data: {
        to,
        subject,
        actionUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar e-mail de teste",
      error: error.message,
    });
  }
};
