import express from "express";
import {
  deletePosition,
  getAllPositions,
  getPositionById,
  registerPosition,
  updatePosition,
} from "../controllers/positionsController";

const router = express.Router();

router.get("/", getAllPositions);
router.get("/:id", getPositionById);
router.patch("/:id", updatePosition);
router.post("/", registerPosition);
router.delete("/:id", deletePosition);

export default router;
