import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser | null;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  if (req.headers.authorization) {
    try {
      token = req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

      const email = (token || "").toLowerCase().trim();
      if (!email) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      req.user = await User.findOne({ email }).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Não autorizado" });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: "Não autorizado" });
    }
  } else {
    res.status(401).json({ message: "Não autorizado" });
  }
};
