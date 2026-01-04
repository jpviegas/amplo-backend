import express from "express";
import {
  getAllDepartments,
  getDepartment,
  registerDepartment,
} from "../controllers/departmentController";

const router = express.Router();

router.get("/", getAllDepartments);
router.get("/:id", getDepartment);
router.post("/", registerDepartment);

export default router;
