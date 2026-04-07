import express from "express";
import {
  createCity,
  deleteCity,
  getAllCities,
  getCityById,
  updateCity,
} from "../controllers/citiesController";

const router = express.Router();

// router.use(protect);
router.get("/", getAllCities);
router.get("/:id", getCityById);
router.post("/", createCity);
router.patch("/:id", updateCity);
router.delete("/:id", deleteCity);

export default router;
