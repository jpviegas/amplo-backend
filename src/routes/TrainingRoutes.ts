import express from "express";
import {
  createTraining,
  deleteTraining,
  getAllTrainings,
  getTrainingById,
  updateTraining,
} from "../controllers/trainingController";

const router = express.Router();

router.get("/", getAllTrainings);
router.get("/:id", getTrainingById);
router.post("/", createTraining);
router.patch("/:id", updateTraining);
router.delete("/:id", deleteTraining);

export default router;
