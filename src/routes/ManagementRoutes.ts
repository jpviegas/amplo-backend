import express from "express";
import {
  createManagement,
  deleteManagement,
  getAllManagements,
  getAllPointsByUserId,
  getManagementById,
  getPointsById,
  updateManagement,
  updatePointById,
} from "../controllers/managementController";

const router = express.Router();

router.get("/", getAllManagements);
router.get("/points/user/:userId", getAllPointsByUserId);
router.get("/points/:id", getPointsById);
router.patch("/points/:id", updatePointById);
router.get("/:id", getManagementById);
router.post("/", createManagement);
router.patch("/:id", updateManagement);
router.delete("/:id", deleteManagement);

export default router;
