import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser | null;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (req.headers.authorization) {
    try {
      token = req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

      req.user = await User.findById(token).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, invalid ID" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};
