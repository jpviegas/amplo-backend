import express from "express";
import {
  createManagement,
  deleteManagement,
  getAllManagements,
  getManagementById,
  updateManagement,
} from "../controllers/managementController";

const router = express.Router();

router.get("/", getAllManagements);
router.get("/:id", getManagementById);
router.post("/", createManagement);
router.patch("/:id", updateManagement);
router.delete("/:id", deleteManagement);

export default router;
