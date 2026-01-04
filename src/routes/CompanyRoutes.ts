import express from "express";
import {
  getAllCompanies,
  getCompanyById,
  registerCompany,
} from "../controllers/companyController";

const router = express.Router();

router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.post("/", registerCompany);

export default router;
