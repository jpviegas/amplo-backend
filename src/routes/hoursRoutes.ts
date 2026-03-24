import express from "express";
import {
  createHour,
  getAllHours,
  updateHour,
} from "../controllers/hoursController";

const router = express.Router();

router.get("/", getAllHours);
router.post("/", createHour);
router.patch("/:id", updateHour);

export default router;
