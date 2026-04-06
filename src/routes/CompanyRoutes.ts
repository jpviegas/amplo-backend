import express from "express";
import {
  deleteCompany,
  getAllCompanies,
  getCompanyById,
  registerCompany,
  updateCompany,
} from "../controllers/companyController";

const router = express.Router();

router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.post("/", registerCompany);
router.patch("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
