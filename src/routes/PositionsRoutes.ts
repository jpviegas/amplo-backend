import express from "express";
import {
  deletePosition,
  getAllPositions,
  getPosition,
  registerPosition,
  updatePosition,
} from "../controllers/positionsController";

const router = express.Router();

router.get("/", getAllPositions);
router.get("/:id", getPosition);
router.patch("/:id", updatePosition);
router.post("/", registerPosition);
router.delete("/:id", deletePosition);

export default router;
