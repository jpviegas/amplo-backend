import express from "express";
import {
  getAllTimesheets,
  getPointHistoryByUser,
  getTimesheetByUser,
  registerPoint,
} from "../controllers/pointController";

const router = express.Router();

router.get("/", getAllTimesheets);
router.get("/history/:userId", getPointHistoryByUser);
router.get("/:id", getTimesheetByUser);
router.post("/register", registerPoint);

export default router;
