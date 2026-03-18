import express from "express";
import {
  deleteDepartment,
  getAllDepartments,
  getDepartment,
  registerDepartment,
  updateDepartment,
} from "../controllers/departmentController";

const router = express.Router();

router.get("/", getAllDepartments);
router.get("/:id", getDepartment);
router.patch("/:id", updateDepartment);
router.post("/", registerDepartment);
router.delete("/:id", deleteDepartment);

export default router;
