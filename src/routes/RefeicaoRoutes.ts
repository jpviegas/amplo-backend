import express from "express";
import {
  getAllRefeicoes,
  getRefeicaoById,
} from "../controllers/refeicaoController";

const router = express.Router();

router.get("/", getAllRefeicoes);
router.get("/:id", getRefeicaoById);
// router.post("/", createNotice);

export default router;
