import express from "express";
import {
  createHour,
  deleteHour,
  getAllHours,
  getHourById,
  updateHour,
} from "../controllers/hoursController";

const router = express.Router();

router.get("/", getAllHours);
router.get("/:id", getHourById);
router.post("/", createHour);
router.patch("/:id", updateHour);
router.delete("/:id", deleteHour);

export default router;
