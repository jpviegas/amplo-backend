import express from "express";
import {
  createAbono,
  getAbonoById,
  getAllAbonos,
} from "../controllers/abonoController";

const router = express.Router();

router.get("/", getAllAbonos);
router.post("/", createAbono);
router.get("/:id", getAbonoById);

export default router;
