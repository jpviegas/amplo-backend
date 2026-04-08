import express from "express";
import {
  createHour,
  deleteHour,
  getAllHours,
  updateHour,
} from "../controllers/hoursController";

const router = express.Router();

router.get("/", getAllHours);
router.post("/", createHour);
router.patch("/:id", updateHour);
router.delete("/:id", deleteHour);

export default router;
