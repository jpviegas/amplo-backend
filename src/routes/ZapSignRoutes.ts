import { Router } from "express";
import { upload } from "../config/upload";
import {
  listDocuments,
  postDocuments,
  zapSignWebhook,
} from "../controllers/zapSignController";

const router = Router();

router.post("/documents", upload.single("file"), postDocuments);
router.get("/documents", listDocuments);
router.post("/webhooks/zapsign", zapSignWebhook);

export default router;
