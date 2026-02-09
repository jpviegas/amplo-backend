import express from "express";
import { createNotice, getAllNotices } from "../controllers/noticeController";

const router = express.Router();

router.get("/", getAllNotices);
router.post("/", createNotice);

export default router;
