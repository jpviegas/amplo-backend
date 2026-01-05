import express from "express";
import {
  createService,
  getAllServices,
  getServiceById,
} from "../controllers/serviceController";

const router = express.Router();

router.get("/", getAllServices);
router.post("/", createService);
router.get("/:id", getServiceById);

export default router;
