import express from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  getServicesByUser,
  updateService,
} from "../controllers/serviceController";

const router = express.Router();

router.get("/", getAllServices);
router.get("/user/:id", getServicesByUser);
router.get("/:id", getServiceById);
router.post("/", createService);
router.patch("/:id", updateService);

export default router;
