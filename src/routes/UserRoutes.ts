import express from "express";
import {
  authUser,
  changePassword,
  getAllUsers,
  getUserById,
  registerUser,
  updateUser,
} from "../controllers/userController";

const router = express.Router();

// router.use(protect);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/login", authUser);
router.post("/register", registerUser);
router.patch("/:id", updateUser);
router.patch("/change-password/:id", changePassword);

export default router;
