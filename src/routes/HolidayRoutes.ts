import express from "express";
import {
  createHoliday,
  deleteHoliday,
  getAllHolidays,
  getHolidayById,
  updateHoliday,
} from "../controllers/holidayController";

const router = express.Router();

router.get("/", getAllHolidays);
router.get("/:id", getHolidayById);
router.post("/", createHoliday);
router.patch("/:id", updateHoliday);
router.delete("/:id", deleteHoliday);

export default router;
