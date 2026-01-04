import express from "express";
import {
  getAllTransportes,
  getTransporteById,
} from "../controllers/transporteController";

const router = express.Router();

router.get("/", getAllTransportes);
router.get("/:id", getTransporteById);

export default router;
