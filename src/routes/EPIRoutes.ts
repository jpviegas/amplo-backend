import express from "express";
import {
  createEPI,
  deleteEPI,
  getAllEPIs,
  getEPIById,
  updateEPI,
} from "../controllers/episController";

const router = express.Router();

router.get("/", getAllEPIs);
router.get("/:id", getEPIById);
router.post("/", createEPI);
router.patch("/:id", updateEPI);
router.delete("/:id", deleteEPI);

export default router;
