import express from "express";
import {
  createNotice,
  deleteNotice,
  getAllNotices,
  updateNotice,
} from "../controllers/noticeController";

const router = express.Router();

router.get("/", getAllNotices);
router.post("/", createNotice);
router.patch("/:id", updateNotice);
router.delete("/:id", deleteNotice);

export default router;
