import express from "express";
import {
  createAbono,
  getAbonoById,
  getAbonoByUserId,
  getAllAbonos,
} from "../controllers/abonoController";

const router = express.Router();

router.get("/", getAllAbonos);
router.post("/", createAbono);
router.get("/:id", getAbonoByUserId);
router.get("/:userId/:id", getAbonoById);

export default router;
