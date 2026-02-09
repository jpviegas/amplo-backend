import express from "express";
import {
  createCity,
  getAllCities,
  updateCity,
} from "../controllers/citiesController";

const router = express.Router();

// router.use(protect);
router.get("/", getAllCities);
router.post("/", createCity);
router.patch("/:id", updateCity);

export default router;
