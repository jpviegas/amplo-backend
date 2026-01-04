import express from "express";
import {
  createTraining,
  getAllTrainings,
  getTrainingById,
} from "../controllers/trainingController";

const router = express.Router();

router.get("/", getAllTrainings);
router.get("/:id", getTrainingById);
router.post("/", createTraining);

export default router;
