import { Router } from "express";
import { upload } from "../config/upload";
import { postDocuments, zapSignWebhook } from "../controllers/zapSignController";

const router = Router();

router.post("/documents", upload.single("file"), postDocuments);
router.post("/webhooks/zapsign", zapSignWebhook);

export default router;

