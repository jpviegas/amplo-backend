import express from "express";
import {
  createService,
  getServiceById,
  getServicesByUser,
} from "../controllers/serviceController";

const router = express.Router();

router.post("/", createService);
router.get("/user/:id", getServicesByUser);
router.get("/:id", getServiceById);

export default router;
